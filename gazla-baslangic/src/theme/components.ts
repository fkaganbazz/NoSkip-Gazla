/**
 * Ortak bileşen token'ları — kaynak: design/Components.dc.html (butonlar, seçim, form, geri bildirim)
 * ve ekran başlıkları (Settings.dc.html, Create.dc.html); ekranlarda tekrar eden boy/ton çeşitleri
 * (SignIn, InviteFriends, EmptyToday, Detail, Notifications, NumberEntry, Explore, Report, PhotoProof …).
 * Koyu mod karşılıkları TodayDark / DetailDark / PhotoProof ve colors.ts'teki koyu rollerden; tasarımı
 * olmayanlar en yakın koyu role bağlandı.
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
  /** Gece moru (`ink`) buton: zemin, metin, gölge — Report.dc.html "Şikayeti gönder"; koyuda kum (ters) */
  inkButtonBg: string;
  inkButtonText: string;
  inkButtonShadow: string;
  /** Koyu ekran butonu (`onDark`) — PhotoProof.dc.html "Tekrar çek"; ekran iki modda koyu */
  onDarkButtonBg: string;
  onDarkButtonText: string;
  onDarkButtonShadow: string;
  /** Giriş sağlayıcı butonları (`apple`, `google`) — SignIn.dc.html; gölgesiz */
  appleButtonBg: string;
  appleButtonText: string;
  googleButtonBg: string;
  googleButtonBorder: string;
  googleButtonText: string;
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
  /** Avatar kamera rozeti ikonu (IconButton `ink` + `iconColor`) — Profile.dc.html: beyaz */
  cameraBadgeIcon: string;
  /** Seçim kutusu (segment) zemini ve seçili hücre; gölge: sekmeler (Components, Poke) / tek seçim (Settings, ChallengePreview) */
  segmentTrack: string;
  segmentThumb: string;
  segmentShadow: string;
  segmentShadowRadio: string;
  /** Çip: seçili / `ink` tonu zemin ve metin, varsayılan kenar */
  chipSelectedBg: string;
  chipSelectedText: string;
  chipBorder: string;
  /** `success` tonu (Durum, "Bugün tamam", hedefte) ve `warning` tonu ("4 kişi", hedefe kalan) */
  chipSuccessBg: string;
  chipSuccessText: string;
  chipWarningBg: string;
  chipWarningText: string;
  /** Anahtar (toggle) kapalı zemini ve topuz */
  toggleOff: string;
  toggleKnob: string;
  /** Seçim düğmesi (radio) kapalı kenarı */
  radioOff: string;
  /** Bölüm etiketi tonları: bekleyenler (turuncu), tamamlayanlar (yeşil) — Friends.dc.html */
  sectionLabelOrange: string;
  sectionLabelGreen: string;
  /** Form alanı: etiket, kenar, odak halkası */
  inputLabel: string;
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
    onDarkButtonBg: palette.darkFill, // PhotoProof.dc.html: #2B1E47, gölge #0E0820
    onDarkButtonText: palette.sand,
    onDarkButtonShadow: palette.fabShadow,
    appleButtonBg: '#0B0B0F', // SignIn.dc.html: Apple siyahı
    appleButtonText: palette.white,
    googleButtonBg: palette.card,
    googleButtonBorder: palette.strongLine,
    googleButtonText: palette.nightPurple,
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
    cameraBadgeIcon: palette.white,
    segmentTrack: palette.line,
    segmentThumb: palette.card,
    segmentShadow: 'rgba(36, 22, 63, 0.12)', // Components.dc.html, Poke.dc.html
    segmentShadowRadio: 'rgba(36, 22, 63, 0.14)', // Settings.dc.html, ChallengePreview.dc.html
    chipSelectedBg: palette.nightPurple,
    chipSelectedText: palette.sand,
    chipBorder: palette.strongLine,
    chipSuccessBg: palette.green100,
    chipSuccessText: palette.pressedGreen,
    chipWarningBg: palette.rescue, // Detail.dc.html "4 kişi", NumberEntry, Notifications: #FFE3D2 / #9A3412
    chipWarningText: '#9A3412',
    toggleOff: '#CFC3B6', // Components.dc.html: kapalı anahtar
    toggleKnob: palette.white,
    radioOff: '#B9AFA4', // Components.dc.html: seçilmemiş radio kenarı
    sectionLabelOrange: palette.orange700,
    sectionLabelGreen: palette.actionGreen,
    inputLabel: palette.nightPurple,
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
    // Report'un koyusu yok: koyu satır butonu ve seçili çip gibi ters renk (kum zemin, koyu metin). Gölge,
    // kum/beyaz zemin altındaki açık ikincil buton gölgesi (#E3D8CC).
    inkButtonBg: palette.sand,
    inkButtonText: palette.darkBackground,
    inkButtonShadow: palette.strongLine,
    // PhotoProof iki modda aynı
    onDarkButtonBg: palette.darkFill,
    onDarkButtonText: palette.sand,
    onDarkButtonShadow: palette.fabShadow,
    // Apple yönergesi: koyu zeminde beyaz buton; Google koyu yüzey + koyu çizgi
    appleButtonBg: palette.white,
    appleButtonText: '#0B0B0F',
    googleButtonBg: palette.darkSurface,
    googleButtonBorder: palette.darkLine,
    googleButtonText: palette.sand,
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
    // ink tonu koyuda kum zemin: ikon koyu (seçili çip metni)
    cameraBadgeIcon: palette.darkBackground,
    // Koyu segment tasarlanmadı. Ekran zemininde (#150E26) kap = yüzey, seçili hap ondan açık çizgi rengi;
    // kum metinle birlikte seçili hücre net ayrılır (önceki #2B1E47 kap / #211538 hap neredeyse aynıydı).
    segmentTrack: palette.darkSurface,
    segmentThumb: palette.darkLine,
    segmentShadow: 'rgba(0, 0, 0, 0.35)',
    segmentShadowRadio: 'rgba(0, 0, 0, 0.35)',
    chipSelectedBg: palette.sand, // DetailDark.dc.html "30 gün"
    chipSelectedText: palette.darkBackground,
    chipBorder: palette.darkLine,
    chipSuccessBg: '#16392A', // DetailDark.dc.html "Bugün tamam"
    chipSuccessText: palette.darkActionText,
    chipWarningBg: '#4A2A1E', // DetailDark.dc.html "4 kişi"
    chipWarningText: '#FFB891',
    toggleOff: palette.darkLine,
    toggleKnob: palette.white,
    radioOff: palette.darkTextSecondary,
    sectionLabelOrange: '#FF9A6B', // TodayDark.dc.html: bekleyen arkadaş metni
    sectionLabelGreen: palette.darkActionText,
    // PhotoProof.dc.html: koyu çizilmiş tek form alanı (etiket #E4DBF2, kenar #3A2C5C, zemin #211538)
    inputLabel: palette.darkTextBody,
    inputBorder: '#3A2C5C',
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
   * Tok buton boyları: yükseklik (dış ölçü, kenar dahil), köşe, alttaki düz gölge, yatay iç boşluk. Basılınca buton
   * gölgenin yarısı kadar iner (lg: 2 px iner, gölge 2 px kalır — EKRANLAR.md).
   * lg 56: ekranlardaki ana/ikincil/turuncu/sil butonları. lgCompact 54: EmptyToday "Kendin oluştur", SignIn
   * Apple/Google. md 52: Components.dc.html ikili ızgara (Dürt, Sil, Pasif). mdCompact 50: InviteFriends yan yana
   * paylaşım butonları (köşe 16, gölge 3; yarım genişlikte metin sığsın diye iç boşluk 0). sm 36: satır içi hap
   * (Friends.dc.html, Detail.dc.html "Dürt"; gölge 2). Yatay 16: hapta tasarımdan (Friends "Dürt" 0 16); tam
   * genişlik butonlarda uzun metin kenara yapışmasın diye aynı değer.
   */
  button: {
    lg: { height: 56, radius: 18, shadow: 4, paddingX: 16 },
    lgCompact: { height: 54, radius: 18, shadow: 4, paddingX: 16 },
    md: { height: 52, radius: 18, shadow: 4, paddingX: 16 },
    mdCompact: { height: 50, radius: 16, shadow: 3, paddingX: 0 },
    sm: { height: 36, radius: 18, shadow: 2, paddingX: 16 },
  },
  /** Metin buton: lg 48 (Components, ekran altları), md 44 (StreakLost "Baştan başla") */
  textButtonHeight: { lg: 48, md: 44 },
  /** İkon–metin arası, buton ikonu (Poke.dc.html "Gönder", Detail.dc.html "Dürt": 20, çizgi 2.6) */
  buttonGap: 8,
  buttonIconSize: 20,
  buttonIconStroke: 2.6,
  /** İki satırlı buton (`subtitle`) — StreakLost.dc.html "Ücretsiz hakkımı kullan": dikey 8, satır arası 1 */
  buttonSubtitlePaddingY: 8,
  buttonSubtitleGap: 1,
  /** Gölgesiz butonlarda (apple, google) basılı / pasif saydamlık */
  buttonFlatPressedOpacity: 0.85,
  buttonFlatDisabledOpacity: 0.6,
  /** Yuvarlak ikon butonu (geri, kapat, seçenekler) */
  iconButton: 44,
  /**
   * Avatarın sağ altındaki kamera rozeti (IconButton `ink`) — Profile.dc.html: dış 36 (30 + 3 px zemin renginde
   * kenar, button border-box), sağ/alt −4, ikon 16 / 2.4; dokunma alanı hitSlop ile 44'e tamamlanır.
   */
  cameraBadge: { size: 36, outline: 3, offset: -4, iconSize: 16, iconStroke: 2.4 },
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
  /** Arama alanı — Friends.dc.html, Explore.dc.html: 48, köşe 16, 1 px kenar, solda 20 / 2.4 büyüteç */
  searchHeight: 48,
  searchRadius: 16,
  searchPaddingLeft: 44,
  searchPaddingRight: 16,
  searchIconSize: 20,
  searchIconStroke: 2.4,
  searchIconLeft: 15,
  searchIconTop: 14,
  /** Seçim kutusu: md 42 (Components, ChallengePreview), lg 44 (Poke, Settings tema seçici) */
  segmentHeight: 42,
  segmentHeightLg: 44,
  segmentRadius: 12,
  segmentTrackRadius: 16,
  segmentPadding: 4,
  /**
   * Çip boyları (yazı: `componentTypography.chip*`). `height` 0 ise yükseklik içerikle (dikey boşluk + satır);
   * md/lg'de en az yükseklik, uzun metin alt satıra geçerse dikey boşluk `paddingY`. `radius` 0 ise tam yuvarlak.
   * `iconPadding`: başta ikon varken [dikey, sol, sağ].
   * xxs: Explore.dc.html süre hapı — 4 9, köşe 10, 12.
   * xs: Detail / ChallengePreview bilgi çipi — 5 11, 13; ikonla 4 10, aralık 4, ikon 14 / 3.2 ("Bugün tamam").
   * sm: NumberEntry hedef hapı — 6 12, 14; ikon 16 / 3, aralık 6.
   * md: Components çipi — 38, 0 14, 14 (`success` 0 12); ikonla sol 10, aralık 8, ikon 38'e ortalı (SignIn);
   *   Notifications 8 14 (tek satırda 38'e tamamlanır).
   * lg: Explore kategori çipi — 40, 0 16, köşe 20, 14.
   * xxs, md ve lg'nin ikon ölçüsü tasarımda yok: en yakın boyunki (xs / sm).
   */
  chip: {
    xxs: { height: 0, paddingY: 4, paddingX: 9, radius: 10, gap: 4, iconSize: 14, iconStroke: 3.2, iconPadding: [4, 9, 9] },
    xs: { height: 0, paddingY: 5, paddingX: 11, radius: 0, gap: 4, iconSize: 14, iconStroke: 3.2, iconPadding: [4, 10, 10] },
    sm: { height: 0, paddingY: 6, paddingX: 12, radius: 0, gap: 6, iconSize: 16, iconStroke: 3, iconPadding: [6, 12, 12] },
    md: { height: 38, paddingY: 8, paddingX: 14, radius: 0, gap: 8, iconSize: 16, iconStroke: 3, iconPadding: [0, 10, 14] },
    lg: { height: 40, paddingY: 8, paddingX: 16, radius: 20, gap: 6, iconSize: 16, iconStroke: 3, iconPadding: [0, 16, 16] },
  },
  /** md `success` tonu (Components "Durum"): 0 12 */
  chipSuccessPaddingX: 12,
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
  /** Çok satırlı alan: en az 104, dikey 14 */
  inputMultilineMinHeight: 104,
  inputMultilinePaddingY: 14,
  /** Kompakt alan (`size="sm"`): tek satır 50 (PhotoProof not alanı); çok satır 84, 12 14 (Report.dc.html) */
  inputHeightSm: 50,
  inputMultilineHeightSm: 84,
  inputMultilinePaddingYSm: 12,
  inputMultilinePaddingXSm: 14,
  /** Etiket–alan arası (Components, Profile, Report: 6) */
  fieldGap: 6,
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
  /** Sayı rozeti: 22, 0 6 (Components); zemin renginde 2 px kenarla 0 5 (Today.dc.html zil rozeti) */
  countBadge: 22,
  countBadgePaddingX: 6,
  countBadgeOutline: 2,
  countBadgeOutlinedPaddingX: 5,
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
  /** Yan yana paylaşım butonu (mdCompact) · Nunito 800 · 15 (InviteFriends.dc.html) */
  buttonPair: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** İki satırlı butonun alt satırı · Nunito 700 · 12 (StreakLost.dc.html) */
  buttonSubtitle: { fontFamily: fonts.bold, fontSize: 12 },
  /** Kompakt ekran başlığı · Nunito 800 · 17 (DeleteAccount.dc.html, Report.dc.html) */
  headerCompact: { fontFamily: fonts.extraBold, fontSize: 17 },
  /** Çip yazıları: xxs 12 (Explore süre hapı), xs 13 (Detail), sm/md/lg 14 (NumberEntry, Components, Explore) · Nunito 800 */
  chipXxs: { fontFamily: fonts.extraBold, fontSize: 12 },
  chipXs: { fontFamily: fonts.extraBold, fontSize: 13 },
  chip: { fontFamily: fonts.extraBold, fontSize: 14 },
  /** Arama alanı · Nunito 600 · 16 */
  search: { fontFamily: fonts.semiBold, fontSize: 16 },
  /** Seçim kutusu hücresi · Nunito 800 · 15 */
  segment: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Büyük seçim kutusu hücresi (Poke "Gaz ver / Laf sok") · Nunito 800 · 16 */
  segmentLg: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Form alanı · Nunito 600 · 16 (dolu ya da odakta 700) */
  input: { fontFamily: fonts.semiBold, fontSize: 16 },
  inputFocused: { fontFamily: fonts.bold, fontSize: 16 },
  /** Kompakt çok satırlı alan · Nunito 600 · 15 (Report.dc.html; dolu ya da odakta 700) */
  inputSm: { fontFamily: fonts.semiBold, fontSize: 15 },
  inputSmFocused: { fontFamily: fonts.bold, fontSize: 15 },
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
