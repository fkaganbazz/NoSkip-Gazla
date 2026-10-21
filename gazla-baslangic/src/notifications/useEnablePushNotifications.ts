import { useCallback, useRef, useState } from 'react';

import { useAuth, useRegisterPushTokenMutation } from '@/data';

import { getPushToken, requestPushPermission, type PushToken } from './push';
import { markRegistered } from './registration';

/**
 * Sonuç: `registered` izin verildi ve token kaydedildi · `granted` izin var ama token yok (web, simülatör, EAS proje
 * kimliği yok) ya da token şu an alınamadı/kaydedilemedi (açılışta yeniden denenir) · `denied` izin yok.
 */
export type EnablePushResult = 'registered' | 'granted' | 'denied';

/** Token alma + kayıt en çok bu kadar beklenir; sonra akış devam eder, kayıt arkada sürer ya da açılışta yeniden denenir */
export const TOKEN_WAIT_MS = 8000;

/**
 * İzin iste → (verildiyse) Expo push token al → `register` ile kaydet. Hata fırlatmaz.
 * Kanca dışında da (test) çağrılabilsin diye ayrı.
 */
export async function enablePushNotifications({
  register,
  userId,
  timeoutMs = TOKEN_WAIT_MS,
}: {
  register: (token: PushToken) => Promise<unknown>;
  userId: string | null;
  timeoutMs?: number;
}): Promise<EnablePushResult> {
  let granted = false;
  try {
    granted = await requestPushPermission();
  } catch {
    granted = false;
  }
  if (!granted) return 'denied';

  const registration = (async () => {
    const token = await getPushToken();
    if (!token) return false;
    await register(token);
    if (userId) markRegistered(userId);
    return true;
  })().catch(() => false);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  const registered = await Promise.race([registration, timeout]);
  clearTimeout(timer);
  return registered ? 'registered' : 'granted';
}

/**
 * "Bildirimlere izin ver" (NotifPermission; ileride Ayarlar): `enable()` izni ister, verildiyse token'ı
 * `register_push_token` ile kaydeder. Ekran sonuca bakmadan devam edebilir.
 */
export function useEnablePushNotifications() {
  const { session } = useAuth();
  const { mutateAsync: registerToken } = useRegisterPushTokenMutation();
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const userId = session?.userId ?? null;

  const enable = useCallback(async (): Promise<EnablePushResult> => {
    if (busy.current) return 'granted';
    busy.current = true;
    setPending(true);
    try {
      return await enablePushNotifications({ register: registerToken, userId });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }, [registerToken, userId]);

  return { enable, pending };
}
