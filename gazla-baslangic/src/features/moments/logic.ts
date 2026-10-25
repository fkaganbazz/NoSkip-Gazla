/**
 * An ekranlarının metin ve görünüm kuralları. Seri, gün durumu ve kurtarma hakkı sunucudan gelir
 * (my_streak, my_recent_days, my_pending_rescues); burada yalnızca gösterim kurulur.
 */
import type { LocalDate, RecentDay } from '@/data';
import type { Messages } from '@/i18n';

export type WeekCell = {
  key: LocalDate;
  label: string;
  isToday: boolean;
  state: 'done' | 'saved' | 'empty';
};

/** Completion seri kartındaki son 7 gün: "Sa Ça Pe Cu Ct Pa Bugün" / "Tu We Th Fr Sa Su Today" */
export function weekCells(days: RecentDay[], t: Messages): WeekCell[] {
  return days.map((d) => {
    const [y, m, day] = d.day.split('-').map(Number);
    const weekday = new Date(y, m - 1, day).getDay();
    const complete = d.required > 0 && d.covered >= d.required;
    return {
      key: d.day,
      label: d.isOpen ? t.common.dates.today : t.moments.weekdayShort[weekday],
      isToday: d.isOpen,
      state: complete ? (d.rescued > 0 ? 'saved' : 'done') : 'empty',
    };
  });
}

/** Kalan süre: "21 sa 40 dk", "40 dk" / "21h 40m", "40m" (aşağı yuvarlanır, en az 0) */
export function formatRemaining(ms: number, t: Messages) {
  const { hoursShort, minutesShort } = t.common.dates;
  const total = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return minutesShort(minutes);
  return minutes === 0 ? hoursShort(hours) : `${hoursShort(hours)} ${minutesShort(minutes)}`;
}
