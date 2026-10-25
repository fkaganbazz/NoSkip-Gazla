/**
 * Android bildirim kanalları. Kullanıcı Ayarlar → Bildirimler'de her kanalı ayrı kapatabilir; adlar ve açıklamalar
 * uygulama dilinde (sözlük: notifications.channels). Dil değişince kanallar aynı kimlikle yeniden kurulur: Android
 * yalnızca adı ve açıklamayı günceller, kullanıcının kanal ayarları (önem, ses, kapalı) korunur.
 * Sunucu push gönderirken `channelId` verir: Diken hatırlatmaları `diken`, dürtme / gaz / istek / davet `friends`,
 * diğerleri `default` (Expo push'ta `channelId` yoksa da `default`).
 *
 * Android 13+'ta izin penceresi en az bir kanal varken çıkar; bu yüzden izin istenmeden önce kanallar kurulur.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getLanguage, messagesFor, subscribeLanguage, type Language } from '@/i18n';

export const NOTIFICATION_CHANNELS = {
  default: 'default',
  diken: 'diken',
  friends: 'friends',
} as const;

export type NotificationChannelId = (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

type ChannelSpec = {
  id: NotificationChannelId;
  name: string;
  description: string;
  importance: Notifications.AndroidImportance;
};

/** Kanallar verilen dilde (Genel, Diken, Arkadaşlar / General, Diken, Friends) */
export function androidChannels(lang: Language): ChannelSpec[] {
  const c = messagesFor(lang).notifications.channels;
  return [
    {
      id: NOTIFICATION_CHANNELS.default,
      ...c.default,
      importance: Notifications.AndroidImportance.DEFAULT,
    },
    {
      id: NOTIFICATION_CHANNELS.diken,
      ...c.diken,
      importance: Notifications.AndroidImportance.HIGH,
    },
    {
      id: NOTIFICATION_CHANNELS.friends,
      ...c.friends,
      importance: Notifications.AndroidImportance.HIGH,
    },
  ];
}

let channelsReady: Promise<void> | null = null;
/** Kanalların en son kurulduğu dil */
let channelsLanguage: Language | null = null;
let stopWatching: (() => void) | null = null;

/** Dil değişince kanalları yeni adlarla yeniden kurar (ilk kurulumdan sonra) */
function watchLanguage() {
  if (stopWatching) return;
  stopWatching = subscribeLanguage(() => {
    if (getLanguage() !== channelsLanguage) ensureNotificationChannels().catch(() => {});
  });
}

/**
 * Kanalları o anki dilde kurar (Android dışında bir şey yapmaz). Uygulama açılışında bir kez yeter; dil değişince
 * kendiliğinden yenilenir; hata olursa bir sonraki çağrıda yeniden dener.
 */
export function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  const lang = getLanguage();
  if (!channelsReady || channelsLanguage !== lang) {
    channelsLanguage = lang;
    const ready: Promise<void> = Promise.all(
      androidChannels(lang).map(({ id, name, description, importance }) =>
        Notifications.setNotificationChannelAsync(id, { name, description, importance, showBadge: true }),
      ),
    ).then(
      () => undefined,
      (error: unknown) => {
        // Yalnızca en son başlatılan kurulum sıfırlanır (arada dil değiştiyse yenisi geçerli)
        if (channelsReady === ready) {
          channelsReady = null;
          channelsLanguage = null;
        }
        throw error;
      },
    );
    channelsReady = ready;
  }
  watchLanguage();
  return channelsReady;
}
