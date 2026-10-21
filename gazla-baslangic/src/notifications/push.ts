/**
 * Bildirim izni ve Expo push token'ı (iOS / Android). Web eşi `push.web.ts`: tarayıcı izni, token yok.
 *
 * - İzin: `requestPushPermission()` önce Android kanallarını kurar (Android 13+'ta kanal yoksa pencere çıkmaz),
 *   sonra sistem penceresini açar. iOS'ta "geçici" (provisional) izin de izin sayılır.
 * - Token: yalnızca fiziksel cihazda (`expo-device`) ve EAS proje kimliği varsa
 *   (`extra.eas.projectId`, app.config). Yoksa null döner; proje kimliği eksikse geliştiriciye uyarı yazılır.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ensureNotificationChannels } from './channels';

export type PushPlatform = 'ios' | 'android';

/** Push token'ın kaydedildiği platform; token alınamayan platformda null */
export const pushPlatform: PushPlatform | null = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : null;

export type PushToken = { token: string; platform: PushPlatform };

/** Uygulamanın EAS proje kimliği (Expo push token'ı bu projeye bağlanır) */
export function easProjectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: unknown } } | undefined;
  const id = extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}

function allowed(status: Notifications.NotificationPermissionsStatus): boolean {
  const ios = status.ios?.status;
  return (
    status.granted ||
    ios === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    ios === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

/** İzin şu an verili mi (pencere açmaz) */
export async function hasPushPermission(): Promise<boolean> {
  try {
    return allowed(await Notifications.getPermissionsAsync());
  } catch {
    return false;
  }
}

/** İzni ister; verildiyse true. Daha önce reddedildiyse sistem pencere açmadan "hayır" döner. */
export async function requestPushPermission(): Promise<boolean> {
  try {
    await ensureNotificationChannels();
  } catch {
    // kanal kurulamazsa izin yine istenir (Android 12 ve altında kanal izin için gerekmez)
  }
  const current = await Notifications.getPermissionsAsync();
  if (allowed(current)) return true;
  const next = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return allowed(next);
}

let warnedNoProjectId = false;

/** Son alınan cihaz token'ı (APNs / FCM): yenilenme dinleyicisi aynı token için tekrar çalışmasın */
let lastDeviceToken: string | null = null;
export const isNewDeviceToken = (data: string) => data !== lastDeviceToken;

/**
 * Bu cihazın Expo push token'ı. Simülatör/emülatörde, web'de ya da EAS proje kimliği yoksa null.
 * `devicePushToken`: yenilenen cihaz token'ı (addPushTokenListener) geldiyse onunla.
 * Ağ hatasında fırlatır (çağıran yakalar; bir sonraki açılışta yeniden denenir).
 */
export async function getPushToken(devicePushToken?: Notifications.DevicePushToken): Promise<PushToken | null> {
  if (!pushPlatform || !Device.isDevice) return null;
  const projectId = easProjectId();
  if (!projectId) {
    if (!warnedNoProjectId) {
      warnedNoProjectId = true;
      console.warn(
        '[bildirim] EAS proje kimliği yok (app.config → extra.eas.projectId); push token alınmadı. `eas init` ile ekleyin.',
      );
    }
    return null;
  }
  const device = devicePushToken ?? (await Notifications.getDevicePushTokenAsync());
  if (typeof device.data === 'string') lastDeviceToken = device.data;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId, devicePushToken: device });
  return { token: data, platform: pushPlatform };
}
