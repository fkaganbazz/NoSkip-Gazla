/**
 * Uygulama açılışındaki bildirim işleri (iOS / Android; web eşi boş). Kök düzende (`app/_layout.tsx`
 * RootNavigator) bir kez, koşulsuz çağrılır:
 *
 *   useNotificationsBootstrap({ canNavigate: fontsReady && authReady && appOpen });
 *
 * - Ön planda gelen bildirim de gösterilir (banner + liste + ses).
 * - Android kanalları kurulur (Genel, Diken, Arkadaşlar).
 * - Bildirime dokununca `data.url`'deki ekran açılır (`links.ts`); uygulama kapalıyken dokunulduysa açılışta
 *   (`getLastNotificationResponseAsync`). Gezinme hazır değilse (açılış ekranı, onboarding, oturum yok) yol
 *   bekletilir, `canNavigate` true olunca açılır; oturum kapanırsa bekleyen yol unutulur.
 * - Oturum hazırken izin zaten verildiyse push token tazelenir (açılışta ve uygulama öne gelince, oturum başına
 *   bir kez); cihaz token'ı yenilenirse yeniden kaydedilir.
 */
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { INVITE_BASE_URL, WEB_BASE_URL } from '@/config/links';
import { useAuth, useRegisterPushTokenMutation } from '@/data';

import { ensureNotificationChannels } from './channels';
import { notificationPath, type LinkOrigins } from './links';
import { getPushToken, hasPushPermission, isNewDeviceToken, pushPlatform } from './push';
import { markRegistered, resetRegistration, wasRegistered } from './registration';

export type NotificationsBootstrapOptions = {
  /** Uygulama gezinmesi hazır ve kullanıcı uygulama ekranlarını görebilir (oturum + profil + onboarding bitti) */
  canNavigate: boolean;
};

let handlerSet = false;

/** Uygulama açıkken gelen bildirim de banner olarak gösterilsin */
function showWhileForeground() {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const hostOf = (url: string) => /^https?:\/\/([^/:]+)/i.exec(url)?.[1] ?? null;

function linkOrigins(): LinkOrigins {
  const scheme = Constants.expoConfig?.scheme;
  const schemes = (Array.isArray(scheme) ? scheme : [scheme]).filter((s): s is string => typeof s === 'string' && !!s);
  const hosts = [hostOf(WEB_BASE_URL), hostOf(INVITE_BASE_URL)].filter((h): h is string => !!h);
  return { schemes: schemes.length ? schemes : ['gazla'], hosts: [...new Set(hosts)] };
}

/** Aynı dokunuş iki kez açılmasın (açılış yanıtı + dinleyici, yeniden bağlanan kanca) */
let lastHandledResponse: string | null = null;

const responseKey = (response: Notifications.NotificationResponse) =>
  `${response.notification.request.identifier}:${response.notification.date}:${response.actionIdentifier}`;

export function useNotificationsBootstrap({ canNavigate }: NotificationsBootstrapOptions) {
  const router = useRouter();
  const { status, session } = useAuth();
  const userId = status === 'ready' ? (session?.userId ?? null) : null;
  const { mutateAsync: registerToken } = useRegisterPushTokenMutation();

  const pendingPath = useRef<string | null>(null);
  const canNavigateRef = useRef(canNavigate);

  // Ön plan gösterimi ve Android kanalları
  useEffect(() => {
    showWhileForeground();
    ensureNotificationChannels().catch(() => {});
  }, []);

  // Bildirime dokunma: açılıştaki son yanıt + uygulama açıkken gelenler
  useEffect(() => {
    const origins = linkOrigins();
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const key = responseKey(response);
      if (key === lastHandledResponse) return;
      lastHandledResponse = key;
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
      const path = notificationPath(response.notification.request.content.data, origins);
      if (!path) return;
      if (canNavigateRef.current) router.push(path as Href);
      else pendingPath.current = path;
    };
    let active = true;
    Notifications.getLastNotificationResponseAsync()
      .then((response) => active && open(response))
      .catch(() => {});
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => {
      active = false;
      subscription.remove();
    };
  }, [router]);

  // Bekleyen yol: gezinme hazır olunca açılır; oturum kapanınca unutulur
  useEffect(() => {
    canNavigateRef.current = canNavigate;
    if (status === 'signedOut') {
      pendingPath.current = null;
      resetRegistration();
      return;
    }
    if (!canNavigate || !pendingPath.current) return;
    const path = pendingPath.current;
    pendingPath.current = null;
    router.push(path as Href);
  }, [canNavigate, status, router]);

  // Push token tazeleme (izin zaten verildiyse; izin istemez)
  useEffect(() => {
    if (!userId || !pushPlatform) return;
    let active = true;
    let running = false;

    const refresh = async (devicePushToken?: Notifications.DevicePushToken) => {
      if (running && !devicePushToken) return;
      if (!devicePushToken && wasRegistered(userId)) return;
      running = true;
      try {
        if (!(await hasPushPermission())) return;
        const token = await getPushToken(devicePushToken);
        if (!token || !active) return;
        await registerToken(token);
        markRegistered(userId);
      } catch {
        // ağ yok ya da sunucu hatası: uygulama bir sonraki öne gelişte yeniden dener
      } finally {
        running = false;
      }
    };

    refresh();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const tokenListener = Notifications.addPushTokenListener((device) => {
      if (typeof device.data === 'string' && isNewDeviceToken(device.data)) refresh(device);
    });
    return () => {
      active = false;
      appState.remove();
      tokenListener.remove();
    };
  }, [userId, registerToken]);
}
