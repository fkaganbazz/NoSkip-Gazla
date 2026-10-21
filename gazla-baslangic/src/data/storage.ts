/**
 * Uygulamanın tek MMKV örneği (id 'gazla'; web'de localStorage, `gazla\` önekiyle). Eşzamanlı,
 * küçük yerel veriler için: çevrimdışı işaretleme kuyruğu (`offlineQueue.ts`). Anahtarlar
 * kalıcıdır; yeniden adlandırırken eskisini taşı.
 *
 * `readJson`/`writeJson` hata fırlatmaz (web'de sunucu tarafı çizim, erişimi kapalı depolama):
 * okunamayan değer "yok" sayılır, yazılamayan değer yalnızca bellekte kalır.
 */
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'gazla' });

export function readJson<T>(key: string): T | undefined {
  try {
    const raw = storage.getString(key);
    return raw === undefined ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch {
    // yok say: değer bu oturumda bellekte kalır
  }
}

export function removeKey(key: string): void {
  try {
    storage.remove(key);
  } catch {
    // yok say
  }
}
