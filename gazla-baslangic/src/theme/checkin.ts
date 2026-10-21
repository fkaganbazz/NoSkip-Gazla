/**
 * İşaretleme ekranlarına özel token'lar — kaynak: design/NumberEntry.dc.html (sayı girişi, alt sayfa)
 * ve design/PhotoProof.dc.html (fotoğraf kanıtı). Genel rollerle aynı olanlar `lightColors`/`darkColors`tan.
 * Alt sayfa (karartma, köşe, tutamaç, Diken + balon) ortak `Sheet`/`SpeechBubble` ile: `sheet.ts`; başlıktaki karo
 * ortak `CategoryTile`; fotoğraf ekranının butonları, not alanı ve durumları ortak `Button` (`onDark`), `TextField`
 * (`size="sm"`), `LoadingState` / `ErrorState` — hepsi `scheme="dark"` — ve `IconButton` (`onDark`).
 */
import type { TextStyle } from 'react-native';

import { darkColors, lightColors, palette } from './colors';
import { fonts } from './typography';

// Sayı girişi --------------------------------------------------------------------------------------

export type NumberEntryColors = {
  /** Eksi butonu: zemin, kenar ve alt gölge */
  minusBg: string;
  minusBorder: string;
  /** Hızlı ekleme butonları */
  quickBg: string;
  quickBorder: string;
  /** Dün / en iyin kutusu */
  statsBg: string;
  statsText: string;
  statsValue: string;
};

// Koyu tasarım yok: zeminler en yakın koyu yüzeye bağlandı. Hedef hapı ortak Chip sm (success / warning;
// koyusu DetailDark'taki yeşil/turuncu çipler).
export const numberEntryColors: Record<'light' | 'dark', NumberEntryColors> = {
  light: {
    minusBg: palette.white,
    minusBorder: palette.strongLine,
    quickBg: palette.white,
    quickBorder: palette.strongLine,
    statsBg: palette.fill,
    statsText: lightColors.textBody,
    statsValue: lightColors.text,
  },
  dark: {
    minusBg: palette.darkSurface,
    minusBorder: palette.darkLine,
    quickBg: palette.darkSurface,
    quickBorder: palette.darkLine,
    statsBg: palette.darkFill,
    statsText: darkColors.textBody,
    statsValue: darkColors.text,
  },
};

export const numberEntryMetrics = {
  /** Tasarımdaki sayfa yüksekliği 506 (içerik sığmazsa uzar); iç boşluklar ortak `Sheet`te */
  sheetMinHeight: 506,

  // Başlık satırı (karo: ortak CategoryTile 44)
  headerGap: 12,
  headerTextGap: 2,
  iconTile: 44,

  // Sayaç
  stepperMarginTop: 26,
  stepButton: 64,
  stepButtonBorder: 2,
  stepButtonShadow: 4,
  stepIconSize: 26,
  stepIconStrokeWidth: 3,
  valueGap: 6,

  // Hedef hapı (ortak Chip sm)
  chipMarginTop: 16,

  // Hızlı ekleme (adımın 1, 2 ve 6 katı; tasarımda adım 5: +5, +10, +30)
  quickMarginTop: 18,
  quickGap: 10,
  quickHeight: 44,
  quickRadius: 14,
  quickMultipliers: [1, 2, 6] as const,

  // Dün / en iyin
  statsMarginTop: 16,
  statsPaddingY: 12,
  statsPaddingX: 14,
  statsRadius: 16,

  saveMarginTop: 16,
} as const;

export const numberEntryTypography = {
  /** Challenge adı · Nunito 800 · 17 */
  title: { fontFamily: fonts.extraBold, fontSize: 17 },
  /** Büyük sayı · Baloo 2 800 · 84 · 0.9 */
  value: { fontFamily: fonts.heading, fontSize: 84, lineHeight: 84 * 0.9 },
  /** Birim · Nunito 800 · 20 */
  unit: { fontFamily: fonts.extraBold, fontSize: 20 },
  /** Hızlı ekleme · Nunito 800 · 15 */
  quick: { fontFamily: fonts.extraBold, fontSize: 15 },
} as const satisfies Record<string, TextStyle>;

// Fotoğraf kanıtı ------------------------------------------------------------------------------------

/**
 * PhotoProof.dc.html yalnızca koyu çizilmiş (kamera ekranı); açık modda da bu renkler kullanılır.
 */
export const photoProofColors = {
  background: palette.darkBackground,
  text: palette.sand,
  textSecondary: palette.darkTextSecondary,
  /** Koyu aksiyon yeşili: "Ayarları aç" bağlantısı */
  action: palette.darkAction,
  /** Fotoğraf çerçevesi (fotoğraf yokken görünen zemin) */
  frameBg: '#FFE9D6',
  /** Fotoğraf yokken çerçevenin koyu hali (tasarımda yok; koyu yüzey) */
  emptyFrameBg: palette.darkSurface,
  emptyFrameBorder: '#3A2C5C',
  stampBg: 'rgba(21, 14, 38, 0.72)',
  rowBg: palette.darkSurface,
  rowIcon: palette.darkTextSecondary,
  /** Hata metni: koyu `dangerText` (#F97066, koyu zeminde 6.7:1) */
  error: darkColors.dangerText,
} as const;

export const photoProofMetrics = {
  /** Ekran altı boşluğu · 30 */
  paddingBottom: 30,
  headerGap: 12,
  frameMarginTop: 16,
  frameHeight: 420,
  frameRadius: 28,
  stampInset: 14,
  stampPaddingY: 5,
  stampPaddingX: 10,
  emptyGap: 12,
  emptyIconSize: 40,
  emptyIconStrokeWidth: 2.2,
  emptyBorder: 2,
  /** Not alanı: ortak TextField sm (50) `scheme="dark"` */
  fieldMarginTop: 16,
  /** Not sınırı: checkins.note ≤ 200 */
  noteMaxLength: 200,
  rowMarginTop: 12,
  rowMinHeight: 48,
  rowPaddingX: 14,
  rowRadius: 16,
  rowGap: 10,
  rowIconSize: 20,
  rowIconStrokeWidth: 2.2,
  buttonsMarginTop: 16,
  buttonsGap: 10,
  /** Butonlar ortak Button md (16 yazı) ama tasarımda 56 yükseklik */
  buttonHeight: 56,
  /** Seçilen fotoğrafın sıkıştırma kalitesi (Storage'a yüklenecek) */
  pickQuality: 0.7,
} as const;

export const photoProofTypography = {
  /** Challenge adı · Nunito 800 · 16 */
  title: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Zaman damgası · Nunito 800 · 12 */
  stamp: { fontFamily: fonts.extraBold, fontSize: 12 },
  /** Görünürlük satırı · Nunito 700 · 15 (kalın kısım 800) */
  row: { fontFamily: fonts.bold, fontSize: 15 },
  rowStrong: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Boş çerçevedeki "Fotoğraf çek" · Nunito 800 · 16 (butonlarla aynı) */
  emptyLabel: { fontFamily: fonts.extraBold, fontSize: 16 },
} as const satisfies Record<string, TextStyle>;
