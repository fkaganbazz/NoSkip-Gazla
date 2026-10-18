/**
 * Ortak bileşen token'ları — kaynak: design/Components.dc.html (butonlar, seçim, form, geri bildirim)
 * ve ekran başlıkları (Settings.dc.html, Create.dc.html). Koyu mod karşılıkları TodayDark /
 * DetailDark ve colors.ts'teki koyu rollerden; tasarımı olmayanlar en yakın koyu role bağlandı.
 */
import type { TextStyle } from 'react-native';

import { palette } from './colors';
import { fonts } from './typography';

type Scheme = 'light' | 'dark';

export type ComponentColors = {
  /** İkincil buton: zemin, kenar ve alt gölge */
  secondaryBg: string;
  secondaryBorder: string;
  /** Turuncu "Dürt" butonunun gölgesi */
  pokeShadow: string;
  /** Kırmızı "Sil" butonunun gölgesi */
  dangerShadow: string;
  /** Pasif buton zemini ve metni */
  disabledBg: string;
  disabledText: string;
  /** Seçim kutusu (segment) zemini ve seçili hücre */
  segmentTrack: string;
  segmentThumb: string;
  segmentShadow: string;
  /** Çip: seçili zemin/metin, varsayılan kenar */
  chipSelectedBg: string;
  chipSelectedText: string;
  chipBorder: string;
  /** Durum çipi (yeşil) */
  statusChipBg: string;
  statusChipText: string;
  /** Anahtar (toggle) kapalı zemini ve topuz */
  toggleOff: string;
  toggleKnob: string;
  /** Seçim düğmesi (radio) kapalı kenarı */
  radioOff: string;
  /** Form alanı: kenar, odak halkası */
  inputBorder: string;
  inputFocusRing: string;
  inputBg: string;
  placeholder: string;
  /** Koyu bilgi tostu (çevrimdışı) */
  toastBg: string;
  toastText: string;
  /** Geri al tostu */
  undoToastBg: string;
  undoToastText: string;
  undoButtonBg: string;
  /** İlerleme çubuğu zemini */
  progressTrack: string;
  /** Bekleyen arkadaş halkası (kesikli) */
  pendingRing: string;
  /** Seçili kart zemini (PickChallenge) */
  selectedCardBg: string;
};

export const componentColors: Record<Scheme, ComponentColors> = {
  light: {
    secondaryBg: palette.card,
    secondaryBorder: palette.strongLine,
    pokeShadow: palette.orange700,
    dangerShadow: '#7A1810', // Components.dc.html: Sil butonu gölgesi
    disabledBg: palette.strongLine,
    disabledText: palette.ink400,
    segmentTrack: palette.line,
    segmentThumb: palette.card,
    segmentShadow: 'rgba(36, 22, 63, 0.12)',
    chipSelectedBg: palette.nightPurple,
    chipSelectedText: palette.sand,
    chipBorder: palette.strongLine,
    statusChipBg: palette.green100,
    statusChipText: palette.pressedGreen,
    toggleOff: '#CFC3B6', // Components.dc.html: kapalı anahtar
    toggleKnob: palette.white,
    radioOff: '#B9AFA4', // Components.dc.html: seçilmemiş radio kenarı
    inputBorder: palette.strongLine,
    inputFocusRing: palette.green100,
    inputBg: palette.card,
    placeholder: palette.ink400,
    toastBg: palette.nightPurple,
    toastText: palette.sand,
    undoToastBg: palette.green100,
    undoToastText: '#0E3B22', // Components.dc.html: geri al tostu metni
    undoButtonBg: palette.card,
    progressTrack: '#F1E9DF', // Components.dc.html: görev kartı ilerleme zemini
    pendingRing: '#FF7A3D', // Components.dc.html: bekleyen arkadaş halkası
    selectedCardBg: '#F3FBF6', // PickChallenge.dc.html: seçili kart zemini
  },
  dark: {
    secondaryBg: palette.darkSurface,
    secondaryBorder: palette.darkLine,
    pokeShadow: palette.orange700,
    dangerShadow: '#7A1810',
    disabledBg: palette.darkLine,
    disabledText: palette.darkTextSecondary,
    segmentTrack: palette.darkFill,
    segmentThumb: palette.darkSurface,
    segmentShadow: 'rgba(0, 0, 0, 0.35)',
    chipSelectedBg: palette.sand,
    chipSelectedText: palette.darkBackground,
    chipBorder: palette.darkLine,
    statusChipBg: palette.darkActionTint,
    statusChipText: palette.darkActionText,
    toggleOff: palette.darkLine,
    toggleKnob: palette.white,
    radioOff: palette.darkTextSecondary,
    inputBorder: palette.darkLine,
    inputFocusRing: palette.darkActionTint,
    inputBg: palette.darkSurface,
    placeholder: palette.darkTextSecondary,
    toastBg: palette.sand,
    toastText: palette.darkBackground,
    undoToastBg: palette.darkActionTint,
    undoToastText: palette.darkActionText,
    undoButtonBg: palette.darkSurface,
    progressTrack: palette.darkFill,
    pendingRing: '#FF7A3D',
    selectedCardBg: palette.darkActionTint,
  },
};

