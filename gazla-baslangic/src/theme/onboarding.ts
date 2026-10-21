/**
 * Onboarding ekranlarına özel token'lar — kaynak: design/Main.dc.html, PickChallenge.dc.html,
 * SignIn.dc.html, Profile.dc.html, InviteFriends.dc.html, NotifPermission.dc.html.
 * Bu ekranların koyu tasarımı yok: koyu karşılıklar en yakın koyu role bağlandı (satır yorumlarında).
 * Genel rollerle aynı olan renkler `useTheme().colors`tan okunur; burada yalnızca bu ekranlarda geçenler var.
 */
import type { TextStyle } from 'react-native';

import { darkColors, palette } from './colors';
import { componentColors } from './components';
import { fonts } from './typography';

export type OnboardingColors = {
  // Karşılama (Main)
  welcomeBg: string;
  welcomeCircleOuter: string;
  welcomeCircleInner: string;
  sparkleYellow: string;
  sparkleLight: string;
  welcomeLogo: string;
  sheetBg: string;
  sheetTitle: string;
  sheetBody: string;
  // PickChallenge kartı
  tileBg: string;
  tileSelectedBg: string;
  tileBorder: string;
  tileSelected: string;
  tileShadow: string | undefined;
  tileBadgeIcon: string;
  // SignIn (Apple/Google: resmi bileşenler; native yoksa ortak Button `apple` / `google`)
  legalText: string;
  legalLink: string;
  // Profile
  fieldBg: string;
  fieldBorder: string;
  fieldPrefix: string;
  availableText: string;
  // InviteFriends
  linkBorder: string;
  linkText: string;
  rowIconBg: string;
  // NotifPermission
  permissionBg: string;
  previewBg: string;
  previewBorder: string;
  appIconBg: string;
};

export const onboardingColors: Record<'light' | 'dark', OnboardingColors> = {
  light: {
    welcomeBg: palette.actionGreen,
    welcomeCircleOuter: '#23874D',
    welcomeCircleInner: '#2A9156',
    sparkleYellow: palette.flowerYellow,
    sparkleLight: palette.sand,
    welcomeLogo: palette.sand,
    sheetBg: palette.sand,
    sheetTitle: palette.nightPurple,
    sheetBody: palette.ink700,
    tileBg: palette.card,
    tileSelectedBg: componentColors.light.selectedCardBg,
    tileBorder: palette.line,
    tileSelected: palette.actionGreen,
    tileShadow: 'rgba(36, 22, 63, 0.05)',
    tileBadgeIcon: palette.white,
    legalText: palette.ink500,
    legalLink: palette.nightPurple,
    fieldBg: palette.card,
    fieldBorder: palette.strongLine,
    fieldPrefix: palette.ink500,
    availableText: palette.actionGreen,
    linkBorder: '#CFC3B6',
    linkText: palette.ink700,
    rowIconBg: palette.fill,
    permissionBg: palette.green50,
    previewBg: 'rgba(255, 255, 255, 0.85)',
    previewBorder: '#D5EBDD',
    appIconBg: palette.nightPurple,
  },
  dark: {
    // Karşılamanın yeşil üst alanı marka rengi; koyu modda da aynı kalır, alt sayfa koyu zemine geçer.
    welcomeBg: palette.actionGreen,
    welcomeCircleOuter: '#23874D',
    welcomeCircleInner: '#2A9156',
    sparkleYellow: palette.flowerYellow,
    sparkleLight: palette.sand,
    welcomeLogo: palette.sand,
    sheetBg: darkColors.background,
    sheetTitle: darkColors.text,
    sheetBody: darkColors.textBody,
    tileBg: darkColors.surface,
    tileSelectedBg: componentColors.dark.selectedCardBg,
    tileBorder: darkColors.border,
    tileSelected: darkColors.action,
    tileShadow: undefined, // TodayDark: koyu kartlarda gölge yok
    tileBadgeIcon: darkColors.onAction,
    legalText: darkColors.textSecondary,
    legalLink: darkColors.text,
    fieldBg: componentColors.dark.inputBg,
    fieldBorder: componentColors.dark.inputBorder,
    fieldPrefix: darkColors.textSecondary,
    availableText: darkColors.actionText,
    linkBorder: darkColors.border,
    linkText: darkColors.textBody,
    rowIconBg: darkColors.surfaceMuted,
    permissionBg: darkColors.background,
    previewBg: darkColors.surface,
    previewBorder: darkColors.border,
    appIconBg: palette.nightPurple,
  },
};

