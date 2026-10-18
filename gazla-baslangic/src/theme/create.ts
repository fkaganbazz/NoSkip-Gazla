/**
 * Oluşturma ve boş durum token'ları — kaynak: design/Create.dc.html (yeni challenge) ve
 * design/EmptyToday.dc.html (Bugün'ün boş hali). Genel rollerle aynı olanlar `lightColors`/`darkColors`tan.
 */
import type { TextStyle } from 'react-native';

import { componentColors } from './components';
import { darkColors, lightColors, palette } from './colors';
import { fonts } from './typography';

// Yeni challenge ------------------------------------------------------------------------------------

export type CreateColors = {
  /** Süre hücresi: varsayılan ve seçili */
  cellBg: string;
  cellBorder: string;
  cellText: string;
  cellSelectedBg: string;
  cellSelectedText: string;
  /** Tamamlama şekli kartı: varsayılan kenar, seçili zemin */
  optionBg: string;
  optionBorder: string;
  optionSelectedBg: string;
  /** Ayar kartı (hatırlatma, görünürlük) */
  cardBg: string;
  cardBorder: string;
  rowDivider: string;
  rowIcon: string;
  rowValue: string;
  /** Davet satırı: seçili avatar halkası, kesikli ekle butonu */
  inviteRing: string;
  addBorder: string;
  addIcon: string;
};

// Koyu tasarım yok: seçili hücre Components'taki seçili çipin koyu karşılığına, diğerleri en yakın koyu role bağlandı.
export const createColors: Record<'light' | 'dark', CreateColors> = {
  light: {
    cellBg: palette.white,
    cellBorder: palette.strongLine,
    cellText: lightColors.text,
    cellSelectedBg: palette.nightPurple,
    cellSelectedText: palette.sand,
    optionBg: palette.white,
    optionBorder: palette.strongLine,
    optionSelectedBg: componentColors.light.selectedCardBg,
    cardBg: palette.white,
    cardBorder: palette.line,
    rowDivider: '#F4EDE5',
    rowIcon: lightColors.textBody,
    rowValue: lightColors.textSecondary,
    inviteRing: lightColors.action,
    addBorder: componentColors.light.radioOff,
    addIcon: lightColors.textSecondary,
  },
  dark: {
    cellBg: palette.darkSurface,
    cellBorder: palette.darkLine,
    cellText: darkColors.text,
    cellSelectedBg: componentColors.dark.chipSelectedBg,
    cellSelectedText: componentColors.dark.chipSelectedText,
    optionBg: palette.darkSurface,
    optionBorder: palette.darkLine,
    optionSelectedBg: componentColors.dark.selectedCardBg,
    cardBg: palette.darkSurface,
    cardBorder: palette.darkLine,
    rowDivider: palette.darkLine,
    rowIcon: darkColors.textBody,
    rowValue: darkColors.textSecondary,
    inviteRing: darkColors.action,
    addBorder: '#5E4F82', // TodayDark: davet halkası
    addIcon: darkColors.textSecondary,
  },
};

export const createMetrics = {
  headerGap: 12,
  sectionMarginTop: 16,
  /** Etiket ile içerik arası · 6 */
  labelGap: 6,
  /** Şablon çipleri (tasarımda yok; ad alanının altında) */
  templatesMarginTop: 10,
  templatesGap: 8,

  // Süre
  durationGap: 8,
  cellHeight: 46,
  cellRadius: 14,
  /** Özel süre sınırları (create_challenge: 3–60) ve seçilince başlangıç değeri */
  customMin: 3,
  customMax: 60,
  customDefault: 14,
  presetDurations: [7, 10, 30] as const,

  // Tamamlama şekli
  optionGap: 8,
  optionMinHeight: 58,
  optionPaddingX: 14,
  optionRadius: 18,
  optionInnerGap: 12,
  optionTextGap: 1,
  /** Seçili kartın dış halkası: 0 0 0 1px */
  optionRing: 1,
  /** Sayı ayarları alanları arası */
  numberGap: 8,

  // Ayar kartı
  cardMarginTop: 14,
  cardRadius: 18,
  rowHeight: 52,
  rowPaddingX: 14,
  rowGap: 12,
  rowIconSize: 20,
  rowIconStrokeWidth: 2.2,
  chevronSize: 18,
  chevronStrokeWidth: 2.4,
  /** Açılan ayar paneli (hatırlatma saati, başlangıç günü) */
  panelPaddingBottom: 14,
  panelGap: 12,
  stepSize: 40,
  stepIconSize: 18,
  stepIconStrokeWidth: 2.8,
  /** Hatırlatma adımı (dakika) ve tasarımdaki varsayılan saat */
  reminderStepMinutes: 30,
  reminderDefault: '20:00',
  /** Başlangıç: bugün … +7 (create_challenge) */
  startMaxOffset: 7,

  // Davet satırı
  inviteMarginTop: 14,
  inviteGap: 8,
  avatarSize: 40,
  avatarRing: 2,
  addBorder: 2,
  addIconSize: 18,
  addIconStrokeWidth: 2.8,
  inviteTextMarginLeft: 4,
  friendsMarginTop: 10,
  /** Arkadaş seçim çipindeki küçük avatar */
  friendChipAvatar: 24,

  /** Alttaki buton: kenarlardan 20, alttan 30 */
  footerPaddingTop: 12,
  footerPaddingBottom: 30,
  /** challenges.title ≤ 60, number_unit ≤ 20 */
  titleMaxLength: 60,
  unitMaxLength: 20,
} as const;

export const createTypography = {
  /** Süre hücresi · Nunito 800 · 15 */
  cell: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Kart başlığı / satır etiketi · Nunito 800 · 15 */
  optionTitle: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Kart açıklaması · Nunito 600 · 13 */
  optionDesc: { fontFamily: fonts.semiBold, fontSize: 13 },
  /** Satır değeri · Nunito 700 · 15 */
  rowValue: { fontFamily: fonts.bold, fontSize: 15 },
  /** Panel değeri (saat, gün) · Baloo 2 800 · 21 */
  panelValue: { fontFamily: fonts.heading, fontSize: 21 },
} as const satisfies Record<string, TextStyle>;

// Bugün · boş durum -----------------------------------------------------------------------------------

/** Çöl sahnesi illüstrasyonu: açık/koyu modda aynı (Diken'in renkleri gibi sabit çizim) */
export const emptyTodayColors = {
  sceneBg: '#FFE9D6',
  sun: palette.flowerYellow,
  cloud: '#F3CFAE',
  duneBack: '#F6D4B1',
  duneFront: '#F0C39A',
  pebble: '#D9A77B',
} as const;

export const emptyTodayMetrics = {
  sceneMarginTop: 16,
  sceneHeight: 310,
  /** İllüstrasyonun çizim alanı (390 genişlikte kart 350) */
  sceneViewWidth: 350,
  sceneRadius: 28,
  dikenSize: 190,
  dikenBottom: 6,
  textsMarginTop: 20,
  textsGap: 6,
  buttonsMarginTop: 20,
  buttonsGap: 12,
} as const;

export const emptyTodayTypography = {
  /** "Burası çöl gibi" · Baloo 2 800 · 29 · 1.05 */
  title: { fontFamily: fonts.heading, fontSize: 29, lineHeight: 29 * 1.05 },
} as const satisfies Record<string, TextStyle>;
