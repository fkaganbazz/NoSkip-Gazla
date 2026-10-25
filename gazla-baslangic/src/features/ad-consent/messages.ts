/** Reklam tercihleri (6.2 "Reklam tercihlerini yönet") kısa bilgi metinleri; metinler `t.adConsent.privacyOptions` */
import { Platform } from 'react-native';

import type { Messages } from '@/i18n';

/** UMP gizlilik seçenekleri formu bu kullanıcı için yok (AB/İngiltere dışı) ya da web */
export function noPrivacyOptionsMessage(t: Messages): string {
  const p = t.adConsent.privacyOptions;
  if (Platform.OS === 'web') return p.notRequiredWeb;
  if (Platform.OS === 'ios') return p.notRequiredIos;
  return p.notRequiredAndroid;
}