export const onboardingMetrics = {
  // Karşılama — tasarım çerçevesi 390 genişlik; sanat alanı logonun altından alt sayfanın üstüne
  welcomeFrameWidth: 390,
  /** Tasarım çerçevesindeki durum çubuğu (güvenli alanın üstü) */
  designStatusBar: 47,
  /** Logo satırının üstü: tasarımda 58 (durum çubuğu 47 + 11) */
  welcomeLogoTop: 11,
  welcomeLogoGap: 8,
  welcomeLogoIconSize: 26,
  welcomeLogoIconStroke: 2.4,
  /** Sanat alanı tasarımda y 100–494 (alt sayfanın üstü) */
  welcomeArtTop: 100,
  welcomeArtBottom: 494,
  circleOuter: { left: 25, top: 150, size: 340 },
  circleInner: { left: 70, top: 195, size: 250 },
  /** Diken'in balonu (ortak SpeechBubble md, kuyruk sağ altta): konum ve genişlik */
  bubble: { left: 22, top: 118, width: 176 },
  welcomeDiken: { left: 70, top: 192, size: 250 },
  /** Alt sayfa: 350 yükseklik, köşe 32, iç boşluk 30/24/34 */
  sheetHeight: 350,
  sheetRadius: 32,
  sheetPaddingTop: 30,
  sheetPaddingX: 24,
  sheetPaddingBottom: 34,
  sheetGap: 12,
  sheetButtonsGap: 8,

  // Ekran iskeleti (PickChallenge, SignIn, Profile, InviteFriends, NotifPermission)
  screenPaddingBottom: 32,
  /** SignIn alt boşluğu · 30 */
  signInPaddingBottom: 30,
  introMarginTop: 24,
  introGap: 6,
  bottomButtonsGap: 4,

  // PickChallenge
  gridMarginTop: 20,
  gridGap: 12,
  tileHeight: 134,
  tilePadding: 14,
  tileRadius: 22,
  tileRing: 2,
  tileShadowY: 1,
  tileShadowBlur: 2,
  tileTitleMarginTop: 10,
  tileBadgeOffset: 12,
  tileBadgeSize: 26,
  tileBadgeIconSize: 15,
  tileBadgeIconStroke: 3.4,

  // SignIn
  signInDikenMarginTop: 22,
  signInDikenSize: 184,
  signInDikenGap: 14,
  /** Seçilen challenge çipi (ortak Chip md, ikonla 8 14 8 10): soldaki tikli yeşil nokta */
  pickedChipDot: 22,
  pickedChipIconSize: 13,
  pickedChipIconStroke: 3.6,
  signInIntroMarginTop: 20,
  providerGap: 10,
  /**
   * Resmi giriş butonları: satır yüksekliği ve Apple köşesi ortak `componentMetrics.button.lgCompact` (54 / 18, tasarım).
   * Google'ın resmi butonu (GoogleSigninButton Wide) kendi yüksekliğinde (48, Google SDK) 54'lük satırın ortasında
   * durur; böylece alttaki öğelerin yeri tasarımdaki gibi kalır.
   */
  googleButtonHeight: 48,
  mailIconSize: 20,
  mailIconStroke: 2.2,
  legalMarginTop: 6,

  // Profile
  avatarRowMarginTop: 22,
  avatarRowGap: 16,
  /** Avatar 84; kamera rozeti ortak `componentMetrics.cameraBadge` */
  avatarSize: 84,
  avatarTextGap: 2,
  fieldsMarginTop: 24,
  fieldsGap: 16,
  fieldGap: 6,
  fieldHeight: 52,
  fieldRadius: 16,
  fieldPaddingX: 16,
  usernamePaddingLeft: 36,
  usernamePaddingRight: 48,
  usernamePrefixLeft: 16,
  usernameBadgeRight: 14,
  usernameBadgeSize: 24,
  usernameBadgeIconSize: 13,
  usernameBadgeIconStroke: 3.6,
  chevronSize: 20,
  chevronStroke: 2.4,
  usernameDebounceMs: 400,
  yearRowHeight: 48,
  /** Yıl listesi alt sayfada bu kadar satır gösterir */
  yearListRows: 7,

  // InviteFriends
  inviteCardMarginTop: 20,
  inviteCardPadding: 14,
  inviteCardGap: 12,
  inviteTextGap: 2,
  linkSectionMarginTop: 16,
  linkSectionGap: 8,
  linkHeight: 52,
  linkRadius: 16,
  linkPaddingLeft: 16,
  linkPaddingRight: 6,
  linkGap: 8,
  /** Kopyala: ortak FriendRowButton ink lg wide; paylaşım butonları: ortak Button secondary mdCompact (ikon 20 / 2.2) */
  shareGap: 10,
  shareIconSize: 20,
  shareIconStroke: 2.2,
  listMarginTop: 16,
  rowMinHeight: 60,
  rowPaddingX: 16,
  rowGap: 12,
  rowIconTile: 36,
  rowIconRadius: 12,
  rowIconSize: 20,
  rowIconStroke: 2.2,
  rowChevronStroke: 2.4,
  /**
   * Tost onboarding'de alttaki iki butonun 8 üstünde durur: alt boşluk 32 + metin butonu 48 + aralık 4 + ana buton 56
   * + 8 − ToastHost'un kendi alt boşluğu 20 (InviteFriends "Kopyalandı", NotifPermission davet uyarısı)
   */
  toastAboveFooter: 128,

  // NotifPermission
  permissionCardMarginTop: 28,
  permissionBodyMarginTop: 6,
  /** Balonun (ortak SpeechBubble lg) kuyruğu: soldan 170 */
  permissionTailOffset: 170,
  permissionDikenMarginTop: 14,
  permissionDikenSize: 220,
  previewMarginTop: 6,
  previewPaddingY: 12,
  previewPaddingX: 14,
  previewRadius: 20,
  previewGap: 12,
  previewTextGap: 2,
  appIconSize: 38,
  appIconRadius: 10,
} as const;

