/** Davet karşılama metin kuralları — design/InviteLanding.dc.html */
import type { InvitePreview, LocalDate } from '@/data';
import type { Messages } from '@/i18n';

/** Cihazın yerel günü 'YYYY-MM-DD' (oturumsuz da açıldığı için kullanıcı saat dilimi yok) */
export function deviceLocalDate(d: Date = new Date()): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** İki yerel gün arasındaki gün farkı (b − a) */
function daysBetween(a: LocalDate, b: LocalDate) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** "Yarın başlıyor", "Bugün başlıyor", "3 gün sonra başlıyor", "Başladı" */
export function startLabel(t: Messages, startDate: LocalDate, today: LocalDate) {
  const tx = t.invite.landing;
  const diff = daysBetween(today, startDate);
  if (diff <= -1) return tx.started;
  if (diff === 0) return tx.startsToday;
  if (diff === 1) return tx.startsTomorrow;
  return tx.startsInDays(diff);
}

/** "10 gün · İşaretle · Yarın başlıyor" */
export function challengeMeta(t: Messages, challenge: InvitePreview['challenge'], today: LocalDate) {
  const type = t.invite.landing.taskTypes[challenge.taskType];
  return `${t.common.days(challenge.durationDays)} · ${type} · ${startLabel(t, challenge.startDate, today)}`;
}

/** Challenge'ın son günü geçti mi */
export const isEnded = (challenge: InvitePreview['challenge'], today: LocalDate) => challenge.endDate < today;
