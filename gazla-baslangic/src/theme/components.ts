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
  /** Turuncu (`orange`) butonun gölgesi */
  pokeShadow: string;
  /** Kırmızı "Sil" butonunun gölgesi */
  dangerShadow: string;
  /** Gece moru (`ink`) buton: zemin, metin, gölge — Report.dc.html "Şikayeti gönder" */
  inkButtonBg: string;
  inkButtonText: string;
  inkButtonShadow: string;
  /** Yeşil kutlama zemininde kum buton (`onGreen`) — Completion.dc.html "Süper" */
  onGreenButtonBg: string;
  onGreenButtonText: string;
  onGreenButtonShadow: string;
  /** Pasif buton zemini ve metni */
  disabledBg: string;
  disabledText: string;
  /** Yuvarlak ikon butonu tonları: renkli zemin (beyaz, kenarsız), koyu ekran, yeşil kutlama zemini */
  iconButtonOnColorBg: string;
  iconButtonOnColorIcon: string;
  iconButtonOnDarkBg: string;
  iconButtonOnDarkIcon: string;
  iconButtonOnBrandBg: string;
  iconButtonOnBrandIcon: string;
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
  /** Bölüm etiketi tonları: bekleyenler (turuncu), tamamlayanlar (yeşil) — Friends.dc.html */
  sectionLabelOrange: string;
  sectionLabelGreen: string;
  /** Form alanı: kenar, odak halkası */
  inputBorder: string;
  inputFocusRing: string;
  inputBg: string;
  placeholder: string;
  /** Koyu bilgi tostu (çevrimdışı) ve çevrimdışı ikonu */
  toastBg: string;
  toastText: string;
  toastOfflineIcon: string;
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
  /** Onboarding adım çubuğu: dolu/boş parça, "n/4" etiketi; izin ekranında etiket ve geri butonu kenarı */
  stepFilled: string;
  stepEmpty: string;
  stepLabel: string;
  stepLabelPermission: string;
  permissionBackBorder: string;
  /** Alt sayfanın arkasındaki karartma ve 44×5 tutamaç (Poke.dc.html, NumberEntry.dc.html) */
  scrim: string;
  sheetHandle: string;
};