/** Onboarding'e özgü metin stilleri (renk içermez) */
export const onboardingTypography = {
  /** Logo · Baloo 2 800 · 32 · 1 · aralık −0.5 */
  welcomeLogo: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 32, letterSpacing: -0.5 },
  /** Karşılama başlığı · Baloo 2 800 · 32 · 1.05 */
  welcomeTitle: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 32 * 1.05 },
  /** Karşılama metni, izin kartı metni · Nunito 600 · 16 · 1.45 */
  lead: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 16 * 1.45 },
  /** Challenge kartı başlığı · Nunito 800 · 15 · 1.25 */
  tileTitle: { fontFamily: fonts.extraBold, fontSize: 15, lineHeight: 15 * 1.25 },
  /** Yasal metin · Nunito 600 · 13 · 1.5 (bağlantılar 800, altı çizili: tasarımda `<a>`) */
  legal: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 13 * 1.5 },
  legalLink: { fontFamily: fonts.extraBold, textDecorationLine: 'underline' },
  /** Avatar satırı notu · Nunito 600 · 14 */
  avatarNote: { fontFamily: fonts.semiBold, fontSize: 14 },
  /** Form değeri · Nunito 700 · 16 */
  fieldValue: { fontFamily: fonts.bold, fontSize: 16 },
  /** Kullanıcı adı öneki "@" · Nunito 800 · 16 */
  fieldPrefix: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Form altı not · Nunito 600 · 13 */
  fieldNote: { fontFamily: fonts.semiBold, fontSize: 13 },
  /** Davet linki · Nunito 800 · 15 · aralık 0.3 */
  link: { fontFamily: fonts.extraBold, fontSize: 15, letterSpacing: 0.3 },
  /** Bildirim önizlemesi başlığı · Nunito 800 · 15 */
  previewTitle: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Bildirim önizlemesi metni · Nunito 600 · 14 · 1.4 */
  previewBody: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 14 * 1.4 },
} as const satisfies Record<string, TextStyle>;
