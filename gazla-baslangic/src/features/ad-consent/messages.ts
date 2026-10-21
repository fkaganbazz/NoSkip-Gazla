/** Reklam tercihleri (6.2 "Reklam tercihlerini yönet", 5.2 "Reklam tercihleri") kısa bilgi metinleri */
import { Platform } from 'react-native';

/** UMP gizlilik seçenekleri formu bu kullanıcı için yok (AB/İngiltere dışı) ya da web */
export function noPrivacyOptionsMessage(): string {
  if (Platform.OS === 'web') return 'Web sürümünde reklam gösterilmiyor.';
  if (Platform.OS === 'ios') {
    return "Bölgende ayrıca yönetilecek reklam tercihi yok. İzleme iznini iPhone Ayarlar'ından değiştirebilirsin.";
  }
  return 'Bölgende ayrıca yönetilecek reklam tercihi yok. Reklam kimliğini telefonunun ayarlarından yönetebilirsin.';
}

/** Form açılamadı (çoğunlukla ağ yok) */
export const PRIVACY_OPTIONS_FAILED = 'Reklam tercihleri şu an açılamadı. Biraz sonra tekrar dene.';