export const componentColors: Record<Scheme, ComponentColors> = {
  light: {
    secondaryBg: palette.card,
    secondaryBorder: palette.strongLine,
    pokeShadow: palette.orange700,
    dangerShadow: '#7A1810', // Components.dc.html: Sil butonu gölgesi
    inkButtonBg: palette.nightPurple,
    inkButtonText: palette.sand,
    inkButtonShadow: palette.fabShadow, // Report.dc.html: 0 4px 0 #0E0820
    onGreenButtonBg: palette.sand,
    onGreenButtonText: palette.actionGreen,
    onGreenButtonShadow: palette.pressedGreen,
    disabledBg: palette.strongLine,
    disabledText: palette.ink400,
    iconButtonOnColorBg: palette.card, // ChallengePreview.dc.html, StreakLost.dc.html: renkli zeminde beyaz, kenarsız
    iconButtonOnColorIcon: palette.nightPurple,
    iconButtonOnDarkBg: palette.darkFill, // PhotoProof.dc.html: koyu ekranda kapat
    iconButtonOnDarkIcon: palette.sand,
    iconButtonOnBrandBg: 'rgba(255, 248, 242, 0.16)', // Completion.dc.html: yeşil zeminde kapat
    iconButtonOnBrandIcon: palette.sand,
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
    sectionLabelOrange: palette.orange700,
    sectionLabelGreen: palette.actionGreen,
    inputBorder: palette.strongLine,
    inputFocusRing: palette.green100,
    inputBg: palette.card,
    placeholder: palette.ink400,
    toastBg: palette.nightPurple,
    toastText: palette.sand,
    toastOfflineIcon: palette.flowerYellow,
    undoToastBg: palette.green100,
    undoToastText: '#0E3B22', // Components.dc.html: geri al tostu metni
    undoButtonBg: palette.card,
    progressTrack: '#F1E9DF', // Components.dc.html: görev kartı ilerleme zemini
    pendingRing: '#FF7A3D', // Components.dc.html: bekleyen arkadaş halkası
    selectedCardBg: '#F3FBF6', // PickChallenge.dc.html: seçili kart zemini
    stepFilled: palette.actionGreen,
    stepEmpty: palette.strongLine,
    stepLabel: palette.ink500,
    stepLabelPermission: palette.ink700, // NotifPermission.dc.html
    permissionBackBorder: '#D5EBDD', // NotifPermission.dc.html: yeşil zeminde geri butonu kenarı
    scrim: 'rgba(36, 22, 63, 0.55)', // EKRANLAR.md: alt sayfa arka planı
    sheetHandle: '#D8CCBF', // Poke.dc.html / NumberEntry.dc.html: tutamaç
  },
  dark: {
    secondaryBg: palette.darkSurface,
    secondaryBorder: palette.darkLine,
    pokeShadow: palette.orange700,
    dangerShadow: '#7A1810',
    // Report'un koyusu yok: PhotoProof'taki koyu ekran butonu ("Tekrar çek") — #2B1E47, gölge #0E0820
    inkButtonBg: palette.darkFill,
    inkButtonText: palette.sand,
    inkButtonShadow: palette.fabShadow,
    // Kutlama zemini iki modda aynı (moments.ts), buton da
    onGreenButtonBg: palette.sand,
    onGreenButtonText: palette.actionGreen,
    onGreenButtonShadow: palette.pressedGreen,
    disabledBg: palette.darkLine,
    disabledText: palette.darkTextSecondary,
    // Renkli zemin koyuda da renkli; beyaz daire yerine yüzey rengi (kenarsız)
    iconButtonOnColorBg: palette.darkSurface,
    iconButtonOnColorIcon: palette.sand,
    // PhotoProof ve Completion iki modda aynı
    iconButtonOnDarkBg: palette.darkFill,
    iconButtonOnDarkIcon: palette.sand,
    iconButtonOnBrandBg: 'rgba(255, 248, 242, 0.16)',
    iconButtonOnBrandIcon: palette.sand,
    // Koyu segment tasarlanmadı. Ekran zemininde (#150E26) kap = yüzey, seçili hap ondan açık çizgi rengi;
    // kum metinle birlikte seçili hücre net ayrılır (önceki #2B1E47 kap / #211538 hap neredeyse aynıydı).
    segmentTrack: palette.darkSurface,
    segmentThumb: palette.darkLine,
    segmentShadow: 'rgba(0, 0, 0, 0.35)',
    chipSelectedBg: palette.sand,
    chipSelectedText: palette.darkBackground,
    chipBorder: palette.darkLine,
    statusChipBg: palette.darkActionTint,
    statusChipText: palette.darkActionText,
    toggleOff: palette.darkLine,
    toggleKnob: palette.white,
    radioOff: palette.darkTextSecondary,
    sectionLabelOrange: '#FF9A6B', // TodayDark.dc.html: bekleyen arkadaş metni
    sectionLabelGreen: palette.darkActionText,
    inputBorder: palette.darkLine,
    inputFocusRing: palette.darkActionTint,
    inputBg: palette.darkSurface,
    placeholder: palette.darkTextSecondary,
    toastBg: palette.sand,
    toastText: palette.darkBackground,
    // Kum zeminde sarı okunmuyor: turuncu 700 (açıkta turuncu metin rengi)
    toastOfflineIcon: palette.orange700,
    undoToastBg: palette.darkActionTint,
    undoToastText: palette.darkActionText,
    undoButtonBg: palette.darkSurface,
    progressTrack: palette.darkFill,
    pendingRing: '#FF7A3D',
    selectedCardBg: palette.darkActionTint,
    stepFilled: palette.darkAction,
    stepEmpty: palette.darkLine,
    stepLabel: palette.darkTextSecondary,
    stepLabelPermission: palette.darkTextBody,
    permissionBackBorder: palette.darkLine,
    // Koyu karartma tasarlanmadı: gece moru koyu zeminde seçilmiyor; diğer koyu karartmalarla aynı siyah .55
    scrim: 'rgba(0, 0, 0, 0.55)',
    sheetHandle: palette.darkLine,
  },
};

