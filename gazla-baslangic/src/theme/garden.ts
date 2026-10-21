/**
 * Bahçem ekranına özel token'lar — kaynak: design/Garden.dc.html. Koyu tasarımı yok: koyu karşılıklar
 * en yakın koyu yeşil yüzeylere bağlandı (TodayDark kahraman kartı); raf ahşabı iki modda aynı.
 */
import type { TextStyle } from 'react-native';

import { darkColors, palette } from './colors';
import { fonts } from './typography';

type Scheme = 'light' | 'dark';

export type GardenColors = {
  shelfPanelBg: string;
  plank: string;
  plankShadow: string;
  plantLabel: string;
  addTileBorder: string;
  addTileIcon: string;
};

export const gardenColors: Record<Scheme, GardenColors> = {
  light: {
    shelfPanelBg: palette.green50,
    plank: '#C9965F',
    plankShadow: '#A77645',
    plantLabel: '#1F4D33',
    addTileBorder: '#8FB89E',
    addTileIcon: '#1F6B40',
  },
  dark: {
    shelfPanelBg: '#16392A', // koyu: TodayDark kahraman kartı zemini
    plank: '#C9965F',
    plankShadow: '#A77645',
    plantLabel: '#B8E6CA', // koyu: TodayDark kahraman kartı açıklaması
    addTileBorder: '#4E6B5C', // koyu: TodayDark boş işaret ikonu
    addTileIcon: darkColors.actionText,
  },
};

export const gardenMetrics = {
  headerGap: 14,
  avatarSize: 56,
  /** Ayarlar dişlisi çizgisi (IconButton ikonu 22) */
  settingsIconStrokeWidth: 2.1,

  statsMarginTop: 16,
  statsGap: 10,
  statPadding: 12,
  statRadius: 18,
  statGap: 2,

  panelMarginTop: 14,
  panelPaddingTop: 16,
  panelPaddingX: 14,
  panelPaddingBottom: 12,
  panelRadius: 28,
  shelfGap: 14,
  /** Rafta yan yana bitki sayısı */
  perShelf: 3,
  plantSize: 80,
  plankHeight: 12,
  plankRadius: 6,
  plankShadow: 4,
  labelsMarginTop: 8,
  addTileWidth: 72,
  addTileHeight: 90,
  addTileRadius: 16,
  addTileBorder: 2,
  addIconSize: 22,
  addIconStrokeWidth: 2.8,
} as const;

export const gardenTypography = {
  /** İstatistik sayısı · Baloo 2 800 · 28 · 1 */
  statValue: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 28 },
  /** Raf etiketi · Nunito 800 · 12 · 1.3 */
  plantLabel: { fontFamily: fonts.extraBold, fontSize: 12, lineHeight: 12 * 1.3, textAlign: 'center' },
} as const satisfies Record<string, TextStyle>;
