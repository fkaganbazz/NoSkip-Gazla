/**
 * Çeviri: Türkçe (Gazla) ve İngilizce (NoSkip). Metinler `locales/<dil>/<ad alanı>.ts` sözlüklerinde; Türkçe
 * kaynaktır, İngilizce aynı biçimde olmak zorunda (tip denetimi).
 *
 * Bileşende `const t = useT()` → `t.common.close`, `t.activity.congratsSent(ad)`; dil değişince yeniden çizilir.
 * Bileşen dışında (veri katmanı hataları, saf mantık) `getT()` o anki dilin sözlüğünü verir; çizim sırasında
 * çağrılan mantık fonksiyonlarına `t`'yi parametre olarak geçmek tercih edilir (useMemo bağımlılığına girer).
 */
import { en } from './locales/en';
import { tr, type Messages } from './locales/tr';
import { getLanguage, useLanguage, type Language } from './language';

const MESSAGES: Record<Language, Messages> = { tr, en };

export const messagesFor = (lang: Language): Messages => MESSAGES[lang];

/** O anki dilin sözlüğü (bileşen dışı) */
export const getT = (): Messages => MESSAGES[getLanguage()];

/** O anki dilin sözlüğü; dil değişince bileşen yeniden çizilir */
export function useT(): Messages {
  return MESSAGES[useLanguage()];
}

export type { Messages };
export { formatNumber, localeTag } from './format';
export { useLanguageBootstrap } from './useLanguageBootstrap';
export {
  deviceLanguage,
  getLanguage,
  getLanguagePreference,
  LANGUAGES,
  refreshSystemLanguage,
  setLanguagePreference,
  subscribeLanguage,
  useLanguage,
  useLanguagePreference,
  type Language,
  type LanguagePreference,
} from './language';