/** Ölçüler — Components.dc.html */
export const componentMetrics = {
  /** Ana buton 56, ikincil 54 (+2 kenar = 56 dış), Dürt/Sil/pasif 52, metin buton 48 */
  buttonHeight: { primary: 56, secondary: 56, compact: 52, text: 48 },
  buttonShadow: 4,
  /** Yuvarlak ikon butonu (geri, kapat) */
  iconButton: 44,
  backIconSize: 20,
  backIconStroke: 2.6,
  closeIconSize: 18,
  closeIconStroke: 2.8,
  headerGap: 12,
  segmentHeight: 42,
  segmentRadius: 12,
  segmentTrackRadius: 16,
  segmentPadding: 4,
  chipHeight: 38,
  chipRadius: 19,
  chipPaddingX: 14,
  toggleWidth: 52,
  toggleHeight: 32,
  toggleKnob: 26,
  toggleInset: 3,
  radioSize: 22,
  radioOnBorder: 7,
  radioOffBorder: 2,
  checkboxRadius: 6,
  inputHeight: 52,
  inputRadius: 16,
  inputPaddingX: 16,
  inputFocusRing: 4,
  toastRadius: 16,
  avatarSm: 40,
  avatarMd: 48,
  avatarLg: 72,
  countBadge: 22,
  progressHeight: 6,
} as const;

/** Yazı — Components.dc.html (renk içermez) */
export const componentTypography = {
  /** Ana ve ikincil buton · Nunito 800 · 17 */
  button: { fontFamily: fonts.extraBold, fontSize: 17 },
  /** Dürt, Sil, metin ve pasif buton · Nunito 800 · 16 */
  buttonCompact: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Seçim kutusu hücresi · Nunito 800 · 15 */
  segment: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Form alanı · Nunito 600 · 16 (odakta 700) */
  input: { fontFamily: fonts.semiBold, fontSize: 16 },
  inputFocused: { fontFamily: fonts.bold, fontSize: 16 },
  /** Form etiketi · Nunito 800 · 14 */
  inputLabel: { fontFamily: fonts.extraBold, fontSize: 14 },
  /** Form hatası · Nunito 700 · 13 */
  inputError: { fontFamily: fonts.bold, fontSize: 13 },
  /** Bölüm etiketi ("İSTEKLER · 1") · Nunito 800 · 13 · aralık 1.5 */
  sectionLabel: { fontFamily: fonts.extraBold, fontSize: 13, letterSpacing: 1.5 },
  /** Bilgi tostu · Nunito 700 · 14 · satır 1.35 */
  toast: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 14 * 1.35 },
  /** Geri al tostu · Nunito 800 · 14 */
  toastStrong: { fontFamily: fonts.extraBold, fontSize: 14 },
  /** Avatar baş harfi · Nunito 800 · 14 (40 px avatar) */
  avatarInitial: { fontFamily: fonts.extraBold, fontSize: 14 },
} as const satisfies Record<string, TextStyle>;
