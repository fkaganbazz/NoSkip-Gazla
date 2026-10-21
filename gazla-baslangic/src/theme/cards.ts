/**
 * Kart ve kişi bileşenlerinin token'ları (src/components: CategoryTile, TaskCard, ProgressBar, Avatar,
 * AvatarStack, FriendRow, FriendBubble, StreakChip, DropMeter).
 * Kaynak: design/Today.dc.html ve TodayDark.dc.html (görev kartı, arkadaş şeridi, seri çipi, damlalar),
 * Friends.dc.html (kişi satırı), Components.dc.html (avatar halkaları), Poke.dc.html (48 px halka),
 * yüz yığınları (ChallengePreview, InviteLanding, Completion, StreakLost) ve challenge karoları
 * (PickChallenge, Explore, InviteFriends, InviteLanding, Detail, NumberEntry).
 * Koyu karşılığı çizilmemiş renkler en yakın koyu role bağlandı (satır yanında belirtildi).
 */
import type { TextStyle } from 'react-native';

import { darkColors, lightColors, palette } from './colors';
import { componentColors } from './components';
import { fonts, typography } from './typography';

export { categoryTint, categoryTints, customChallengeTint } from './accents';

export type CardColors = {
  // Görev kartı
  /** Kart gölgesi (açıkta 0 1px 2px; koyuda yok) */
  taskCardShadow: string | undefined;
  /** Tamamlanan görevin başlığı */
  taskTitleDone: string;
  /** İşaretlenmemiş aksiyon butonu: zemin, alt gölge, soluk tik */
  todoBg: string;
  todoShadow: string | undefined;
  todoCheckIcon: string;
  // İlerleme çubuğu
  progressTrack: string;
  progressFill: string;
  // Avatar halkaları
  ringDone: string;
  ringPending: string;
  /** Davet: kesikli gri halka (Today "Davet et") */
  ringInvite: string;
  // Kişi satırı
  rowDivider: string;
  /** "Gaz ver" yeşil hap */
  hypeBg: string;
  hypeText: string;
  /** Turuncu "Dürt" hapının alt gölgesi */
  pokeShadow: string;
  // Seri çipi
  streakChipBg: string;
  streakChipText: string;
  streakChipIcon: string;
  // Su damlaları
  dropStroke: string;
  dropFilled: string;
  dropEmpty: string;
  dropLabel: string;
};

export const cardColors: Record<'light' | 'dark', CardColors> = {
  light: {
    taskCardShadow: 'rgba(36, 22, 63, 0.05)',
    taskTitleDone: lightColors.textBody,
    todoBg: lightColors.surface,
    todoShadow: '#CFE6D7',
    todoCheckIcon: '#B7C9BD',
    progressTrack: componentColors.light.progressTrack, // #F1E9DF
    progressFill: palette.dikenGreen,
    ringDone: palette.dikenGreen,
    ringPending: componentColors.light.pendingRing, // #FF7A3D
    ringInvite: '#B9AFA4',
    rowDivider: '#F4EDE5',
    hypeBg: palette.green100,
    hypeText: palette.pressedGreen,
    pokeShadow: palette.orange700,
    streakChipBg: palette.nightPurple,
    streakChipText: palette.sand,
    streakChipIcon: palette.darkActionText, // #8BE0AE
    dropStroke: lightColors.action,
    dropFilled: lightColors.action,
    dropEmpty: palette.white,
    dropLabel: '#1F4D33',
  },
  dark: {
    taskCardShadow: undefined,
    taskTitleDone: darkColors.text,
    todoBg: 'transparent',
    todoShadow: undefined,
    todoCheckIcon: '#4E6B5C',
    progressTrack: palette.darkLine, // TodayDark: #33264F
    progressFill: palette.dikenGreen,
    ringDone: palette.dikenGreen,
    ringPending: componentColors.dark.pendingRing,
    ringInvite: '#5E4F82',
    // Friends'in koyu tasarımı yok: ayraç koyu çizgi, "Gaz ver" koyu aksiyon hapı (TabBar koyu).
    // Koyu satır butonu (ink) ortak `componentColors.inkButton*`: seçili çip gibi kum zemin + koyu metin.
    rowDivider: palette.darkLine,
    hypeBg: palette.darkActionTint,
    hypeText: palette.darkActionText,
    pokeShadow: palette.orange700,
    streakChipBg: '#0E2A1C',
    streakChipText: palette.green100,
    streakChipIcon: palette.darkActionText,
    dropStroke: darkColors.action,
    dropFilled: darkColors.action,
    dropEmpty: 'transparent',
    dropLabel: '#B8E6CA',
  },
};

