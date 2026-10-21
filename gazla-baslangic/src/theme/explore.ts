/**
 * Keşfet, challenge önizleme ve davet karşılama ekranlarına özel token'lar — kaynak:
 * design/Explore.dc.html, design/ChallengePreview.dc.html, design/InviteLanding.dc.html.
 * Bu ekranların koyu tasarımı yok: koyu karşılıklar en yakın koyu role bağlandı (yorumlarda).
 * Genel rollerle aynı olan renkler `useTheme().colors`/`componentColors`tan gelir.
 */
import type { TextStyle } from 'react-native';

import { darkColors, palette } from './colors';
import { fonts } from './typography';

type Scheme = 'light' | 'dark';

export type ExploreColors = {
  // Haftanın challenge'ı kartı (koyu kart; koyu modda da aynı gece moru, zeminden ayrışıyor)
  featuredBg: string;
  featuredCircle: string;
  featuredLabel: string;
  featuredTitle: string;
  featuredSub: string;
  featuredButtonBg: string;
  featuredButtonText: string;
  // Popüler listesi
  rowDivider: string;
  // Reklam yer tutucusu
  adBorder: string;
  adBg: string;
  adTagBg: string;
  adTagText: string;
  adText: string;
};

export const exploreColors: Record<Scheme, ExploreColors> = {
  light: {
    featuredBg: palette.nightPurple,
    featuredCircle: '#2F2150',
    featuredLabel: palette.flowerYellow,
    featuredTitle: palette.sand,
    featuredSub: '#D9CFEA',
    featuredButtonBg: palette.sand,
    featuredButtonText: palette.nightPurple,
    rowDivider: '#F4EDE5',
    adBorder: '#CFC3B6',
    adBg: '#FBF5EE',
    adTagBg: palette.strongLine,
    adTagText: palette.ink700,
    adText: palette.ink500,
  },
  dark: {
    featuredBg: palette.nightPurple,
    featuredCircle: '#2F2150',
    featuredLabel: palette.flowerYellow,
    featuredTitle: palette.sand,
    featuredSub: '#D9CFEA',
    featuredButtonBg: palette.sand,
    featuredButtonText: palette.nightPurple,
    rowDivider: darkColors.border, // koyu: çizgi
    adBorder: darkColors.border,
    adBg: darkColors.surface,
    adTagBg: darkColors.surfaceMuted,
    adTagText: darkColors.textBody,
    adText: darkColors.textSecondary,
  },
};

export const exploreMetrics = {
  searchMarginTop: 12,
  // Arama alanı: ortak SearchField (componentMetrics.search*)

  chipsMarginTop: 12,
  chipGap: 8,

  featuredMarginTop: 14,
  featuredHeight: 150,
  featuredPaddingY: 16,
  featuredPaddingX: 18,
  featuredRadius: 26,
  featuredCircleSize: 200,
  featuredCircleRight: -40,
  featuredCircleBottom: -60,
  featuredColumnWidth: 200,
  featuredGap: 4,
  featuredButtonHeight: 34,
  featuredButtonPaddingX: 14,
  featuredButtonRadius: 12,
  featuredDikenSize: 112,
  featuredDikenRight: 10,
  featuredDikenBottom: -8,

  popularHeaderMarginTop: 18,
  listMarginTop: 8,
  rowHeight: 64,
  rowPaddingX: 14,
  rowGap: 12,
  /** Satırdaki kategori karosu (CategoryTile 42) */
  rowIconTile: 42,
  /** Keşfet ilk açılışta Popüler'de gösterilen satır sayısı (tasarımda 3) */
  popularPreviewCount: 3,

  adMarginTop: 14,
  adHeight: 58,
  adRadius: 14,
  adBorderWidth: 2,
  adGap: 10,
  adTagPaddingY: 2,
  adTagPaddingX: 7,
  adTagRadius: 6,
} as const;

export const exploreTypography = {
  /** "HAFTANIN CHALLENGE'I" · Nunito 800 · 12 · aralık 1 */
  featuredLabel: { fontFamily: fonts.extraBold, fontSize: 12, letterSpacing: 1 },
  /** Öne çıkan başlık · Baloo 2 800 · 27 · 1.05 */
  featuredTitle: { fontFamily: fonts.heading, fontSize: 27, lineHeight: 27 * 1.05 },
  /** Liste satırı başlığı · Nunito 800 · 15 */
  rowTitle: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Liste satırı alt bilgisi · Nunito 700 · 12 */
  rowMeta: { fontFamily: fonts.bold, fontSize: 12 },
  /** "REKLAM" etiketi · Nunito 800 · 11 · aralık 0.4 */
  adTag: { fontFamily: fonts.extraBold, fontSize: 11, letterSpacing: 0.4 },
} as const satisfies Record<string, TextStyle>;

// Challenge önizleme (ChallengePreview.dc.html) ----------------------------------------------------

export type PreviewColors = {
  /** Kaçırırsan Diken solar satırının ikon karosu */
  rescueTileBg: string;
  rescueTileInk: string;
};

