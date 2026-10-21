import { useCallback } from 'react';
import { Linking, Platform } from 'react-native';

import type { ToastController } from '@/components/ui';
import { useEnablePushNotifications } from '@/notifications';

/**
 * Ayarlar'da bildirimle ilgili bir anahtar açılınca izni ister (onboarding'i atlayan hesaplar izin
 * ekranını hiç görmez). İzin kapalıysa kısa bir tost ve native'de telefon ayarlarına bağlantı.
 */
export function usePushPrompt(toast: ToastController) {
  const { enable } = useEnablePushNotifications();

  return useCallback(async () => {
    const result = await enable();
    if (result !== 'denied') return;
    toast.show({
      message: 'Bildirim izni kapalı. Telefonunun ayarlarından açabilirsin.',
      kind: 'info',
      ...(Platform.OS === 'web' ? {} : { action: { label: 'Ayarlar', onPress: () => Linking.openSettings() } }),
    });
  }, [enable, toast]);
}
