import { ApiError, type Discoverability, type Locale } from '@/data';

/** Hata nesnesinden kullanıcıya gösterilecek metin (ApiError zaten Türkçe) */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Şu an kaydedilemedi. Bağlantını kontrol edip tekrar dene.';
}

export const DISCOVERABILITY_OPTIONS: { value: Discoverability; label: string; detail: string }[] = [
  { value: 'everyone', label: 'Herkes', detail: 'Kullanıcı adınla arayan herkes seni bulabilir.' },
  { value: 'nobody', label: 'Hiç kimse', detail: 'Aramada çıkmazsın. Arkadaşların seni davet bağlantınla ekler.' },
];

export const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
];

export const labelOf = <T extends string>(options: { value: T; label: string }[], value: T | undefined) =>
  options.find((o) => o.value === value)?.label ?? '';

/** Varsayılan günlük hatırlatma saati (Settings.dc.html: 21:00) */
export const DEFAULT_REMINDER = '21:00';

/**
 * Hatırlatma saati seçenekleri: sessiz saatler (23:30–08:00) dışında kalan saat başları.
 * Sessiz saat kuralı sunucuda; burada yalnızca o aralıkta saat önerilmez.
 */
export const REMINDER_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const value = `${String(8 + i).padStart(2, '0')}:00`;
  return { value, label: value };
});

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

/** "SİL" yazıldı mı (Türkçe klavye "SİL", İngilizce klavye "SIL" üretir) */
export function isDeleteConfirmed(raw: string): boolean {
  const v = raw.trim().toLocaleUpperCase('tr-TR');
  return v === 'SİL' || v === 'SIL';
}
