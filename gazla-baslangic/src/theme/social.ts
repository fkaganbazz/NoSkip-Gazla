/**
 * Sosyal ekranların token'ları — kaynak: design/Friends.dc.html, FriendProfile.dc.html, Poke.dc.html,
 * Activity.dc.html, Report.dc.html. Bu ekranların koyu tasarımı yok: genel rollerle aynı olanlar
 * `lightColors`/`darkColors`tan, diğerleri en yakın koyu role (TodayDark, DetailDark, Components) bağlandı.
 */
import type { TextStyle } from 'react-native';

import { darkColors, lightColors, palette } from './colors';
import { componentColors } from './components';
import { todayColors } from './today';
import { fonts } from './typography';

export type SocialColors = {
  /** Koyu dolu buton (Arkadaş ekle, Paylaş, Karşılık ver): zemin ve üstündeki metin/ikon */
  inkButtonBg: string;
  inkButtonText: string;
  /** Şikayeti gönder butonunun alt gölgesi */
  inkButtonShadow: string;
  /** Davet kartı (yeşil) */
  inviteCardBg: string;
  inviteTitle: string;
  inviteSub: string;
  /** Bölüm etiketleri: bekleyenler (turuncu), tamamlayanlar (yeşil) */
  pendingLabel: string;
  doneLabel: string;
  /** Liste kartında satır ayracı */
  rowDivider: string;
  /** Bekleyen arkadaşın kesikli halkası */
  pendingRing: string;
  /** "Gaz ver" / "Tebrik et" yeşil hap */
  hypeBg: string;
  hypeText: string;
  /** Laf sok seçiliyken segment metni */
  roastText: string;
  /** Mesaj kartı: seçili kenar ve tik rozeti */
  selectedBorder: string;
  selectedBadgeIcon: string;
  /** Aktivite rozetleri: dürtme (turuncu), bitirme (sarı) ve üstlerindeki ikon */
  pokeBadge: string;
  finishBadge: string;
  badgeIcon: string;
  /** Okunmamış noktası */
  unreadDot: string;
  /** Diken avatarının zemini (Activity) */
  dikenAvatarBg: string;
  /** Şikayet: seçili neden satırı */
  reasonSelectedBg: string;
  /** İşlem menüsü arkasındaki karartma */
  scrim: string;
  /** Alt sayfa tutamağı (webde; iOS/Android'de sistem çizer) */
  grabber: string;
};

export const socialColors: Record<'light' | 'dark', SocialColors> = {
  light: {
    inkButtonBg: palette.nightPurple,
    inkButtonText: palette.sand,
    inkButtonShadow: palette.fabShadow, // Report.dc.html: 0 4px 0 #0E0820
    inviteCardBg: palette.green100,
    inviteTitle: todayColors.light.heroTitle, // #0E3B22
    inviteSub: todayColors.light.heroSub, // #1F4D33
    pendingLabel: palette.orange700,
    doneLabel: lightColors.actionText,
    rowDivider: '#F4EDE5',
    pendingRing: componentColors.light.pendingRing, // #FF7A3D
    hypeBg: palette.green100,
    hypeText: palette.pressedGreen,
    roastText: palette.orange700,
    selectedBorder: palette.nightPurple,
    selectedBadgeIcon: palette.white,
    pokeBadge: palette.potOrange,
    finishBadge: palette.flowerYellow,
    badgeIcon: palette.nightPurple,
    unreadDot: palette.potOrange,
    dikenAvatarBg: palette.nightPurple,
    reasonSelectedBg: componentColors.light.selectedCardBg, // #F3FBF6
    scrim: 'rgba(36, 22, 63, 0.55)',
    grabber: '#D8CCBF',
  },
  // Koyu: koyu buton seçili çip gibi kum zemin + koyu metin; yeşil kart TodayDark kahraman kartı;
  // turuncu metin TodayDark "bekliyor" rengi.
  dark: {
    inkButtonBg: palette.sand,
    inkButtonText: palette.darkBackground,
    inkButtonShadow: palette.darkTextSecondary,
    inviteCardBg: todayColors.dark.heroBg,
    inviteTitle: todayColors.dark.heroTitle,
    inviteSub: todayColors.dark.heroSub,
    pendingLabel: todayColors.dark.waitingText,
    doneLabel: darkColors.actionText,
    rowDivider: palette.darkLine,
    pendingRing: componentColors.dark.pendingRing,
    hypeBg: palette.darkActionTint,
    hypeText: palette.darkActionText,
    roastText: todayColors.dark.waitingText,
    selectedBorder: palette.sand,
    selectedBadgeIcon: palette.darkBackground,
    pokeBadge: palette.potOrange,
    finishBadge: palette.flowerYellow,
    badgeIcon: palette.nightPurple,
    unreadDot: palette.potOrange,
    dikenAvatarBg: palette.darkFill,
    reasonSelectedBg: componentColors.dark.selectedCardBg,
    scrim: 'rgba(36, 22, 63, 0.55)', // koyu karartma tasarlanmadı; açıktakiyle aynı
    grabber: palette.darkLine,
  },
};

