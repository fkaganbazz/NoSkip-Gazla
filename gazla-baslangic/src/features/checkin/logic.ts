/**
 * İşaretleme ekranlarının küçük yardımcıları: sayı biçimi, birim adları, yerel gün aritmetiği.
 * İş kuralı yok; hedef ve gün numarası sunucudan (my_today) gelir.
 */
import type { Checkin, LocalDate } from '@/data';

/** 70 → "70", 2.5 → "2,5" */
export function formatNumber(n: number) {
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
}

const UNIT_NAMES: Record<string, string> = {
  sn: 'saniye',
  dk: 'dakika',
  sa: 'saat',
};

/** Erişilebilirlik etiketi için birimin açık adı ("sn" → "saniye") */
export function unitName(unit: string) {
  return UNIT_NAMES[unit] ?? unit;
}

/** Hedef çipinin metni (NumberEntry.dc.html renderVals) */
export function targetText(value: number, target: number, unit: string) {
  if (value > target) return `Hedefi ${formatNumber(value - target)} ${unit} geçtin`;
  if (value === target) return 'Tam hedefinde';
  return `Hedefe ${formatNumber(target - value)} ${unit} kaldı`;
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

/** Takvimdeki kendi değerlerinden "Dün" ve "En iyin" (yalnızca gösterim) */
export function pastValues(checkins: Checkin[], day: LocalDate) {
  const yesterday = addLocalDays(day, -1);
  let best: number | null = null;
  let previous: number | null = null;
  for (const c of checkins) {
    if (c.value === null || c.localDate >= day) continue;
    if (c.localDate === yesterday) previous = c.value;
    if (best === null || c.value > best) best = c.value;
  }
  return { yesterday: previous, best };
}

/** "22:31" */
export function formatClock(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
