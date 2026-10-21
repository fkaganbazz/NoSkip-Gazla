/**
 * Cihazda tutulan tek seferlik bayraklar (AsyncStorage). Sunucu gerekmeyen "bir kez göster"
 * kuralları için: ör. reklam izni ön ekranı "İlk günü tamamladıktan sonra bir kez"
 * (docs/EKRANLAR.md 6.2). Bayrak cihaza bağlıdır; uygulama silinince sıfırlanır.
 *
 *   if (!(await adConsentShown.get())) { router.push('/ad-consent'); await adConsentShown.set(); }
 *
 * Depolama hatası (ör. web'de gizli pencere) bayrağı "yok" sayar ve uygulamayı durdurmaz.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'gazla.flag.';

/** Bilinen bayraklar; yenisini buraya ekle (anahtarlar kalıcıdır, yeniden adlandırma) */
export type FlagName = 'adConsentShown';

/** Bayrak kurulu mu (bir kez gösterildi mi) */
export async function isFlagSet(name: FlagName): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PREFIX + name)) !== null;
  } catch {
    return false;
  }
}

/** Bayrağı kur (kurulma zamanı saklanır) */
export async function setFlag(name: FlagName): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + name, new Date().toISOString());
  } catch {
    // Saklanamadıysa bir sonraki açılışta yeniden gösterilir; akış durmaz
  }
}

export async function clearFlag(name: FlagName): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + name);
  } catch {
    // yok say
  }
}

/** Tüm bayrakları sil (geliştirme menüsü "sıfırla", hesap silme sonrası) */
export async function clearAllFlags(): Promise<void> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch {
    // yok say
  }
}

/** Bir bayrağın get/set/clear yardımcıları */
export function onceFlag(name: FlagName) {
  return {
    get: () => isFlagSet(name),
    set: () => setFlag(name),
    clear: () => clearFlag(name),
  };
}

/** Reklam izni ön ekranı (AdConsent) gösterildi mi — ilk günü tamamladıktan sonra bir kez */
export const adConsentShown = onceFlag('adConsentShown');
