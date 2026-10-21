/**
 * İşaretleme ekranlarına özel token'lar — kaynak: design/NumberEntry.dc.html (sayı girişi, alt sayfa)
 * ve design/PhotoProof.dc.html (fotoğraf kanıtı). Genel rollerle aynı olanlar `lightColors`/`darkColors`tan.
 * Alt sayfa (karartma, köşe, tutamaç, Diken + balon) ortak `Sheet`/`SpeechBubble` ile: `sheet.ts`; başlıktaki karo
 * ortak `CategoryTile`; fotoğraf ekranının butonları ortak `Button` (`scheme="dark"`) ve `IconButton` (`onDark`).
 */
import type { TextStyle } from 'react-native';

import { darkColors, lightColors, palette } from './colors';
import { fonts } from './typography';

// Sayı girişi --------------------------------------------------------------------------------------

export type NumberEntryColors = {
  /** Eksi butonu: zemin, kenar ve alt gölge */
  minusBg: string;
  minusBorder: string;
  /** Hedefte / hedefi geçti çipi */
  onTargetBg: string;
  onTargetText: string;
  /** Hedefe kalan çipi */
  belowTargetBg: string;
  belowTargetText: string;
  /** Hızlı ekleme butonları */
  quickBg: string;
  quickBorder: string;
  /** Dün / en iyin kutusu */
  statsBg: string;
  statsText: string;
  statsValue: string;
};

// Koyu tasarım yok: zeminler en yakın koyu yüzeye, çipler TodayDark'taki yeşil/turuncu tonlarına bağlandı.
export const numberEntryColors: Record<'light' | 'dark', NumberEntryColors> = {
  light: {
    minusBg: palette.white,
    minusBorder: palette.strongLine,
    onTargetBg: palette.green100,
    onTargetText: palette.pressedGreen,
    belowTargetBg: palette.rescue,
    belowTargetText: '#9A3412',
    quickBg: palette.white,
    quickBorder: palette.strongLine,
    statsBg: palette.fill,
    statsText: lightColors.textBody,
    statsValue: lightColors.text,
  },
  dark: {
    minusBg: palette.darkSurface,
    minusBorder: palette.darkLine,
    onTargetBg: palette.darkActionTint,
    onTargetText: palette.darkActionText,
    belowTargetBg: '#5A2E1C',
    belowTargetText: '#FFD8C2',
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

  // Hedef çipi
  chipMarginTop: 16,
  chipGap: 6,
  chipPaddingY: 6,
  chipPaddingX: 12,
  chipIconSize: 16,
  chipIconStrokeWidth: 3,

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
  /** Koyu aksiyon yeşili: yükleniyor göstergesi, "Ayarları aç" bağlantısı */
  action: palette.darkAction,
  /** Fotoğraf çerçevesi (fotoğraf yokken görünen zemin) */
  frameBg: '#FFE9D6',
  /** Fotoğraf yokken çerçevenin koyu hali (tasarımda yok; koyu yüzey) */
  emptyFrameBg: palette.darkSurface,
  emptyFrameBorder: '#3A2C5C',
  stampBg: 'rgba(21, 14, 38, 0.72)',
  label: palette.darkTextBody,
  inputBorder: '#3A2C5C',
  inputBg: palette.darkSurface,
  placeholder: palette.darkTextSecondary,
  rowBg: palette.darkSurface,
  rowIcon: palette.darkTextSecondary,
  error: '#FF9A6B',
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
  fieldMarginTop: 16,
  fieldGap: 6,
  inputHeight: 50,
  inputRadius: 16,
  inputPaddingX: 16,
  inputBorder: 2,
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
  /** Alan etiketi · Nunito 800 · 14 */
  label: { fontFamily: fonts.extraBold, fontSize: 14 },
  /** Not alanı · Nunito 700 · 16 */
  input: { fontFamily: fonts.bold, fontSize: 16 },
  /** Görünürlük satırı · Nunito 700 · 15 (kalın kısım 800) */
  row: { fontFamily: fonts.bold, fontSize: 15 },
  rowStrong: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Boş çerçevedeki "Fotoğraf çek" · Nunito 800 · 16 (butonlarla aynı) */
  emptyLabel: { fontFamily: fonts.extraBold, fontSize: 16 },
} as const satisfies Record<string, TextStyle>;
