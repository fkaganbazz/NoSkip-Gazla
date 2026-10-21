/**
 * Alt sayfa ve işlem sayfası token'ları — kaynak: design/Poke.dc.html, design/NumberEntry.dc.html (alt sayfa)
 * ve design/FriendProfile.dc.html (işlem sayfası). Koyu karşılıkları tasarlanmadı; en yakın koyu rollere bağlandı.
 * Karartma, köşe ve tutamaç ortak token'larda: `componentColors[scheme].scrim` / `sheetHandle`,
 * `componentMetrics.sheetRadius` / `sheetHandleWidth` / `sheetHandleHeight` / `sheetHandleRadius`.
 */
import type { TextStyle } from 'react-native';

import { darkColors } from './colors';
import { fonts } from './typography';

type Scheme = 'light' | 'dark';

export type SheetColors = {
  /** İşlem sayfası satır ayracı */
  actionDivider: string;
};

export const sheetColors: Record<Scheme, SheetColors> = {
  light: {
    actionDivider: '#F4EDE5', // FriendProfile.dc.html: satır ayracı
  },
  dark: {
    actionDivider: darkColors.border,
  },
};

/** Alt sayfa iç boşlukları — Poke.dc.html / NumberEntry.dc.html: padding 10 20 30 */
export const sheetMetrics = {
  /** Tutamacın üst boşluğu (sayfanın padding-top'u) */
  paddingTop: 10,
  /** Tutamaçla içerik arası (tasarımda ilk satırın margin-top'u) */
  contentGap: 14,
  paddingX: 20,
  paddingBottom: 30,
  /** İçerik uzunsa sayfa ekranın en çok bu oranına kadar uzar, sonra kayar */
  maxHeightRatio: 0.9,
} as const;

/**
 * Sayfanın üstündeki Diken + balon (`Sheet` `top` alanı) — Poke.dc.html, NumberEntry.dc.html. Diken `laf` 118
 * (yükseklik 147.5); alanın alt kenarı sayfanın üst kenarına oturur, saksının altı sayfanın arkasına `overlap`
 * kadar girer. Konumlar alanın sol üstüne göre (tasarımda ekrana göre: Poke sayfa üstü 234, NumberEntry 338).
 */
export const sheetDikenMetrics = {
  dikenSize: 118,
  /** Diken yüksekliği (genişlik × 1.25, Diken.tsx gibi yuvarlanmış) */
  dikenHeight: Math.round(118 * 1.25),
  poke: {
    /** Diken left 22, top 110 → alt kenarı 257.5; sayfa üstü 234 */
    dikenLeft: 22,
    overlap: 23.5,
    /** Balon left 150, top 120, genişlik 200; kuyruk top 12 */
    bubbleLeft: 150,
    bubbleTop: 10,
    bubbleWidth: 200,
    tailTop: 12,
  },
  numberEntry: {
    /** Diken left 34, top 196 → alt kenarı 343.5; sayfa üstü 338 */
    dikenLeft: 34,
    overlap: 5.5,
    /** Balon right 18, top 196, genişlik 150; kuyruk top 26 */
    bubbleRight: 18,
    bubbleTop: 0,
    bubbleWidth: 150,
    tailTop: 26,
  },
} as const;

/** İşlem sayfası — FriendProfile.dc.html: kenarlardan 12, alttan 26; menü kartı köşe 24, Vazgeç köşe 20 */
export const actionSheetMetrics = {
  insetX: 12,
  bottom: 26,
  gap: 10,
  radius: 24,
  headerPaddingTop: 14,
  headerPaddingX: 18,
  headerPaddingBottom: 10,
  itemHeight: 56,
  itemPaddingX: 18,
  itemGap: 14,
  iconSize: 22,
  iconStrokeWidth: 2.2,
  cancelHeight: 56,
  cancelRadius: 20,
  /** Onay adımı (tasarımda çizilmedi): satır iç boşluğuyla aynı */
  confirmPadding: 18,
} as const;

/** İşlem sayfası yazıları (renk içermez) */
export const actionSheetTypography = {
  /** "Ece · @ece.y" · Nunito 700 · 13 */
  header: { fontFamily: fonts.bold, fontSize: 13 },
  /** Satır · Nunito 800 · 16 */
  item: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Vazgeç · Nunito 800 · 17 */
  cancel: { fontFamily: fonts.extraBold, fontSize: 17 },
} as const satisfies Record<string, TextStyle>;
