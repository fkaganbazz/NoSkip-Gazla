import { ApiError, type DayEndGraceHours, type Discoverability } from '@/data';

/** Hata nesnesinden kullanıcıya gösterilecek metin (ApiError zaten Türkçe) */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Şu an kaydedilemedi. Bağlantını kontrol edip tekrar dene.';
}

export const DISCOVERABILITY_OPTIONS: { value: Discoverability; label: string; detail: string }[] = [
  { value: 'everyone', label: 'Herkes', detail: 'Kullanıcı adınla arayan herkes seni bulabilir.' },
  { value: 'nobody', label: 'Hiç kimse', detail: 'Aramada çıkmazsın. Arkadaşların seni davet bağlantınla ekler.' },
];

export const labelOf = <T extends string | number>(options: { value: T; label: string }[], value: T | undefined) =>
  options.find((o) => o.value === value)?.label ?? '';

/**
 * Gün bitişi toleransı (user_settings.day_end_grace_hours, 0/1/2, varsayılan 2): gece yarısından sonra
 * dünkü görevler bu kadar saat daha işaretlenebilir. Satır metni Settings.dc.html (+2 saat).
 */
export const DAY_END_OPTIONS: { value: DayEndGraceHours; label: string; detail: string }[] = [
  { value: 0, label: 'Gece yarısı', detail: "Gün 00:00'da biter." },
  { value: 1, label: '+1 saat', detail: "Dünü 01:00'e kadar işaretleyebilirsin." },
  { value: 2, label: '+2 saat', detail: "Dünü 02:00'ye kadar işaretleyebilirsin." },
];

/** Ayarlar satırındaki açıklama (2 saatte tasarımdaki metin) */
export const dayEndDetail = (hours: DayEndGraceHours) =>
  hours === 0
    ? 'Gün gece yarısında biter. Saat dilimine göre hesaplanır.'
    : `Gece yarısından sonra ${hours} saat daha işaretleyebilirsin. Saat dilimine göre hesaplanır.`;

/** Varsayılan günlük hatırlatma saati (Settings.dc.html: 21:00) */
export const DEFAULT_REMINDER = '21:00';

/** Hatırlatma saatleri arası adım (dakika) ve aralık: 08:00–23:00 */
export const REMINDER_STEP_MINUTES = 30;
const REMINDER_FIRST_MINUTE = 8 * 60;
const REMINDER_LAST_MINUTE = 23 * 60;

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * Hatırlatma saati seçenekleri — tek kaynak (Ayarlar → Bildirimler, Detail "…" → Hatırlatma saatini değiştir,
 * Create hatırlatma adımları): 08:00–23:00 arası 30 dakikalık adımlar. Sessiz saatler (23:30–08:00) önerilmez;
 * kural sunucuda.
 */
export const REMINDER_TIMES: readonly string[] = Array.from(
  { length: (REMINDER_LAST_MINUTE - REMINDER_FIRST_MINUTE) / REMINDER_STEP_MINUTES + 1 },
  (_, i) => clock(REMINDER_FIRST_MINUTE + i * REMINDER_STEP_MINUTES),
);

/**
 * Seçenek listesi; listede olmayan mevcut saat (ör. başka cihazdan 07:15) kaybolmasın diye sırasına eklenir.
 * 'HH:MM:SS' gelirse 'HH:MM'.
 */
export function reminderTimes(current: string | null): string[] {
  const now = current ? current.slice(0, 5) : null;
  return now && !REMINDER_TIMES.includes(now) ? [...REMINDER_TIMES, now].sort() : [...REMINDER_TIMES];
}

/** Bir sonraki / önceki seçenek (Create −/+); uçta aynı saat döner. Listede olmayan saat en yakın adıma oturur. */
export function stepReminder(current: string, direction: 1 | -1): string {
  const now = current.slice(0, 5);
  const i = REMINDER_TIMES.indexOf(now);
  if (i >= 0) return REMINDER_TIMES[Math.min(Math.max(i + direction, 0), REMINDER_TIMES.length - 1)];
  const next = direction > 0 ? REMINDER_TIMES.find((t) => t > now) : [...REMINDER_TIMES].reverse().find((t) => t < now);
  return next ?? now;
}

/** 'HH:MM:SS' gelirse 'HH:MM' göster */
export const formatTime = (time: string | null) => (time ? time.slice(0, 5) : 'Kapalı');

// Profil düzenleme ---------------------------------------------------------------------------------

/** profiles_username_format ile aynı: 3–20 karakter, küçük harf/rakam/nokta/alt çizgi */
const USERNAME_RE = /^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$/;

export const normalizeUsername = (raw: string) => raw.trim().replace(/^@/, '').toLowerCase();

export function usernameProblem(raw: string): string | null {
  const name = normalizeUsername(raw);
  if (name.length < 3) return 'En az 3 karakter olmalı';
  if (name.length > 20) return 'En fazla 20 karakter olabilir';
  if (!USERNAME_RE.test(name)) return 'Harf, rakam, nokta ve alt çizgi kullanabilirsin';
  return null;
}

export function displayNameProblem(raw: string): string | null {
  if (raw.trim().length === 0) return 'Adını yazmalısın';
  if (raw.length > 40) return 'En fazla 40 karakter olabilir';
  return null;
}

// Hesabı sil ---------------------------------------------------------------------------------------

/**
 * Onay metni tam olarak "SİL" mi: büyük harf ve noktalı İ ("sil", "Sil", "SIL" geçmez); yalnızca baştaki ve
 * sondaki boşluk yok sayılır. Bazı klavyelerin ayrık yazdığı İ (I + birleşik üst nokta, U+0307) de kabul.
 */
export function isDeleteConfirmed(raw: string): boolean {
  const v = raw.trim();
  return v === 'SİL' || v === 'SI\u0307L';
}