/** Avatar halkası: dış ölçüye göre kalınlık ve halka–yüz boşluğu (büyükten küçüğe) */
const avatarRings = [
  { minSize: 52, width: 3, gap: 3 }, // Today, Components · 54
  { minSize: 44, width: 2, gap: 3 }, // Poke · 48
  { minSize: 0, width: 2, gap: 2 }, // Friends, Components · 40
] as const;

/** Ekle yuvasının artısı: Today "Davet et" 54 → 22 / 2.6, Create davet satırı 40 → 18 / 2.8 (Create.dc.html) */
const addAvatarIcons = [
  { minSize: 52, iconSize: 22, iconStrokeWidth: 2.6 },
  { minSize: 0, iconSize: 18, iconStrokeWidth: 2.8 },
] as const;

/** Tik rozeti: büyük avatarlarda Today (20 + 2 kenar, content-box, köşe 10), küçüklerde Friends (18, border-box) */
const avatarBadges = [
  { minSize: 52, size: 24, border: 2, radius: 10, right: -4, bottom: -3, iconSize: 11, iconStrokeWidth: 4 },
  { minSize: 0, size: 18, border: 2, radius: 9, right: -3, bottom: -3, iconSize: 9, iconStrokeWidth: 4.5 },
] as const;

export const cardMetrics = {
  /** Basılınca gövde saydamlığı (kişi satırı ve görev kartı gövdesi) */
  pressedOpacity: 0.7,

  // Challenge karosu: ölçü → köşe ve ikon (çizgi 2)
  categoryTile: {
    36: { radius: 12, iconSize: 22 }, // PickChallenge, FriendProfile ortak challenge
    42: { radius: 14, iconSize: 22 }, // Explore listesi
    44: { radius: 14, iconSize: 24 }, // Today görev kartı, InviteFriends, NumberEntry
    52: { radius: 16, iconSize: 28 }, // InviteLanding
    56: { radius: 18, iconSize: 28 }, // Detail
  },
  categoryTileStrokeWidth: 2,

  // Görev kartı
  /** Kart yüksekliği · 72 (büyük yazıda içerikle uzar) */
  taskHeight: 72,
  taskPaddingLeft: 14,
  taskPaddingRight: 12,
  taskRadius: 22,
  taskShadowY: 1,
  taskShadowBlur: 2,
  taskInnerGap: 12,
  taskTextGap: 5,
  taskTile: 44,
  actionSize: 52,
  actionBorder: 3,
  actionShadow: 3,
  /** Basılınca aşağı kayma (Components: tok butonlar 2 px iner, gölge o kadar kısalır) */
  actionPressOffset: 2,
  doneIconSize: 26,
  doneIconStrokeWidth: 3.2,
  todoIconSize: 24,
  todoCheckStrokeWidth: 3,
  todoCameraStrokeWidth: 2.4,
  todoPlusStrokeWidth: 3,

  // İlerleme çubuğu
  progressHeight: 6,

  // Avatar
  avatarSize: 40,
  avatarRings,
  /** Davet halkası her ölçüde 2 px (Today "Davet et" · 54) */
  inviteRingWidth: 2,
  avatarBadges,
  addAvatarIcons,
  /** Yüz yığını: üst üste binme ve zemin renginde kenar */
  stackOverlap: -8,
  stackOutline: 2,

  // Kişi satırı ve liste kartı (Friends)
  listRadius: 20,
  rowHeight: 62,
  rowPaddingLeft: 14,
  rowPaddingRight: 12,
  rowGap: 12,
  rowAvatar: 40,
  /**
   * Satır butonu (FriendRowButton): md 36 (Friends satırı, Activity), lg 40, 0 14, köşe 14 (Friends davet kartı
   * "Paylaş"; InviteFriends "Kopyala" köşe 12). Activity'de iç boşluk 0 14 (`rowButtonPaddingXWide`).
   */
  rowButtonHeight: 36,
  rowButtonHeightLg: 40,
  rowButtonPaddingX: 12,
  rowButtonPaddingXWide: 14,
  rowButtonRadius: 12,
  rowButtonRadiusLg: 14,
  /** İkon + metin (InviteFriends "Kopyala"): ikon 16 / 2.4, aralık 6 */
  rowButtonIconSize: 16,
  rowButtonIconStrokeWidth: 2.4,
  rowButtonIconGap: 6,
  pillRadius: 18,
  pokePaddingX: 16,
  pokeShadow: 2,
  dismissIconSize: 16,
  dismissIconStrokeWidth: 3,

  // Arkadaş şeridi öğesi (Today)
  bubbleWidth: 62,
  bubbleGap: 6,
  bubbleAvatar: 54,
  bubblePokePaddingY: 2,
  bubblePokePaddingX: 10,
  bubblePokeRadius: 10,

  // Seri çipi
  streakChipGap: 6,
  streakChipPaddingY: 5,
  streakChipPaddingLeft: 8,
  streakChipPaddingRight: 10,
  streakIconSize: 15,
  streakIconStrokeWidth: 2.6,

  // Su damlaları: Today 22 / 4 aralık, Components 20 / 3 aralık
  drop: {
    regular: { size: 22, gap: 4 },
    small: { size: 20, gap: 3 },
  },
  dropStrokeWidth: 2.2,
  dropLabelGap: 4,
} as const;

