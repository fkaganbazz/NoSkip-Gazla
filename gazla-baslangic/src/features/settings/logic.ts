import { ApiError, type DayEndGraceHours, type Discoverability } from '@/data';
import { getT, type Messages } from '@/i18n';

/** Hata nesnesinden kullanıcıya gösterilecek metin (ApiError zaten kullanıcı metni) */
export function errorText(error: unknown, t: Messages): string {
  if (error instanceof ApiError) return error.message;
  return t.settings.saveFailed;
}

export const discoverabilityOptions = (t: Messages): { value: Discoverability; label: string; detail: string }[] => [
  { value: 'everyone', label: t.settings.discoverability.everyone, detail: t.settings.discoverability.everyoneDetail },
  { value: 'nobody', label: t.settings.discoverability.nobody, detail: t.settings.discoverability.nobodyDetail },
];

export const labelOf = <T extends string | number>(options: { value: T; label: string }[], value: T | undefined) =>
  options.find((o) => o.value === value)?.label ?? '';

/**
 * Gün bitişi toleransı (user_settings.day_end_grace_hours, 0/1/2, varsayılan 2): gece yarısından sonra
 * dünkü görevler bu kadar saat daha işaretlenebilir. Satır metni Settings.dc.html (+2 saat).
 */
export const dayEndOptions = (t: Messages): { value: DayEndGraceHours; label: string; detail: string }[] => [
  { value: 0, label: t.settings.dayEnd.midnight, detail: t.settings.dayEnd.midnightDetail },
  { value: 1, label: t.settings.dayEnd.plusOne, detail: t.settings.dayEnd.plusOneDetail },
  { value: 2, label: t.settings.dayEnd.plusTwo, detail: t.settings.dayEnd.plusTwoDetail },
];

/** Ayarlar satırındaki açıklama (2 saatte tasarımdaki metin) */
export const dayEndDetail = (hours: DayEndGraceHours, t: Messages) =>
  hours === 0 ? t.settings.dayEnd.rowMidnight : t.settings.dayEnd.rowGrace(hours);

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

/** 'HH:MM:SS' gelirse 'HH:MM' göster; saat yoksa "Kapalı" */
export const formatTime = (time: string | null, t: Messages = getT()) => (time ? time.slice(0, 5) : t.settings.off);

// Profil düzenleme ---------------------------------------------------------------------------------

/** profiles_username_format ile aynı: 3–20 karakter, küçük harf/rakam/nokta/alt çizgi */
const USERNAME_RE = /^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$/;

export const normalizeUsername = (raw: string) => raw.trim().replace(/^@/, '').toLowerCase();

export function usernameProblem(raw: string, t: Messages): string | null {
  const name = normalizeUsername(raw);
  if (name.length < 3) return t.settings.profileEdit.usernameTooShort;
  if (name.length > 20) return t.settings.profileEdit.usernameTooLong;
  if (!USERNAME_RE.test(name)) return t.settings.profileEdit.usernameChars;
  return null;
}

export function displayNameProblem(raw: string, t: Messages): string | null {
  if (raw.trim().length === 0) return t.settings.profileEdit.nameRequired;
  if (raw.length > 40) return t.settings.profileEdit.nameTooLong;
  return null;
}

// Hesabı sil ---------------------------------------------------------------------------------------

/**
 * Onay metni tam olarak seçili dilin kelimesi mi (Türkçe "SİL", İngilizce "DELETE"): büyük harf, Türkçede
 * noktalı İ ("sil", "Sil", "SIL" geçmez); yalnızca baştaki ve sondaki boşluk yok sayılır. Bazı klavyelerin ayrık
 * yazdığı İ (I + birleşik üst nokta, U+0307) de kabul.
 */
export function isDeleteConfirmed(raw: string, word: string): boolean {
  const v = raw.trim();
  return v === word || v === word.replace(/İ/g, 'I\u0307');
}
