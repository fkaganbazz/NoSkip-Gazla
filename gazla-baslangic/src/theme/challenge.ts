/**
 * Challenge detayına özel token'lar — kaynak: design/Detail.dc.html (açık) ve design/DetailDark.dc.html (koyu).
 * Genel rollerle aynı olanlar (zemin, yüzey, çizgi, metin, aksiyon) `useTheme().colors`tan gelir.
 */
import type { TextStyle } from 'react-native';

import { darkColors, lightColors, palette } from './colors';
import { fonts } from './typography';

export type ChallengeColors = {
  // İlerleme kartı (üst çipler ve "Bugün tamam": ortak Chip xs — ink / challenge rengi / warning / muted / success)
  cellDone: string;
  cellSaved: string;
  cellSavedDrop: string;
  cellToday: string;
  cellTodayRing: string;
  cellCheck: string;
  cellFuture: string;
  cellFutureText: string;
  legendText: string;
  // Grup listesi
  rowDivider: string;
  rankFirst: string;
  waitingText: string;
  streakText: string;
};

export const challengeColors: Record<'light' | 'dark', ChallengeColors> = {
  light: {
    cellDone: palette.dikenGreen,
    cellSaved: palette.rescue,
    cellSavedDrop: palette.potOrange,
    cellToday: palette.actionGreen,
    cellTodayRing: palette.flowerYellow,
    cellCheck: palette.white,
    cellFuture: '#F4EDE5',
    cellFutureText: palette.ink400,
    legendText: lightColors.textBody,
    rowDivider: '#F4EDE5',
    rankFirst: '#8A5A00',
    waitingText: palette.orange700,
    streakText: lightColors.actionText,
  },
  dark: {
    cellDone: palette.dikenGreen,
    cellSaved: '#4A2A1E',
    cellSavedDrop: '#FF7A3D',
    cellToday: palette.dikenGreen,
    cellTodayRing: palette.flowerYellow,
    cellCheck: palette.darkBackground,
    cellFuture: palette.darkFill,
    cellFutureText: palette.darkTextSecondary,
    legendText: darkColors.textBody,
    rowDivider: palette.darkFill,
    rankFirst: palette.flowerYellow,
    waitingText: '#FF9A6B',
    streakText: palette.darkActionText,
  },
};

export const challengeMetrics = {
  // Üst satır (geri/seçenekler: ortak IconButton, karo: ortak CategoryTile 56, çipler: ortak Chip xs)
  titleMarginTop: 14,
  titleGap: 14,
  chipsMarginTop: 12,
  chipsGap: 8,

  // İlerleme kartı
  progressMarginTop: 16,
  cardPadding: 16,
  cardRadius: 24,
  cardGap: 12,
  dayGap: 8,
  gridColumns: 10,
  gridGap: 6,
  cellRadius: 9,
  cellRing: 3,
  cellCheckSize: 13,
  cellCheckStroke: 3.8,
  cellDropSize: 14,
  legendGap: 14,
  legendItemGap: 5,
  legendSwatch: 10,
  legendSwatchRadius: 3,
  legendSwatchBorder: 2,
  /** Lejant dar ekranda alt satıra geçerse satır arası (tasarımda tek satır) */
  legendRowGap: 4,

  // Grup kartı
  boardMarginTop: 14,
  boardHeaderPaddingTop: 14,
  boardHeaderPaddingX: 16,
  boardHeaderPaddingBottom: 6,
  rowHeight: 54,
  rowPaddingX: 16,
  rowGap: 12,
  rankWidth: 18,
  avatar: 36,
  /** "Dürt" hapı (ortak Button sm) yatay iç boşluğu · 0 14 */
  pokePaddingX: 14,

  // Alt buton (ortak Button lg)
  ctaBottom: 30,
  /** Kaydırılan içeriğin alt butonun altında kalmaması için boşluk (56 + 4 gölge + 16) */
  ctaReserve: 76,
} as const;

/** Bu ekrana özgü metin stilleri */
export const challengeTypography = {
  /** Başlık · Baloo 2 800 · 25 · 1.05 */
  title: { fontFamily: fonts.heading, fontSize: 25, lineHeight: 25 * 1.05 },
  /** "Gün 12/30" · Baloo 2 800 · 22 · 1 */
  day: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 22 },
  /** "18 gün kaldı" ve "Seriye göre" · Nunito 700 · 13 */
  detail: { fontFamily: fonts.bold, fontSize: 13 },
  /** Takvim hücresi numarası · Nunito 800 · 11 */
  cell: { fontFamily: fonts.extraBold, fontSize: 11 },
  /** Lejant · Nunito 700 · 12 */
  legend: { fontFamily: fonts.bold, fontSize: 12 },
  /** "Grup" · Baloo 2 800 · 19 */
  boardTitle: { fontFamily: fonts.heading, fontSize: 19 },
  /** Satır adı · Nunito 800 · 15 */
  name: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Satır alt bilgisi · Nunito 700 · 12 */
  rowSub: { fontFamily: fonts.bold, fontSize: 12 },
  /** Sıra ve seri · Nunito 800 · 14 */
  rowStrong: { fontFamily: fonts.extraBold, fontSize: 14 },
} as const satisfies Record<string, TextStyle>;
