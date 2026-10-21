/**
 * Son bilinen oturum (MMKV). Çevrimdışı açılışta Supabase süresi dolmuş erişim belirtecini
 * yenileyemez ve oturumu `null` döndürür; kullanıcı aslında çıkış yapmadı. DataProvider bu
 * durumda kayıtlı oturumla devam eder (önbellekteki profil ve Bugün verisiyle `ready`), bağlantı
 * gelince oturumu yeniden sorar.
 *
 * Bilerek çıkışta (oturumu kapat, hesabı sil) önce `forgetSession()` çağrılır; yoksa çevrimdışı
 * çıkış "belirteç yenilenemedi" sanılıp yok sayılırdı.
 */
import { readJson, removeKey, writeJson } from './storage';
import type { Session } from './types';

const KEY = 'auth.lastSession.v1';

export function rememberSession(session: Session): void {
  const saved = readJson<Session>(KEY);
  if (saved?.userId !== session.userId || saved.email !== session.email) writeJson(KEY, session);
}

export function lastSession(): Session | null {
  const saved = readJson<Session>(KEY);
  return saved && typeof saved.userId === 'string' ? saved : null;
}

export function forgetSession(): void {
  removeKey(KEY);
}
