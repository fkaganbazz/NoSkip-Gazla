import { getLanguage, type Language } from './language';

/** BCP-47 etiketi: sayı ve tarih biçimi için */
export const localeTag = (lang: Language = getLanguage()) => (lang === 'tr' ? 'tr-TR' : 'en-US');

/** Sayı: "1.234,5" / "1,234.5" */
export function formatNumber(n: number, options?: Intl.NumberFormatOptions, lang?: Language) {
  return n.toLocaleString(localeTag(lang), options);
}
