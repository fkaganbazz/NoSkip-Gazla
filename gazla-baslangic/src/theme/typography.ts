/**
 * Yazı token'ları — kaynak: design/Tokens.dc.html (YAZI ÖLÇEĞİ).
 * Başlıklar Baloo 2 800, metin Nunito 600/700/800.
 *
 * Özel fontlarda ağırlık `fontWeight` ile değil, ağırlığa ait aile adıyla seçilir
 * (Android'de `fontWeight` özel fontla birlikte güvenilir çalışmaz). Bu yüzden
 * stillerde `fontWeight` yok; her ağırlık ayrı bir `fontFamily`.
 */
import { Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2/800ExtraBold';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import type { TextStyle } from 'react-native';

/** `useFonts` ile yüklenecek dosyalar. Anahtarlar `fontFamily` adı olur. */
export const fontAssets = {
  Baloo2_800ExtraBold,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
};

export const fonts = {
  /** Baloo 2 800 — tüm başlıklar */
  heading: 'Baloo2_800ExtraBold',
  /** Nunito 600 — gövde */
  semiBold: 'Nunito_600SemiBold',
  /** Nunito 700 — meta, açıklama */
  bold: 'Nunito_700Bold',
  /** Nunito 800 — kart başlığı, etiket, buton */
  extraBold: 'Nunito_800ExtraBold',
} as const satisfies Record<string, keyof typeof fontAssets>;

/** CSS'teki birimsiz line-height'ı RN'nin piksel değerine çevirir. */
const lineHeight = (fontSize: number, ratio: number) => fontSize * ratio;

/** Yazı ölçeği. Renk içermez; renk `useTheme().colors`tan gelir. */
export const typography = {
  /** Gösterim · Baloo 2 800 · 46 — "Bugün tamam!" */
  display: {
    fontFamily: fonts.heading,
    fontSize: 46,
    lineHeight: lineHeight(46, 1),
  },
  /** Başlık 1 · Baloo 2 800 · 30 — "İlk challenge'ını seç" */
  title1: {
    fontFamily: fonts.heading,
    fontSize: 30,
    lineHeight: lineHeight(30, 1.1),
  },
  /** Başlık 2 · Baloo 2 800 · 21 — "Bugünkü görevler" */
  title2: {
    fontFamily: fonts.heading,
    fontSize: 21,
    lineHeight: lineHeight(21, 1.2),
  },
  /** Kart başlığı · Nunito 800 · 16 */
  cardTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  /** Gövde · Nunito 600 · 15 · line-height 1.45 */
  body: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: lineHeight(15, 1.45),
  },
  /** Etiket · Nunito 800 · 13 · letter-spacing 0.6 — "BUGÜN BEKLEYENLER · 2" */
  label: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    letterSpacing: 0.6,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
