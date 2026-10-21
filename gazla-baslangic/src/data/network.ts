/**
 * Bağlantı durumu: TanStack `onlineManager` cihazın bağlantısını izler (iOS/Android NetInfo,
 * web'de `navigator.onLine` ve online/offline olayları). Çevrimdışıyken sorgular duraklar,
 * işaretlemeler kuyruğa girer (`offlineQueue.ts`); bağlantı gelince sorgular yenilenir ve kuyruk
 * boşaltılır.
 *
 * Geliştirme için çevrimdışı benzetimi (`mockDev.setOffline`): cihaz bağlı olsa da uygulama
 * kendini çevrimdışı sayar. Etkin durum = cihaz bağlı ve benzetim kapalı.
 */
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

let deviceOnline = true;
let simulatedOffline = false;

const effective = () => deviceOnline && !simulatedOffline;

/** Cihazın ilk bağlantı bildirimi (NetInfo ilk olayı zaman uyumsuz gelir; web'de hemen) */
let markKnown: () => void = () => {};
const known = new Promise<void>((resolve) => {
  markKnown = resolve;
});
const KNOWN_TIMEOUT_MS = 1500;

onlineManager.setEventListener((setOnline) => {
  const update = (online: boolean) => {
    deviceOnline = online;
    setOnline(effective());
    markKnown();
  };

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.addEventListener) return undefined;
    const onOnline = () => update(true);
    const onOffline = () => update(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    update(typeof navigator === 'undefined' || navigator.onLine !== false);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }

  // isConnected ilk anda null (bilinmiyor) olabilir: bağlı say. isInternetReachable'a bakılmaz;
  // erişilebilirlik denetimi geç gelir ve bağlı ağda yanlış "yok" diyebilir.
  return NetInfo.addEventListener((state) => update(state.isConnected !== false));
});

/** Şu an çevrimiçi mi (cihaz bağlı ve çevrimdışı benzetimi kapalı) */
export const isOnline = () => onlineManager.isOnline();

/**
 * Açılışta bağlantı durumu belli olunca (en geç 1,5 sn) çözülür. Çevrimdışı açılışta "bağlı"
 * varsayımıyla karar verilmesin diye: kayıtlı oturumu koruma, mock önbelleğini geri yükleme.
 */
export function connectivityKnown(): Promise<boolean> {
  return Promise.race([known, new Promise<void>((resolve) => setTimeout(resolve, KNOWN_TIMEOUT_MS))]).then(isOnline);
}

/** Geliştirme: cihaz bağlıyken çevrimdışıymış gibi davran (sorgular duraklar, işaretleme kuyruğa) */
export function setSimulatedOffline(offline: boolean) {
  simulatedOffline = offline;
  onlineManager.setOnline(effective());
}

export const isSimulatedOffline = () => simulatedOffline;

const subscribe = (listener: () => void) => onlineManager.subscribe(listener);

/** Bağlantı durumu; değişince yeniden çizer (Bugün'deki koyu "çevrimdışı" tostu için) */
export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribe, isOnline, () => true);
}
