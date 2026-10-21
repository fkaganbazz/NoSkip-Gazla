/**
 * Sosyal ekranların token'ları — kaynak: design/Friends.dc.html, FriendProfile.dc.html, Poke.dc.html,
 * Activity.dc.html, Report.dc.html. Bu ekranların koyu tasarımı yok: renkler en yakın koyu role (TodayDark,
 * DetailDark, Components) bağlandı. Kişi satırı, liste kartı, satır butonları, avatar halkası, işlem sayfası
 * ve alt sayfa ölçüleri ortak token'larda (`cardColors`/`cardMetrics`, `componentColors`, `sheet.ts`).
 */
import type { TextStyle } from 'react-native';

import { palette } from './colors';
import { componentColors } from './components';
import { todayColors } from './today';
import { fonts } from './typography';

export type SocialColors = {
  /** Davet kartı (yeşil) */
  inviteCardBg: string;
  inviteTitle: string;
  inviteSub: string;
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
};

export const socialColors: Record<'light' | 'dark', SocialColors> = {
  light: {
    inviteCardBg: palette.green100,
    inviteTitle: todayColors.light.heroTitle, // #0E3B22
    inviteSub: todayColors.light.heroSub, // #1F4D33
    roastText: palette.orange700,
    selectedBorder: palette.nightPurple,
    selectedBadgeIcon: palette.white,
    pokeBadge: palette.potOrange,
    finishBadge: palette.flowerYellow,
    badgeIcon: palette.nightPurple,
    unreadDot: palette.potOrange,
    dikenAvatarBg: palette.nightPurple,
    reasonSelectedBg: componentColors.light.selectedCardBg, // #F3FBF6
  },
  // Koyu: yeşil kart TodayDark kahraman kartı; turuncu metin TodayDark "bekliyor" rengi; seçili mesaj kartı
  // seçili çip gibi kum kenar.
  dark: {
    inviteCardBg: todayColors.dark.heroBg,
    inviteTitle: todayColors.dark.heroTitle,
    inviteSub: todayColors.dark.heroSub,
    roastText: todayColors.dark.waitingText,
    selectedBorder: palette.sand,
    selectedBadgeIcon: palette.darkBackground,
    pokeBadge: palette.potOrange,
    finishBadge: palette.flowerYellow,
    badgeIcon: palette.nightPurple,
    unreadDot: palette.potOrange,
    dikenAvatarBg: palette.darkFill,
    reasonSelectedBg: componentColors.dark.selectedCardBg,
  },
};

export const socialMetrics = {
  // Arkadaşlar: üst satır, arama, davet kartı
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
  rowGap: 12,
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
  sharedIconSize: 20,

  // Dürt (alt sayfa)
  /** Alt sayfa yüksekliği · 610 (Poke.dc.html) */
  sheetMinHeight: 610,
  pokeHeaderGap: 12,
  pokeAvatarOuter: 48,
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
  reasonMinHeight: 54,
  reasonPaddingX: 16,
  reasonGap: 12,
  detailMarginTop: 14,
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
  /** Davet kartı açıklaması · Nunito 700 · 13 · 1.35 */
  inviteSub: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 13 * 1.35 },
  /** Profil adı · Baloo 2 800 · 28 · 1 */
  profileName: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 28 },
  /** İstatistik değeri · Baloo 2 800 · 24 · 1 */
  statValue: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 24 },
  /** Dürt başlığı · Nunito 800 · 17 */
  pokeTitle: { fontFamily: fonts.extraBold, fontSize: 17 },
  /** Mesaj kartı · Nunito 800 · 15 · 1.3 */
  message: { fontFamily: fonts.extraBold, fontSize: 15, lineHeight: 15 * 1.3 },
  /** Aktivite satır başlığı · Nunito 800 · 15 · 1.3 */
  activityTitle: { fontFamily: fonts.extraBold, fontSize: 15, lineHeight: 15 * 1.3 },
  /** Aktivite alt satırı · Nunito 600 · 14 */
  activitySub: { fontFamily: fonts.semiBold, fontSize: 14 },
  /** Şikayet başlığı · Baloo 2 800 · 27 · 1.1 */
  reportTitle: { fontFamily: fonts.heading, fontSize: 27, lineHeight: 27 * 1.1 },
  /** Şikayet nedeni · Nunito 800 · 16 */
  reason: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Engelle onayı · Nunito 800 · 15 */
  blockLabel: { fontFamily: fonts.extraBold, fontSize: 15 },
} as const satisfies Record<string, TextStyle>;
