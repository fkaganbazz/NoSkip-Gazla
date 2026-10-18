/**
 * An ekranlarının metin ve görünüm kuralları. Seri, gün durumu ve kurtarma hakkı sunucudan gelir
 * (my_streak, my_recent_days, my_pending_rescues); burada yalnızca gösterim kurulur.
 */
import type { LocalDate, RecentDay } from '@/data';

const WEEKDAY_SHORT = ['Pa', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

export type WeekCell = {
  key: LocalDate;
  label: string;
  isToday: boolean;
  state: 'done' | 'saved' | 'empty';
};

/** Completion seri kartındaki son 7 gün: "Sa Ça Pe Cu Ct Pa Bugün" */
export function weekCells(days: RecentDay[]): WeekCell[] {
  return days.map((d) => {
    const [y, m, day] = d.day.split('-').map(Number);
    const weekday = new Date(y, m - 1, day).getDay();
    const complete = d.required > 0 && d.covered >= d.required;
    return {
      key: d.day,
      label: d.isOpen ? 'Bugün' : WEEKDAY_SHORT[weekday],
      isToday: d.isOpen,
      state: complete ? (d.rescued > 0 ? 'saved' : 'done') : 'empty',
    };
  });
}

/** Kalan süre: "21 sa 40 dk", "40 dk" (aşağı yuvarlanır, en az 0) */
export function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} dk`;
  return minutes === 0 ? `${hours} sa` : `${hours} sa ${minutes} dk`;
}

/** "de/da" bağlacı son ünlüye göre: "Mert ve Can da", "Selin de" */
export function alsoParticle(text: string) {
  const vowels = [...text.toLocaleLowerCase('tr-TR')].filter((ch) => 'aeıioöuü'.includes(ch));
  const last = vowels[vowels.length - 1];
  return last && 'aıou'.includes(last) ? 'da' : 'de';
}
