/**
 * Bu cihazın kayıtlı Expo push token'ı (MMKV). `useRegisterPushToken` sunucuya yazınca
 * saklanır; çıkışta (`useSignOut`) sunucudaki satır silinir (push_tokens owner delete) ki
 * cihaz el değiştirince eski hesabın bildirimleri gelmesin. Hesap silmede satır zincirleme silinir.
 */
import { readJson, removeKey, writeJson } from './storage';

const KEY = 'push.token.v1';

export type SavedPushToken = { token: string; platform: 'ios' | 'android' };

export function rememberPushToken(saved: SavedPushToken): void {
  writeJson(KEY, saved);
}

export function savedPushToken(): SavedPushToken | null {
  const saved = readJson<SavedPushToken>(KEY);
  return saved && typeof saved.token === 'string' ? saved : null;
}

export function forgetPushToken(): void {
  removeKey(KEY);
}
