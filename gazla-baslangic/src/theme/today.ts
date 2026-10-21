/**
 * Bugün ekranına özel token'lar — kaynak: design/Today.dc.html (açık) ve design/TodayDark.dc.html (koyu).
 * Genel rollerle aynı olan renkler `lightColors`/`darkColors`tan gelir; yalnızca bu ekranda geçenler burada.
 * Görev kartı, arkadaş şeridi öğesi, seri çipi ve damlalar ortak bileşen oldu: token'ları `cards.ts`te;
 * aktivite zili ve rozeti ortak `IconButton` + `CountBadge` (`components.ts`).
 */
import type { TextStyle } from 'react-native';

import { lightColors, palette } from './colors';
import { fonts } from './typography';

export type TodayColors = {
  // Kahraman kartı (su durumu)
  heroBg: string;
  heroCircle: string;
  heroTitle: string;
  heroSub: string;
  // Arkadaşlar başlığındaki "2 kişi bekliyor"
  waitingText: string;
};

export const todayColors: Record<'light' | 'dark', TodayColors> = {
  light: {
    heroBg: lightColors.actionTint,
    heroCircle: '#CBEBD6',
    heroTitle: '#0E3B22',
    heroSub: '#1F4D33',
    waitingText: palette.orange700,
  },
  dark: {
    heroBg: '#16392A',
    heroCircle: '#1C4633',
    heroTitle: palette.green50,
    heroSub: '#B8E6CA',
    waitingText: '#FF9A6B',
  },
};

export const todayMetrics = {
  // Üst satır (zil: ortak IconButton, rozet: ortak CountBadge; burada yalnızca rozetin konumu)
  headerGap: 2,
  badgeTop: -4,
  badgeRight: -5,

  // Kahraman kartı
  heroMarginTop: 14,
  /** Kart yüksekliği · 164 (içerik sığmazsa uzar; tasarım "hepsi tamam" durumunda kırpıyordu) */
  heroHeight: 164,
  heroPaddingTop: 16,
  heroPaddingX: 18,
  heroPaddingBottom: 14,
  heroRadius: 28,
  heroCircleSize: 190,
  heroCircleRight: -30,
  heroCircleTop: -26,
  heroColumnWidth: 196,
  /** Sütunun sağında Diken için ayrılan alan · 118 (390 genişlikte iç alan 314 − sütun 196) */
  heroColumnReserve: 118,
  heroGap: 6,
  dikenSize: 138,
  dikenRight: 4,
  dikenBottom: -6,

  // Bölüm başlıkları
  tasksHeaderMarginTop: 18,
  friendsHeaderMarginTop: 16,
  sectionListMarginTop: 10,

  // Görev listesi
  taskGap: 8,
} as const;

/** Bu ekrana özgü metin stilleri */
export const todayTypography = {
  /** Selamlama · Baloo 2 800 · 27 · 1.1 */
  greeting: { fontFamily: fonts.heading, fontSize: 27, lineHeight: 27 * 1.1 },
  /** Kahraman kartı başlığı · Baloo 2 800 · 25 · 1.05 */
  heroTitle: { fontFamily: fonts.heading, fontSize: 25, lineHeight: 25 * 1.05 },
  /** Kahraman kartı açıklaması · Nunito 700 · 14 · 1.35 */
  heroSub: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 14 * 1.35 },
} as const satisfies Record<string, TextStyle>;