/** Ölçüler — Components.dc.html */
export const componentMetrics = {
  /**
   * Tok buton yüksekliği (dış ölçü, kenar dahil). lg 56: ekranlardaki ana/ikincil/turuncu/sil butonları
   * (EKRANLAR.md: hepsi 56). md 52: Components.dc.html'deki ikili ızgara (Dürt, Sil, Pasif).
   * sm 36: satır içi hap (Friends.dc.html, Detail.dc.html "Dürt").
   */
  buttonHeight: { lg: 56, md: 52, sm: 36 },
  /** Metin buton: lg 48 (Components, ekran altları), md 44 (StreakLost "Baştan başla") */
  textButtonHeight: { lg: 48, md: 44 },
  /** Alttaki düz gölge 4 px; basılınca buton 2 px iner, gölge 2 px kalır (EKRANLAR.md) */
  buttonShadow: 4,
  buttonShadowPressed: 2,
  /** Hap buton gölgesi 2 px (`0 2px 0 #C2410C`); basılınca 1 px */
  buttonSmShadow: 2,
  buttonSmShadowPressed: 1,
  /**
   * Yatay iç boşluk: hap butonda tasarımdan (Friends.dc.html "Dürt" 0 16); tam genişlik butonlarda uzun metin
   * kenara yapışmasın diye aynı değer (tasarımda ortalı, moments.ts ile aynı). Köşe hepsinde `radius.button` (18).
   */
  buttonPaddingX: 16,
  /** İkon–metin arası, buton ikonu (Poke.dc.html "Gönder", Detail.dc.html "Dürt": 20, çizgi 2.6) */
  buttonGap: 8,
  buttonIconSize: 20,
  buttonIconStroke: 2.6,
  /** Yuvarlak ikon butonu (geri, kapat, seçenekler) */
  iconButton: 44,
  backIconSize: 20,
  backIconStroke: 2.6,
  closeIconSize: 18,
  closeIconStroke: 2.8,
  /** Seçenekler — üç nokta (Detail.dc.html, FriendProfile.dc.html: 20, dolu) */
  optionsIconSize: 20,
  /** Özel ikon varsayılanı (Today.dc.html aktivite zili: 22, çizgi 2.2) */
  iconButtonIconSize: 22,
  iconButtonIconStroke: 2.2,
  headerGap: 12,
  /** Seçim kutusu: md 42 (Components, ChallengePreview), lg 44 (Poke) */
  segmentHeight: 42,
  segmentHeightLg: 44,
  segmentRadius: 12,
  segmentTrackRadius: 16,
  segmentPadding: 4,
  /** Çip: md 38 / 14 (Components), lg 40 / 16 (Explore kategori çipi, köşe 20); durum çipi 12 */
  chipHeight: 38,
  chipRadius: 19,
  chipPaddingX: 14,
  chipHeightLg: 40,
  chipRadiusLg: 20,
  chipPaddingXLg: 16,
  statusChipPaddingX: 12,
  /** Çip içi ikon–metin aralığı */
  chipGap: 6,
  toggleWidth: 52,
  toggleHeight: 32,
  toggleKnob: 26,
  toggleInset: 3,
  radioSize: 22,
  radioOnBorder: 7,
  radioOffBorder: 2,
  checkboxRadius: 6,
  /** Onay kutusu tiki (Components.dc.html: 14, çizgi 3.6) */
  checkIconSize: 14,
  checkIconStroke: 3.6,
  inputHeight: 52,
  inputRadius: 16,
  inputPaddingX: 16,
  inputFocusRing: 4,
  /** Tost: padding 12 14 (geri al: 10 10 10 14), köşe 16, ikon 20 */
  toastRadius: 16,
  toastPaddingY: 12,
  toastPaddingX: 14,
  toastActionPadding: 10,
  toastGap: 10,
  toastIconSize: 20,
  toastOfflineIconStroke: 2.2,
  toastSuccessIconStroke: 3,
  /** "Geri al" butonu: 36 yükseklik, 0 12 iç boşluk, köşe 12 */
  toastButtonHeight: 36,
  toastButtonPaddingX: 12,
  toastButtonRadius: 12,
  /** Görünme süresi (tasarımda yok): bilgi/başarı 2.6 sn (Ayarlar'daki mevcut süre), geri al 5 sn */
  toastDurationMs: 2600,
  toastActionDurationMs: 5000,
  /** Onboarding başlığı: geri + 4 parça (8 yükseklik, köşe 4, aralık 6) + 30 px "n/4" (PickChallenge.dc.html) */
  stepCount: 4,
  stepHeight: 8,
  stepRadius: 4,
  stepGap: 6,
  stepLabelWidth: 30,
  /** Alt sayfa: köşe 28, tutamaç 44×5 (köşe 3) — Poke.dc.html, NumberEntry.dc.html */
  sheetRadius: 28,
  sheetHandleWidth: 44,
  sheetHandleHeight: 5,
  sheetHandleRadius: 3,
  avatarSm: 40,
  avatarMd: 48,
  avatarLg: 72,
  countBadge: 22,
  progressHeight: 6,
} as const;