export type CategoryTileSize = keyof typeof cardMetrics.categoryTile;

/** Avatar baş harfi: yüz çapına göre (Nunito 800; 52 ve üstü Baloo 2 800) */
const nunitoInitial = (fontSize: number): TextStyle => ({ fontFamily: fonts.extraBold, fontSize });
const balooInitial = (fontSize: number): TextStyle => ({ fontFamily: fonts.heading, fontSize });

export const cardTypography = {
  /** Görev başlığı · Nunito 800 · 15 · 1.2 */
  taskTitle: { fontFamily: fonts.extraBold, fontSize: 15, lineHeight: 15 * 1.2 },
  /** Görev alt bilgisi · Nunito 700 · 13 */
  taskMeta: typography.meta,
  /** Kişi satırı adı · Nunito 800 · 15 */
  rowTitle: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Kişi satırı alt bilgisi · Nunito 700 · 12 */
  rowSub: { fontFamily: fonts.bold, fontSize: 12 },
  /** Satır butonu · Nunito 800 · 14 */
  rowButton: typography.captionStrong,
  /** Kişi satırı avatar harfi · Nunito 800 · 14 (Friends) */
  rowAvatarInitial: nunitoInitial(14),
  /** Şerit öğesi adı · Nunito 800 · 13 */
  bubbleName: typography.metaStrong,
  /** Şerit "Dürt" hapı · Nunito 800 · 12 */
  bubblePoke: typography.smallStrong,
  /** Seri çipi · Nunito 800 · 12 · harf aralığı 0.4 */
  streakChip: { fontFamily: fonts.extraBold, fontSize: 12, letterSpacing: 0.4 },
  /** "1/3 su" · Nunito 800 · 13 */
  dropLabel: typography.metaStrong,
} as const satisfies Record<string, TextStyle>;

/**
 * Yüz çapına göre baş harf stili — tasarımlardaki örnekler: 26 → 11 (StreakLost), 28–30 → 12
 * (ChallengePreview, InviteLanding), 32 → 14 (Friends halkalı), 36–44 → 16 (Detail, Today, Activity),
 * 52 → Baloo 24 (Settings), 56 → Baloo 26 (Garden), 84 → Baloo 36 (Profile), 88 → Baloo 38 (FriendProfile).
 */
const avatarInitials: { below: number; style: TextStyle }[] = [
  { below: 28, style: nunitoInitial(11) },
  { below: 32, style: nunitoInitial(12) },
  { below: 36, style: nunitoInitial(14) },
  { below: 52, style: nunitoInitial(16) },
  { below: 56, style: balooInitial(24) },
  { below: 84, style: balooInitial(26) },
  { below: 88, style: balooInitial(36) },
  { below: Infinity, style: balooInitial(38) },
];

export function avatarInitialStyle(diameter: number): TextStyle {
  return (avatarInitials.find((s) => diameter < s.below) ?? avatarInitials[avatarInitials.length - 1]).style;
}
