/**
 * Challenge detayının metin ve görünüm kuralları. Gün numarası, durum (başlamadı / sürüyor / bitti) ve
 * seri sunucudan gelir (challenge_detail, challenge_board); burada yalnızca takvim hücrelerinin tarihleri
 * ve metinler kurulur.
 */
import type { BoardMember, Challenge, ChallengeCalendar, ChallengeCategory, LocalDate } from '@/data';

export const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  detox: 'Dijital detoks',
  social_courage: 'Sosyal cesaret',
  sport: 'Spor',
  food_drink: 'Yeme-içme',
  reading: 'Okuma',
  money: 'Para',
  quirky: 'Tuhaf ve eğlenceli',
};

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/** Cihazın yerel günü 'YYYY-MM-DD' */
export function isoDate(d: Date): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = date.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + days));
}

/** "28 Eylül" */
export function formatShortDate(date: LocalDate) {
  const [, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/**
 * Türkçe belirtme hali: "Ece'yi", "Mert'i", "Can'ı", "Selin'i" (son ünlüye göre, ünlüyle bitiyorsa -y-).
 * Yalnızca son ada eklenir: "Ece ve Selin'i".
 */
export function accusative(name: string) {
  const lower = name.toLocaleLowerCase('tr-TR');
  const vowels = 'aeıioöuü';
  const last = [...lower].reverse().find((ch) => vowels.includes(ch));
  const suffix = !last ? 'i' : 'aı'.includes(last) ? 'ı' : 'ei'.includes(last) ? 'i' : 'ou'.includes(last) ? 'u' : 'ü';
  const endsWithVowel = vowels.includes(lower.charAt(lower.length - 1));
  return `${name}'${endsWithVowel ? 'y' : ''}${suffix}`;
}

/** "Mert", "Mert ve Can", "Mert, Can ve Selin", "Mert, Can ve 2 kişi daha" */
export function joinNames(names: string[], max = 3) {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length <= max) return `${names.slice(0, -1).join(', ')} ve ${names[names.length - 1]}`;
  return `${names.slice(0, max - 1).join(', ')} ve ${names.length - (max - 1)} kişi daha`;
}

export type DayCell = {
  n: number;
  date: LocalDate;
  state: 'done' | 'saved' | 'today' | 'todayOpen' | 'future';
};

/**
 * Takvim: her gün için kendi işaretlemem / kurtarmam. Bugün (sunucunun gün numarası `todayIndex`; başlamamış
 * ya da bitmiş challenge'da null) tamamsa yeşil (sarı halkalı), değilse numaralı (sarı halkalı). Kaçırılan
 * geçmiş günler için tasarımda ayrı görünüm yok; numaralı gösterilir.
 */
export function buildDays(challenge: Challenge, calendar: ChallengeCalendar | undefined, todayIndex: number | null): DayCell[] {
  const done = new Set(calendar?.checkins.map((c) => c.localDate));
  const saved = new Set(calendar?.rescues.map((r) => r.rescuedDate));
  return Array.from({ length: challenge.durationDays }, (_, i) => {
    const n = i + 1;
    const date = addDays(challenge.startDate, i);
    const covered = done.has(date) || saved.has(date);
    const state: DayCell['state'] =
      n === todayIndex ? (covered ? 'today' : 'todayOpen') : done.has(date) ? 'done' : saved.has(date) ? 'saved' : 'future';
    return { n, date, state };
  });
}

export type ChallengePhase =
  | { kind: 'running'; dayIndex: number; daysLeft: number }
  | { kind: 'upcoming'; startDate: LocalDate }
  | { kind: 'finished'; dayIndex: number };

/** Challenge'ın durumu ve gün numarası: sunucudan (`challenge.status`, `challenge.dayIndex`), istemcide hesaplanmaz */
export function challengePhase(challenge: Challenge): ChallengePhase {
  if (challenge.status === 'finished') return { kind: 'finished', dayIndex: challenge.dayIndex };
  if (challenge.status === 'upcoming') return { kind: 'upcoming', startDate: challenge.startDate };
  const dayIndex = Math.max(1, Math.min(challenge.dayIndex, challenge.durationDays));
  return { kind: 'running', dayIndex, daysLeft: challenge.durationDays - dayIndex };
}

/** 'HH:MM:SS' gelirse 'HH:MM' */
export const hhmm = (time: string) => time.slice(0, 5);

/** Grup satırının alt bilgisi ve sağdaki sayının görünümü; "bugün bekliyor" yalnızca süren challenge'da */
export function boardRowInfo(member: BoardMember, running = true) {
  if (running && !member.doneToday) {
    return { sub: `${member.streak} gün · bugün bekliyor`, tone: 'waiting' as const };
  }
  // Seri, tamamlanan gün sayısından kısaysa arada kopmuş demektir
  if (member.streak < member.daysDone) {
    return { sub: 'Seri koptu, yeniden başladı', tone: 'broken' as const };
  }
  return { sub: null, tone: 'ok' as const };
}
