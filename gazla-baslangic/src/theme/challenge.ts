/**
 * Challenge detayına özel token'lar — kaynak: design/Detail.dc.html (açık) ve design/DetailDark.dc.html (koyu).
 * Genel rollerle aynı olanlar (zemin, yüzey, çizgi, metin, aksiyon) `useTheme().colors`tan gelir.
 */
import type { TextStyle } from 'react-native';

import { darkColors, lightColors, palette } from './colors';
import { fonts } from './typography';

export type ChallengeColors = {
  // Üst çipler
  durationChipBg: string;
  durationChipText: string;
  membersChipBg: string;
  membersChipText: string;
  reminderChipBg: string;
  reminderChipText: string;
  // İlerleme kartı
  todayDoneChipBg: string;
  todayDoneChipText: string;
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
  pokeShadow: string;
  /** Seçenekler menüsünün arkasındaki karartma — tasarımda yok; gece moru %40 */
  scrim: string;
};

export const challengeColors: Record<'light' | 'dark', ChallengeColors> = {
  light: {
    durationChipBg: palette.nightPurple,
    durationChipText: palette.sand,
    membersChipBg: palette.rescue,
    membersChipText: '#9A3412',
    reminderChipBg: lightColors.surfaceMuted,
    reminderChipText: lightColors.textBody,
    todayDoneChipBg: palette.green100,
    todayDoneChipText: palette.pressedGreen,
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
    pokeShadow: palette.orange700,
    scrim: 'rgba(36, 22, 63, 0.4)',
  },
  dark: {
    durationChipBg: palette.sand,
    durationChipText: palette.darkBackground,
    membersChipBg: '#4A2A1E',
    membersChipText: '#FFB891',
    reminderChipBg: darkColors.surfaceMuted,
    reminderChipText: darkColors.textBody,
    todayDoneChipBg: '#16392A',
    todayDoneChipText: palette.darkActionText,
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
    pokeShadow: palette.orange700,
    scrim: 'rgba(0, 0, 0, 0.55)',
  },
};

export const challengeMetrics = {
  // Üst satır
  iconButton: 44,
  iconSize: 20,
  backIconStroke: 2.6,
  titleMarginTop: 14,
  titleGap: 14,
  tile: 56,
  tileRadius: 18,
  tileIconSize: 28,
  tileIconStroke: 2,
  chipsMarginTop: 12,
  chipsGap: 8,
  chipPaddingY: 5,
  chipPaddingX: 11,

  // İlerleme kartı
  progressMarginTop: 16,
  cardPadding: 16,
  cardRadius: 24,
  cardGap: 12,
  dayGap: 8,
  statusChipGap: 4,
  statusChipPaddingY: 4,
  statusChipPaddingX: 10,
  statusIconSize: 14,
  statusIconStroke: 3.2,
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
  pokeHeight: 36,
  pokePaddingX: 14,
  pokeShadow: 2,

  // Alt buton
  ctaBottom: 30,
  ctaHeight: 56,
  ctaRadius: 18,
  ctaShadow: 4,
  ctaGap: 8,
  ctaIconSize: 20,
  ctaIconStroke: 2.6,
  /** Kaydırılan içeriğin alt butonun altında kalmaması için boşluk (56 + 4 gölge + 16) */
  ctaReserve: 76,

  // Seçenekler menüsü (tasarımda yok; Components kart/buton ölçüleri)
  menuRadius: 22,
  menuPadding: 8,
  menuRowHeight: 52,
  menuRowPaddingX: 14,
  menuTop: 56,
  menuMinWidth: 220,
} as const;

/** Bu ekrana özgü metin stilleri */
export const challengeTypography = {
  /** Başlık · Baloo 2 800 · 25 · 1.05 */
  title: { fontFamily: fonts.heading, fontSize: 25, lineHeight: 25 * 1.05 },
  /** Çip · Nunito 800 · 13 */
  chip: { fontFamily: fonts.extraBold, fontSize: 13 },
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
  /** Avatar harfi · Nunito 800 · 16 */
  avatar: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Alt buton · Nunito 800 · 17 */
  cta: { fontFamily: fonts.extraBold, fontSize: 17 },
} as const satisfies Record<string, TextStyle>;
