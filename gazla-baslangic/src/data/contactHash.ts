/**
 * Rehberden bul: e-postalar sunucuya açık gönderilmez, SHA-256 özetleri gider (`find_contacts`).
 * Sunucu `auth.users.email`'i aynı biçimde (kırpılmış, küçük harf) özetleyip karşılaştırır.
 */
import * as Crypto from 'expo-crypto';

/** Sunucunun kabul ettiği en çok özet sayısı (find_contacts) */
export const MAX_CONTACT_HASHES = 500;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** E-postayı karşılaştırma biçimine getirir; e-posta değilse null */
export function normalizeEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  return EMAIL.test(value) ? value : null;
}

/** Kırpılmış, küçük harf e-postanın SHA-256 özeti (küçük harf hex) */
export async function hashEmail(email: string): Promise<string> {
  const value = normalizeEmail(email) ?? email.trim().toLowerCase();
  const hex = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
  return hex.toLowerCase();
}

/** Rehberdeki e-postalar → tekilleştirilmiş özetler (en çok `MAX_CONTACT_HASHES`) */
export async function hashContactEmails(emails: string[]): Promise<string[]> {
  const unique = [...new Set(emails.map(normalizeEmail).filter((e): e is string => !!e))].slice(0, MAX_CONTACT_HASHES);
  return Promise.all(unique.map(hashEmail));
}
