/**
 * Challenge detayının metin ve görünüm kuralları. Gün numarası ve seri sunucudan gelir
 * (my_today, challenge_board); burada yalnızca takvim hücrelerinin tarihleri ve metinler kurulur.
 */
import type {
  BoardMember,
  Challenge,
  ChallengeCalendar,
  ChallengeCategory,
  ChallengeMembership,
  LocalDate,
  TodayTask,
} from '@/data';

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
 * Takvim: her gün için kendi işaretlemem / kurtarmam. Bugün tamamsa yeşil (sarı halkalı), değilse
 * numaralı (sarı halkalı). Kaçırılan geçmiş günler için tasarımda ayrı görünüm yok; numaralı gösterilir.
 */
export function buildDays(challenge: Challenge, calendar: ChallengeCalendar | undefined, today: LocalDate): DayCell[] {
  const done = new Set(calendar?.checkins.map((c) => c.localDate));
  const saved = new Set(calendar?.rescues.map((r) => r.rescuedDate));
  return Array.from({ length: challenge.durationDays }, (_, i) => {
    const date = addDays(challenge.startDate, i);
    const isToday = date === today;
    const state: DayCell['state'] = isToday
      ? done.has(date) || saved.has(date)
        ? 'today'
        : 'todayOpen'
      : done.has(date)
        ? 'done'
        : saved.has(date)
          ? 'saved'
          : 'future';
    return { n: i + 1, date, state };
  });
}

export type ChallengePhase =
  | { kind: 'running'; dayIndex: number; daysLeft: number }
  | { kind: 'upcoming'; startDate: LocalDate }
  | { kind: 'finished' };

/**
 * Challenge'ın durumu. Gün numarası my_today'den gelir; bugün görevi yoksa challenge ya bitmiştir
 * (üyelikte finishedAt ya da bitiş günü geçmiş) ya da henüz başlamamıştır.
 */
export function challengePhase(
  challenge: Challenge,
  membership: ChallengeMembership | null | undefined,
  task: TodayTask | undefined,
  today: LocalDate,
): ChallengePhase {
  if (membership?.finishedAt || challenge.endDate < today) return { kind: 'finished' };
  if (task) {
    const dayIndex = Math.min(task.dayIndex, task.durationDays);
    if (task.dayIndex > task.durationDays) return { kind: 'finished' };
    return { kind: 'running', dayIndex, daysLeft: task.durationDays - dayIndex };
  }
  if (challenge.startDate > today) return { kind: 'upcoming', startDate: challenge.startDate };
  // Ayrılmış üye: my_today satırı yok. Sunucu challenge için gün numarası döndürmediğinden
  // yalnızca gösterim amacıyla tarihten okunur (Backend boşluğu: challenges.day_index).
  const dayIndex = Math.min(daysBetween(challenge.startDate, today) + 1, challenge.durationDays);
  return { kind: 'running', dayIndex, daysLeft: challenge.durationDays - dayIndex };
}

function daysBetween(from: LocalDate, to: LocalDate) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** Grup satırının alt bilgisi ve sağdaki sayının görünümü */
export function boardRowInfo(member: BoardMember) {
  if (!member.doneToday) {
    return { sub: `${member.streak} gün · bugün bekliyor`, tone: 'waiting' as const };
  }
  // Seri, tamamlanan gün sayısından kısaysa arada kopmuş demektir
  if (member.streak < member.daysDone) {
    return { sub: 'Seri koptu, yeniden başladı', tone: 'broken' as const };
  }
  return { sub: null, tone: 'ok' as const };
}
