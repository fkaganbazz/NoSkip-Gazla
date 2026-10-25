/**
 * Challenge detayının metin ve görünüm kuralları. Gün numarası, durum (başlamadı / sürüyor / bitti) ve
 * seri sunucudan gelir (challenge_detail, challenge_board); burada yalnızca takvim hücrelerinin tarihleri
 * ve metinler kurulur. Metinler sözlükten (`t.challenge`, `t.common.dates`); `t` verilmezse o anki dil.
 */
import type { BoardMember, Challenge, ChallengeCalendar, LocalDate } from '@/data';
import { getT, type Messages } from '@/i18n';
import { toAccusative } from '@/i18n/trGrammar';

/** Cihazın yerel günü 'YYYY-MM-DD' */
export function isoDate(d: Date): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = date.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + days));
}

/** "28 Eylül" / "September 28" */
export function formatShortDate(date: LocalDate, t: Messages = getT()) {
  const [y, m, d] = date.split('-').map(Number);
  return t.common.dates.dayMonth(new Date(y, m - 1, d));
}

/**
 * Türkçe belirtme hali: "Ece'yi", "Mert'i", "Can'ı", "Selin'i" (`@/i18n/trGrammar`). Yalnızca Türkçe metinde;
 * İngilizce metin adı eksiz kullanır (sözlükteki fonksiyonlar: `t.challenge.detail.pokeName`).
 */
export const accusative = toAccusative;

/**
 * "Mert", "Mert ve Can", "Mert, Can ve Selin", "Mert, Can ve 2 kişi daha"
 * ("Mert and Can", "Mert, Can and Selin", "Mert, Can and 2 more")
 */
export function joinNames(names: string[], max = 3, t: Messages = getT()) {
  const w = t.challenge.names;
  if (names.length <= 1) return names[0] ?? '';
  if (names.length <= max) return w.pair(names.slice(0, -1).join(', '), names[names.length - 1]);
  return w.pair(names.slice(0, max - 1).join(', '), w.more(names.length - (max - 1)));
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
export function boardRowInfo(member: BoardMember, running: boolean, t: Messages) {
  if (running && !member.doneToday) {
    return { sub: t.challenge.board.waiting(member.streak), tone: 'waiting' as const };
  }
  // Seri, tamamlanan gün sayısından kısaysa arada kopmuş demektir
  if (member.streak < member.daysDone) {
    return { sub: t.challenge.board.broken, tone: 'broken' as const };
  }
  return { sub: null, tone: 'ok' as const };
}
