/**
 * İşaretleme ekranlarının küçük yardımcıları: sayı biçimi, birim adları, yerel gün aritmetiği.
 * İş kuralı yok; hedef ve gün numarası sunucudan (my_today) gelir.
 */
import type { LocalDate } from '@/data';
import { formatNumber as formatLocaleNumber, type Language, type Messages } from '@/i18n';

/** 70 → "70", 2.5 → "2,5" (İngilizcede "2.5") */
export function formatNumber(n: number) {
  return formatLocaleNumber(n, { maximumFractionDigits: 4 });
}

/** Erişilebilirlik etiketi için birimin açık adı ("sn" → "saniye"); birim kullanıcı/şablon içeriği */
export function unitName(unit: string, t: Messages) {
  return t.checkin.unitNames[unit] ?? unit;
}

/** Hedef çipinin metni (NumberEntry.dc.html renderVals) */
export function targetText(value: number, target: number, unit: string, t: Messages) {
  const tt = t.checkin.number.target;
  if (value > target) return tt.over(formatNumber(value - target), unit);
  if (value === target) return tt.exact;
  return tt.under(formatNumber(target - value), unit);
}

/** 'YYYY-MM-DD' gününe gün ekler (yerel takvim, saat diliminden bağımsız) */
export function addLocalDays(day: LocalDate, delta: number): LocalDate {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + delta));
  return date.toISOString().slice(0, 10);
}

/** Cihazın bugünkü yerel günü */
export function deviceToday(now = new Date()): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "22:31" / "10:31 PM" */
export function formatClock(date: Date, lang: Language) {
  const pad = (n: number) => String(n).padStart(2, '0');
  if (lang === 'tr') return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const h = date.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(date.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
}