/** Yazı — Components.dc.html (renk içermez) */
export const componentTypography = {
  /** Tok buton (lg) · Nunito 800 · 17 */
  button: { fontFamily: fonts.extraBold, fontSize: 17 },
  /** Metin buton ve md tok buton (Dürt, Sil, Pasif ızgarası) · Nunito 800 · 16 */
  buttonCompact: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Hap buton (sm) · Nunito 800 · 14 */
  buttonSmall: { fontFamily: fonts.extraBold, fontSize: 14 },
  /** Seçim kutusu hücresi · Nunito 800 · 15 */
  segment: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Büyük seçim kutusu hücresi (Poke "Gaz ver / Laf sok") · Nunito 800 · 16 */
  segmentLg: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Form alanı · Nunito 600 · 16 (odakta 700) */
  input: { fontFamily: fonts.semiBold, fontSize: 16 },
  inputFocused: { fontFamily: fonts.bold, fontSize: 16 },
  /** Form etiketi · Nunito 800 · 14 */
  inputLabel: { fontFamily: fonts.extraBold, fontSize: 14 },
  /** Form hatası · Nunito 700 · 13 */
  inputError: { fontFamily: fonts.bold, fontSize: 13 },
  /** Bölüm etiketi ("İSTEKLER · 1") · Nunito 800 · 13 · aralık 0.6 (Friends.dc.html; Components panel başlıkları 1.5) */
  sectionLabel: { fontFamily: fonts.extraBold, fontSize: 13, letterSpacing: 0.6 },
  /** Bilgi tostu · Nunito 700 · 14 · satır 1.35 */
  toast: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 14 * 1.35 },
  /** Geri al tostu · Nunito 800 · 14 */
  toastStrong: { fontFamily: fonts.extraBold, fontSize: 14 },
  /** Onboarding adım etiketi "1/4" · Nunito 800 · 14 */
  stepLabel: { fontFamily: fonts.extraBold, fontSize: 14 },
  /** Avatar baş harfi · Nunito 800 · 14 (40 px avatar) */
  avatarInitial: { fontFamily: fonts.extraBold, fontSize: 14 },
} as const satisfies Record<string, TextStyle>;