export const socialMetrics = {
  // Arkadaşlar: üst satır, arama, davet kartı
  addButtonSize: 44,
  addIconSize: 22,
  addIconStrokeWidth: 2.3,
  searchMarginTop: 14,
  searchHeight: 48,
  searchRadius: 16,
  searchPaddingLeft: 44,
  searchPaddingRight: 16,
  searchIconSize: 20,
  searchIconStrokeWidth: 2.4,
  searchIconLeft: 15,
  searchIconTop: 14,
  inviteMarginTop: 12,
  inviteHeight: 92,
  invitePaddingY: 14,
  invitePaddingX: 16,
  inviteRadius: 22,
  inviteTextWidth: 220,
  inviteTextGap: 4,
  shareHeight: 40,
  sharePaddingX: 14,
  shareRadius: 14,
  /** Paylaş butonunun sağında Diken için ayrılan alan */
  shareMarginRight: 58,
  inviteDikenSize: 76,
  inviteDikenRight: -6,
  inviteDikenBottom: -22,

  // Bölümler ve liste kartı
  sectionFirstMarginTop: 18,
  sectionMarginTop: 16,
  sectionListMarginTop: 8,
  listRadius: 20,
  rowHeight: 62,
  rowPaddingLeft: 14,
  rowPaddingRight: 12,
  rowGap: 12,
  rowAvatar: 40,
  pendingRingWidth: 2,
  pendingRingPadding: 2,
  doneBadgeSize: 18,
  doneBadgeBorder: 2,
  doneBadgeOffset: -3,
  doneBadgeIconSize: 9,
  doneBadgeIconStrokeWidth: 4.5,
  /** Küçük satır butonları (Kabul et, Dürt, Gaz ver, sil) */
  smallButtonHeight: 36,
  smallButtonPaddingX: 12,
  smallButtonRadius: 12,
  pokePillPaddingX: 16,
  pillRadius: 18,
  pokePillShadow: 2,
  dismissIconSize: 16,
  dismissIconStrokeWidth: 3,
  devLinkMarginTop: 24,

  // Arkadaş profili
  profileMarginTop: 6,
  profileGap: 4,
  profileAvatar: 88,
  profileNameMarginTop: 6,
  statsMarginTop: 16,
  statsGap: 10,
  statPaddingY: 12,
  statPaddingX: 8,
  statRadius: 18,
  sharedRowHeight: 60,
  sharedRowPaddingX: 14,
  sharedTile: 36,
  sharedTileRadius: 12,
  sharedIconSize: 20,
  sharedIconStrokeWidth: 2,
  optionsIconSize: 20,
  // İşlem menüsü
  menuInsetX: 12,
  menuBottom: 26,
  menuGap: 10,
  menuRadius: 24,
  menuHeaderPaddingTop: 14,
  menuHeaderPaddingX: 18,
  menuHeaderPaddingBottom: 10,
  menuItemHeight: 56,
  menuItemPaddingX: 18,
  menuItemGap: 14,
  menuIconSize: 22,
  menuIconStrokeWidth: 2.2,
  menuCancelHeight: 56,
  menuCancelRadius: 20,

  // Dürt (alt sayfa)
  /** Alt sayfa yüksekliği · 610 (Poke.dc.html) */
  sheetMinHeight: 610,
  sheetPaddingTop: 10,
  sheetPaddingX: 20,
  sheetPaddingBottom: 30,
  grabberWidth: 44,
  grabberHeight: 5,
  grabberRadius: 3,
  pokeHeaderMarginTop: 14,
  pokeHeaderGap: 12,
  pokeAvatarOuter: 48,
  pokeAvatarRingPadding: 3,
  pokeTitleGap: 2,
  segmentMarginTop: 18,
  noteMarginTop: 12,
  noteGap: 8,
  noteIconSize: 18,
  noteIconStrokeWidth: 2.2,
  messagesMarginTop: 12,
  messagesGap: 10,
  messageMinHeight: 72,
  messagePaddingY: 12,
  messagePaddingLeft: 14,
  messagePaddingRight: 34,
  messageRadius: 18,
  messageBorder: 2,
  messageBadgeSize: 20,
  messageBadgeInset: 10,
  messageBadgeIconSize: 11,
  messageBadgeIconStrokeWidth: 4,
  sendIconSize: 20,
  sendIconStrokeWidth: 2.6,
  sendMarginTop: 16,
  pokeErrorMarginBottom: 10,

  // Aktivite
  activitySectionMarginTop: 16,
  activityNextSectionMarginTop: 18,
  activityRowPaddingY: 14,
  activityRowPaddingLeft: 16,
  activityRowPaddingRight: 14,
  activityAvatar: 44,
  activityBadgeSize: 22,
  activityBadgeBorder: 2,
  activityBadgeOffset: -4,
  activityBadgeIconSize: 11,
  activityBadgeChatStroke: 3,
  activityBadgeStarStroke: 2.6,
  activityRichGap: 6,
  activityPlainGap: 2,
  activityHeaderGap: 8,
  bubblePaddingY: 8,
  bubblePaddingX: 12,
  bubbleRadiusSmall: 4,
  bubbleRadius: 14,
  activityButtonPaddingX: 14,
  activityButtonsGap: 8,
  unreadDotSize: 7,
  unreadDotLeft: 6,
  unreadDotTop: 30,
  markAllPaddingX: 4,

  // Şikayet
  reportTitleSide: 44,
  reportIntroMarginTop: 20,
  reportIntroGap: 6,
  reasonsMarginTop: 16,
  reasonsRadius: 20,
  reasonMinHeight: 54,
  reasonPaddingX: 16,
  reasonGap: 12,
  detailMarginTop: 14,
  detailGap: 6,
  detailHeight: 84,
  detailPaddingY: 12,
  detailPaddingX: 14,
  detailRadius: 16,
  blockMarginTop: 12,
  blockGap: 12,
  reportNoteMarginTop: 4,
  reportPaddingBottom: 30,
  thanksGap: 12,
} as const;

