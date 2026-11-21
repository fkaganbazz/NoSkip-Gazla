/**
 * Oturumsuz açılan şablon linki (https://<alan>/t/<slug>, `templateLink`): şablon cihazda saklanır, giriş +
 * onboarding bitince Bugün açılırken `takePendingTemplate()` ile alınır ve önizlemesi açılır (bir kez).
 * Eski bir link sonsuza kadar beklemesin diye 7 gün sonra yok sayılır.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'gazla.pendingTemplate';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Şablon kısa adı (challenge_templates_slug) */
export const TEMPLATE_SLUG = /^[a-z0-9-]{2,60}$/;

type Stored = { slug: string; savedAt: number };

export async function savePendingTemplate(slug: string): Promise<void> {
  if (!TEMPLATE_SLUG.test(slug)) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ slug, savedAt: Date.now() } satisfies Stored));
  } catch {
    // Saklanamazsa kullanıcı linki yeniden açar
  }
}

/** Bekleyen şablonu al ve sil; yoksa (ya da 7 günden eskiyse) null */
export async function takePendingTemplate(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(KEY);
    const stored = JSON.parse(raw) as Stored;
    if (!TEMPLATE_SLUG.test(stored.slug) || Date.now() - stored.savedAt > MAX_AGE_MS) return null;
    return stored.slug;
  } catch {
    return null;
  }
}
