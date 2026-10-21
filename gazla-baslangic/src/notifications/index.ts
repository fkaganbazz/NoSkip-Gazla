/**
 * Bildirimler (expo-notifications): izin, Expo push token kaydı, Android kanalları, bildirime dokununca ekran açma.
 * Web'de `*.web.ts` eşleri çalışır (tarayıcı izni; token ve dinleyici yok).
 *
 * - `useEnablePushNotifications()` → `enable()`: izin iste + token kaydet (NotifPermission, ileride Ayarlar).
 * - `useNotificationsBootstrap({ canNavigate })`: kök düzende bir kez (app/_layout.tsx RootNavigator).
 */
export { hasPushPermission, pushPlatform, requestPushPermission } from './push';
export { useEnablePushNotifications, type EnablePushResult } from './useEnablePushNotifications';
export { useNotificationsBootstrap, type NotificationsBootstrapOptions } from './useNotificationsBootstrap';
