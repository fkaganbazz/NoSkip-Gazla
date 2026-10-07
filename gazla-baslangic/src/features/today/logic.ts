/**
 * Bugün ekranının metin ve ifade kuralları — design/Today.dc.html'deki renderVals() mantığı,
 * görev sayısından bağımsız hale getirilmiş hali.
 */
import type { DikenMood } from '@/components/Diken';

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

/** "Pazartesi, 28 Eylül" */
export function formatDayLabel(now: Date) {
  return `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

/** Saate göre selamlama: 05–12 Günaydın, 12–18 İyi günler, diğer saatler İyi akşamlar */
export function greeting(now: Date) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) {
    return 'Günaydın';
  }
  if (hour >= 12 && hour < 18) {
    return 'İyi günler';
  }
  return 'İyi akşamlar';
}

/** Yerel gece yarısına kalan dakika (yukarı yuvarlanır) */
export function minutesUntilMidnight(now: Date) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 60000);
}

/** "1 sa 16 dk", "2 sa", "16 dk" */
export function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} dk`;
  }
  return minutes === 0 ? `${hours} sa` : `${hours} sa ${minutes} dk`;
}

export type HeroState = {
  title: string;
  sub: string;
  mood: DikenMood;
  /** Seri çipinde gösterilecek gün sayısı (bugün tamamlanınca bir artar) */
  streak: number;
};

/**
 * Kahraman kartı: kalan görev sayısına göre başlık, açıklama ve Diken'in ifadesi.
 * Tasarımda 3 görev için: 0 → susadı, 1 → hâlâ susuz, 2 → az kaldı, 3 → kana kana içti.
 */
export function heroState(done: number, total: number, streakDays: number, minutesLeft: number): HeroState {
  const remaining = total - done;
  if (remaining <= 0) {
    return {
      title: 'Diken kana kana içti',
      sub: `Bugün tamam. Serin ${streakDays + 1} gün oldu.`,
      mood: 'cosku',
      streak: streakDays + 1,
    };
  }
  const countdown = `${remaining} görev kaldı. Günün bitmesine ${formatDuration(minutesLeft)} var.`;
  if (done === 0) {
    return { title: 'Diken susadı', sub: countdown, mood: 'endise', streak: streakDays };
  }
  if (remaining === 1) {
    return {
      title: 'Az kaldı, bırakma',
      sub: 'Tek görev kaldı. Diken bardağı görüyor.',
      mood: 'mutlu',
      streak: streakDays,
    };
  }
  return { title: 'Diken hâlâ susuz', sub: countdown, mood: 'endise', streak: streakDays };
}
