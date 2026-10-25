import { useCallback } from 'react';
import { Linking, Platform } from 'react-native';

import type { ToastController } from '@/components/ui';
import { useT } from '@/i18n';
import { useEnablePushNotifications } from '@/notifications';

/**
 * Ayarlar'da bildirimle ilgili bir anahtar açılınca izni ister (onboarding'i atlayan hesaplar izin
 * ekranını hiç görmez). İzin kapalıysa kısa bir tost ve native'de telefon ayarlarına bağlantı.
 */
export function usePushPrompt(toast: ToastController) {
  const { enable } = useEnablePushNotifications();
  const t = useT();

  return useCallback(async () => {
    const result = await enable();
    if (result !== 'denied') return;
    toast.show({
      message: t.settings.pushDenied,
      kind: 'info',
      ...(Platform.OS === 'web' ? {} : { action: { label: t.common.settings, onPress: () => Linking.openSettings() } }),
    });
  }, [enable, toast, t]);
}
