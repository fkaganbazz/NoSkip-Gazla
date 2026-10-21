/**
 * Web eşi (`push.ts`): tarayıcının bildirim izni varsa istenir; push token yok (web push kurulmadı).
 * expo-notifications web'de içe aktarılmaz (açılışta token dinleyicisi uyarısı basıyor).
 */
import type { DevicePushToken } from 'expo-notifications';

export type PushPlatform = 'ios' | 'android';
export type PushToken = { token: string; platform: PushPlatform };

export const pushPlatform: PushPlatform | null = null;

type BrowserNotification = {
  permission: 'default' | 'denied' | 'granted';
  requestPermission: (callback?: (result: string) => void) => Promise<string> | undefined;
};

const browserNotification = (): BrowserNotification | null => {
  const api = (globalThis as { Notification?: BrowserNotification }).Notification;
  return api && typeof api.requestPermission === 'function' ? api : null;
};

export function easProjectId(): string | null {
  return null;
}

export const isNewDeviceToken = (_data: string) => false;

export async function hasPushPermission(): Promise<boolean> {
  return browserNotification()?.permission === 'granted';
}

export async function requestPushPermission(): Promise<boolean> {
  const api = browserNotification();
  if (!api) return false;
  if (api.permission !== 'default') return api.permission === 'granted';
  try {
    // Eski Safari geri çağırma ister, yenileri Promise döner
    const result = await new Promise<string>((resolve) => {
      const done = (value: string) => resolve(value);
      const maybe = api.requestPermission(done);
      if (maybe && typeof maybe.then === 'function') maybe.then(done, () => done('denied'));
    });
    return result === 'granted';
  } catch {
    return false;
  }
}

export async function getPushToken(_devicePushToken?: DevicePushToken): Promise<PushToken | null> {
  return null;
}