/** Bu ekranlara özgü metin stilleri */
export const socialTypography = {
  /** Arama alanı · Nunito 600 · 16 */
  search: { fontFamily: fonts.semiBold, fontSize: 16 },
  /** Satır adı · Nunito 800 · 15 */
  rowTitle: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Satır alt bilgisi · Nunito 700 · 12 */
  rowSub: { fontFamily: fonts.bold, fontSize: 12 },
  /** Davet kartı açıklaması · Nunito 700 · 13 · 1.35 */
  inviteSub: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 13 * 1.35 },
  /** Profil baş harfi · Baloo 2 800 · 38 */
  profileInitial: { fontFamily: fonts.heading, fontSize: 38 },
  /** Profil adı · Baloo 2 800 · 28 · 1 */
  profileName: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 28 },
  /** İstatistik değeri · Baloo 2 800 · 24 · 1 */
  statValue: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 24 },
  /** İşlem menüsü satırı · Nunito 800 · 16 */
  menuItem: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Dürt başlığı · Nunito 800 · 17 */
  pokeTitle: { fontFamily: fonts.extraBold, fontSize: 17 },
  /** Mesaj kartı · Nunito 800 · 15 · 1.3 */
  message: { fontFamily: fonts.extraBold, fontSize: 15, lineHeight: 15 * 1.3 },
  /** Aktivite satır başlığı · Nunito 800 · 15 · 1.3 */
  activityTitle: { fontFamily: fonts.extraBold, fontSize: 15, lineHeight: 15 * 1.3 },
  /** Aktivite mesaj balonu · Nunito 700 · 14 */
  bubble: { fontFamily: fonts.bold, fontSize: 14 },
  /** Aktivite alt satırı · Nunito 600 · 14 */
  activitySub: { fontFamily: fonts.semiBold, fontSize: 14 },
  /** Şikayet başlığı · Baloo 2 800 · 27 · 1.1 */
  reportTitle: { fontFamily: fonts.heading, fontSize: 27, lineHeight: 27 * 1.1 },
  /** Şikayet nedeni · Nunito 800 · 16 */
  reason: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Ayrıntı alanı · Nunito 600 · 15 */
  detail: { fontFamily: fonts.semiBold, fontSize: 15 },
  /** Engelle onayı · Nunito 800 · 15 */
  blockLabel: { fontFamily: fonts.extraBold, fontSize: 15 },
} as const satisfies Record<string, TextStyle>;
