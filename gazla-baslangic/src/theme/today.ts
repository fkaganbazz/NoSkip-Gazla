/**
 * Bugün ekranına özel token'lar — kaynak: design/Today.dc.html (açık) ve design/TodayDark.dc.html (koyu).
 * Genel rollerle aynı olan renkler `lightColors`/`darkColors`tan gelir; yalnızca bu ekranda geçenler burada.
 */
import type { TextStyle } from 'react-native';

import { darkColors, lightColors, palette } from './colors';
import { fonts } from './typography';

export type TodayColors = {
  // Kahraman kartı (su durumu)
  heroBg: string;
  heroCircle: string;
  streakChipBg: string;
  streakChipText: string;
  streakChipIcon: string;
  heroTitle: string;
  heroSub: string;
  dropStroke: string;
  dropFilled: string;
  dropEmpty: string;
  // Görev kartı
  taskCardShadow: string | undefined;
  taskTitleDone: string;
  progressTrack: string;
  progressFill: string;
  todoBg: string;
  todoShadow: string | undefined;
  todoCheckIcon: string;
  // Arkadaşlar
  waitingText: string;
  friendDoneRing: string;
  friendPendingRing: string;
  inviteRing: string;
};

export const todayColors: Record<'light' | 'dark', TodayColors> = {
  light: {
    heroBg: lightColors.actionTint,
    heroCircle: '#CBEBD6',
    streakChipBg: palette.nightPurple,
    streakChipText: palette.sand,
    streakChipIcon: '#8BE0AE',
    heroTitle: '#0E3B22',
    heroSub: '#1F4D33',
    dropStroke: lightColors.action,
    dropFilled: lightColors.action,
    dropEmpty: palette.white,
    taskCardShadow: 'rgba(36, 22, 63, 0.05)',
    taskTitleDone: lightColors.textBody,
    progressTrack: '#F1E9DF',
    progressFill: palette.dikenGreen,
    todoBg: lightColors.surface,
    todoShadow: '#CFE6D7',
    todoCheckIcon: '#B7C9BD',
    waitingText: palette.orange700,
    friendDoneRing: palette.dikenGreen,
    friendPendingRing: '#FF7A3D',
    inviteRing: '#B9AFA4',
  },
  dark: {
    heroBg: '#16392A',
    heroCircle: '#1C4633',
    streakChipBg: '#0E2A1C',
    streakChipText: palette.green100,
    streakChipIcon: '#8BE0AE',
    heroTitle: palette.green50,
    heroSub: '#B8E6CA',
    dropStroke: darkColors.action,
    dropFilled: darkColors.action,
    dropEmpty: 'transparent',
    taskCardShadow: undefined,
    taskTitleDone: darkColors.text,
    progressTrack: darkColors.border,
    progressFill: palette.dikenGreen,
    todoBg: 'transparent',
    todoShadow: undefined,
    todoCheckIcon: '#4E6B5C',
    waitingText: '#FF9A6B',
    friendDoneRing: palette.dikenGreen,
    friendPendingRing: '#FF7A3D',
    inviteRing: '#5E4F82',
  },
};

export const todayMetrics = {
  // Üst satır
  headerGap: 2,
  bellSize: 44,
  bellIconSize: 22,
  bellIconStrokeWidth: 2.2,
  badgeSize: 22,
  badgePaddingX: 5,
  badgeBorderWidth: 2,
  badgeTop: -4,
  badgeRight: -5,

  // Kahraman kartı
  heroMarginTop: 14,
  heroHeight: 164,
  heroPaddingTop: 16,
  heroPaddingX: 18,
  heroPaddingBottom: 14,
  heroRadius: 28,
  heroCircleSize: 190,
  heroCircleRight: -30,
  heroCircleTop: -26,
  heroColumnWidth: 196,
  heroGap: 6,
  streakChipGap: 6,
  streakChipPaddingY: 5,
  streakChipPaddingLeft: 8,
  streakChipPaddingRight: 10,
  streakIconSize: 15,
  streakIconStrokeWidth: 2.6,
  dropSize: 22,
  dropStrokeWidth: 2.2,
  dropGap: 4,
  dropLabelGap: 4,
  dikenSize: 138,
  dikenRight: 4,
  dikenBottom: -6,

  // Bölüm başlıkları
  tasksHeaderMarginTop: 18,
  friendsHeaderMarginTop: 16,
  sectionListMarginTop: 10,

  // Görev kartı
  taskGap: 8,
  taskHeight: 72,
  taskPaddingLeft: 14,
  taskPaddingRight: 12,
  taskRadius: 22,
  taskInnerGap: 12,
  taskTextGap: 5,
  taskIconTile: 44,
  taskIconRadius: 14,
  taskIconSize: 24,
  taskIconStrokeWidth: 2,
  progressHeight: 6,
  checkButtonSize: 52,
  checkButtonBorder: 3,
  checkButtonShadow: 3,
  doneIconSize: 26,
  doneIconStrokeWidth: 3.2,
  todoIconSize: 24,
  todoCheckStrokeWidth: 3,
  todoCameraStrokeWidth: 2.4,
  todoPlusStrokeWidth: 3,

  // Arkadaşlar
  friendWidth: 62,
  friendGap: 6,
  avatarSize: 54,
  avatarRing: 3,
  avatarPadding: 3,
  inviteRing: 2,
  inviteIconSize: 22,
  inviteIconStrokeWidth: 2.6,
  friendBadgeSize: 20,
  friendBadgeBorder: 2,
  friendBadgeRight: -4,
  friendBadgeBottom: -3,
  friendBadgeIconSize: 11,
  friendBadgeIconStrokeWidth: 4,
  pokePaddingY: 2,
  pokePaddingX: 10,
  pokeRadius: 10,
} as const;

/** Bu ekrana özgü metin stilleri */
export const todayTypography = {
  /** Selamlama · Baloo 2 800 · 27 · 1.1 */
  greeting: { fontFamily: fonts.heading, fontSize: 27, lineHeight: 27 * 1.1 },
  /** Kahraman kartı başlığı · Baloo 2 800 · 25 · 1.05 */
  heroTitle: { fontFamily: fonts.heading, fontSize: 25, lineHeight: 25 * 1.05 },
  /** Kahraman kartı açıklaması · Nunito 700 · 14 · 1.35 */
  heroSub: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 14 * 1.35 },
  /** Seri çipi · Nunito 800 · 12 · harf aralığı 0.4 */
  streakChip: { fontFamily: fonts.extraBold, fontSize: 12, letterSpacing: 0.4 },
  /** Görev başlığı · Nunito 800 · 15 · 1.2 */
  taskTitle: { fontFamily: fonts.extraBold, fontSize: 15, lineHeight: 15 * 1.2 },
  /** Avatar harfi · Nunito 800 · 16 */
  avatarInitial: { fontFamily: fonts.extraBold, fontSize: 16 },
} as const satisfies Record<string, TextStyle>;
