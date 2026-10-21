/**
 * Android bildirim kanalları. Kullanıcı Ayarlar → Bildirimler'de her kanalı ayrı kapatabilir; adlar Türkçe.
 * Sunucu push gönderirken `channelId` verir: Diken hatırlatmaları `diken`, dürtme / gaz / istek / davet `friends`,
 * diğerleri `default` (Expo push'ta `channelId` yoksa da `default`).
 *
 * Android 13+'ta izin penceresi en az bir kanal varken çıkar; bu yüzden izin istenmeden önce kanallar kurulur.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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

export const ANDROID_CHANNELS: readonly ChannelSpec[] = [
  {
    id: NOTIFICATION_CHANNELS.default,
    name: 'Genel',
    description: 'Gazla’dan gelen diğer bildirimler',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
  {
    id: NOTIFICATION_CHANNELS.diken,
    name: 'Diken',
    description: 'Gün bitmeden hatırlatmalar ve serin tehlikedeyken uyarılar (günde en çok 2)',
    importance: Notifications.AndroidImportance.HIGH,
  },
  {
    id: NOTIFICATION_CHANNELS.friends,
    name: 'Arkadaşlar',
    description: 'Dürtmeler, gazlar, arkadaşlık istekleri ve challenge davetleri',
    importance: Notifications.AndroidImportance.HIGH,
  },
];

let channelsReady: Promise<void> | null = null;

/** Kanalları kurar (Android dışında bir şey yapmaz). Uygulama açılışında bir kez yeter; hata olursa yeniden dener. */
export function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  if (!channelsReady) {
    channelsReady = Promise.all(
      ANDROID_CHANNELS.map(({ id, name, description, importance }) =>
        Notifications.setNotificationChannelAsync(id, { name, description, importance, showBadge: true }),
      ),
    ).then(
      () => undefined,
      (error: unknown) => {
        channelsReady = null;
        throw error;
      },
    );
  }
  return channelsReady;
}