export const previewColors: Record<Scheme, PreviewColors> = {
  light: {
    rescueTileBg: palette.rescue,
    rescueTileInk: palette.orange700,
  },
  dark: {
    // koyu: şeftali tonunun koyu avatar karşılığı (accents.ts peach)
    rescueTileBg: '#5A2E1C',
    rescueTileInk: '#FFD8C2',
  },
};

/** Kahve illüstrasyonu (ChallengePreview.dc.html); açık ve koyu modda aynı */
export const coffeeIllustrationColors = {
  shadow: '#E9C77A',
  steam: '#C99A3A',
  cup: '#FF7A3D',
  outline: palette.nightPurple,
  coffee: '#6B3A1E',
  shine: '#FFB185',
  strike: palette.potOrange,
} as const;

export const previewMetrics = {
  /** Üst alanın butonlardan aşağısı · 206 (tasarımda 262 − üst boşluk 56); üstüne güvenli alan + 9 eklenir */
  heroBelowTop: 206,
  heroRadius: 32,
  /** Paylaş ikonu (geri ikonu IconButton'dan) */
  shareIconSize: 20,
  shareIconStrokeWidth: 2.4,
  illustrationWidth: 170,
  illustrationHeight: 150,
  illustrationLeft: 44,
  /** İllüstrasyonun üstü · 100 (tasarımda üst boşluk 56 → güvenli alan + 44) */
  illustrationTopFromButtons: 44,
  /** Kahve dışındaki şablonlarda illüstrasyon yerine büyük ikon */
  fallbackIconSize: 96,
  fallbackIconStrokeWidth: 1.6,
  dikenSize: 136,
  dikenRight: 26,
  dikenBottom: -6,

  contentMarginTop: 18,
  chipsMarginTop: 10,
  chipGap: 8,
  descriptionMarginTop: 12,
  featuresMarginTop: 14,
  featureGap: 10,
  featureInnerGap: 12,
  featureTile: 32,
  featureTileRadius: 10,
  featureIconSize: 18,
  checkIconStrokeWidth: 3,
  starIconStrokeWidth: 2.4,
  durationLabelMarginTop: 16,
  segmentedMarginTop: 8,
  friendsMarginTop: 14,
  friendsGap: 10,
  /** Yapanlar yüz yığını (AvatarStack; kenar 2, binme -8 varsayılan) */
  friendAvatar: 28,

  footerGap: 10,
  footerPaddingTop: 12,
  /** Butonların alt boşluğu · 30 */
  footerBottom: 30,
} as const;

export const previewTypography = {
  /** Başlık · Baloo 2 800 · 30 · 1.05 */
  title: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 30 * 1.05 },
  /** Açıklama · Nunito 600 · 15 · 1.5 */
  description: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 15 * 1.5 },
  /** Özellik satırı · Nunito 700 · 15 */
  feature: { fontFamily: fonts.bold, fontSize: 15 },
} as const satisfies Record<string, TextStyle>;

// Davet karşılama (InviteLanding.dc.html) ------------------------------------------------------------

export type InviteColors = {
  background: string;
  logoBg: string;
  avatarRing: string;
  cardBorder: string;
  cardDivider: string;
};

export const inviteColors: Record<Scheme, InviteColors> = {
  light: {
    background: palette.green50,
    logoBg: palette.nightPurple,
    avatarRing: palette.white,
    cardBorder: '#D5EBDD',
    cardDivider: '#F4EDE5',
  },
  dark: {
    background: darkColors.background, // koyu: ekran zemini
    logoBg: palette.nightPurple,
    avatarRing: darkColors.surface,
    cardBorder: darkColors.border,
    cardDivider: darkColors.border,
  },
};

export const inviteMetrics = {
  paddingTop: 2, // tasarımda 58; ekran üstü boşluğu (56) + 2
  paddingBottom: 30,
  logoSize: 28,
  logoRadius: 8,
  logoGap: 8,
  messageMarginTop: 26,
  messageGap: 10,
  inviterAvatar: 56,
  inviterAvatarBorder: 3,
  titleMarginTop: 22,
  cardMarginTop: 16,
  cardPadding: 16,
  cardRadius: 24,
  cardGap: 14,
  cardInnerGap: 12,
  /** Kategori karosu (CategoryTile 52) */
  cardIconTile: 52,
  cardTextGap: 2,
  membersPaddingTop: 12,
  membersGap: 10,
  /** Katılanlar yüz yığını (AvatarStack; kenar 2, binme -8 varsayılan) */
  memberAvatar: 30,
  dikenRowMarginTop: 10,
  dikenRowGap: 4,
  dikenSize: 132,
  dikenBubbleMarginBottom: 70,
  actionsGap: 4,
  invalidGap: 12,
  invalidDikenSize: 150,
} as const;

export const inviteTypography = {
  /** "Gazla" · Baloo 2 800 · 24 · 1 */
  logo: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 24 },
  /** Davet edenin baş harfi · Baloo 2 800 · 24 */
  inviterInitial: { fontFamily: fonts.heading, fontSize: 24 },
  /** Başlık · Baloo 2 800 · 30 · 1.08 */
  title: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 30 * 1.08 },
  /** Challenge adı · Nunito 800 · 18 */
  challengeTitle: { fontFamily: fonts.extraBold, fontSize: 18 },
} as const satisfies Record<string, TextStyle>;
