/**
 * Dokunsal geri bildirim (expo-haptics). Web'de hiçbir şey yapmaz; cihaz desteklemiyorsa ya da
 * titreşim kapalıysa sessizce geçer (kutlama anı titreşimsiz de tamamdır).
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Hafif "başarılı" titreşimi — Tamamlama anı açılırken */
export function successHaptic(): void {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
