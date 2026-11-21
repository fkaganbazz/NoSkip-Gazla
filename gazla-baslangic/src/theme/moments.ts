/**
 * "An" ekranlarına özel token'lar — kaynak: design/Completion.dc.html, design/Finished.dc.html,
 * design/ShareCard.dc.html, design/StreakLost.dc.html. Bu ekranların koyu tasarımı yok:
 * Completion ve ShareCard zaten koyu yeşil zeminli (iki modda aynı); Finished ve StreakLost'un
 * koyu karşılıkları en yakın koyu rollere (colors.ts, DetailDark) bağlandı.
 */
import type { TextStyle } from 'react-native';

import { darkColors, lightColors, palette } from './colors';
import { fonts } from './typography';

type Scheme = 'light' | 'dark';

/** Konfeti parçaları (iki modda aynı) */
export const confettiColors = {
  yellow: palette.flowerYellow,
  orange: '#FF7A3D',
  sand: palette.sand,
  mint: '#8BE0AE',
  potOrange: palette.potOrange,
  green: palette.dikenGreen,
  purple: '#7C5CC4',
} as const;

// Completion + ShareCard (yeşil kutlama zemini; iki modda aynı) ---------------------------------------

export const celebrationColors = {
  bg: palette.actionGreen,
  ringOuter: '#23874D',
  ringInner: '#2A9156',
  text: palette.sand,
  sub: palette.green100,
  // Seri kartı
  cardBg: palette.sand,
  streakNumber: palette.actionGreen,
  streakLabel: palette.ink700,
  dayLabel: palette.ink500,
  dayLabelToday: palette.nightPurple,
  dayDone: palette.dikenGreen,
  dayToday: palette.actionGreen,
  dayTodayRing: palette.flowerYellow,
  dayCheck: palette.white,
  /** Kaçırılan / görevsiz gün — tasarımda yok; Detail'in gelecek gün hücresi */
  dayEmpty: '#F4EDE5',
  daySaved: palette.rescue,
  daySavedDrop: palette.potOrange,
  // Arkadaş yığını
  stackBorder: palette.actionGreen,
  // "… gazla" metin butonu ("Süper": ortak Button onGreen)
  linkText: palette.sand,
  // ShareCard
  bigNumber: palette.flowerYellow,
  handleBg: palette.sand,
  handleText: palette.nightPurple,
  /** ShareCard logosu (AppIcon): DikenFaceIcon'un zemini */
  logoBg: palette.nightPurple,
} as const;

/** Seri alevi ve kutlaması (Completion seri kartı; iki modda aynı) */
export const flameColors = {
  outerBottom: palette.potOrange,
  outerTop: '#FF9A3D',
  innerBottom: palette.flowerYellow,
  innerTop: '#FFE7A1',
  outline: palette.nightPurple,
  /** Alevin arkasındaki sıcaklık (radyal parlama) */
  heat: '#FFAA3C',
  embers: [palette.flowerYellow, '#FF9A3D', palette.potOrange, '#FFE7A1'],
  /** Kilometre taşında kartın çevresindeki ışık */
  glow: '#FF7A3D',
  /** Yeni sayı turuncu parlayıp yeşile döner */
  numberFlash: palette.potOrange,
  plusBg: palette.potOrange,
  plusText: palette.nightPurple,
  pillBg: palette.potOrange,
  pillText: palette.nightPurple,
  pillShadow: '#B83A0B',
  ripple: palette.potOrange,
  spark: palette.flowerYellow,
  sparkStroke: palette.sand,
} as const;

// Finished --------------------------------------------------------------------------------------------

export type FinishedColors = {
  bg: string;
  glow: string;
  badgeBg: string;
  badgeText: string;
  body: string;
  statLabel: string;
  gardenBg: string;
  gardenText: string;
};

export const finishedColors: Record<Scheme, FinishedColors> = {
  light: {
    bg: lightColors.background,
    glow: '#FFF1C7',
    badgeBg: palette.flowerYellow,
    badgeText: palette.nightPurple,
    body: lightColors.textBody,
    statLabel: lightColors.textSecondary,
    gardenBg: palette.green100,
    gardenText: '#0E3B22',
  },
  dark: {
    bg: darkColors.background,
    glow: '#4A3A12', // avatarTints.butter koyu zemini
    badgeBg: palette.flowerYellow,
    badgeText: palette.nightPurple,
    body: darkColors.textBody,
    statLabel: darkColors.textSecondary,
    gardenBg: palette.darkGreenSurface, // TodayDark kahraman kartı
    gardenText: palette.green50,
  },
};

// StreakLost ------------------------------------------------------------------------------------------

export type StreakLostColors = {
  bgLost: string;
  bgSaved: string;
  pillBg: string;
  pillLostText: string;
  pillSavedText: string;
  body: string;
  stackBorder: string;
  adDrop: string;
  adBadgeBg: string;
};

export const streakLostColors: Record<Scheme, StreakLostColors> = {
  light: {
    bgLost: '#F1ECE2',
    bgSaved: palette.green50,
    pillBg: palette.white,
    pillLostText: '#9A3412',
    pillSavedText: palette.pressedGreen,
    body: lightColors.textBody,
    stackBorder: palette.white,
    adDrop: '#8BE0AE',
    adBadgeBg: 'rgba(255, 255, 255, 0.18)',
  },
  dark: {
    bgLost: darkColors.background,
    bgSaved: darkColors.background,
    pillBg: darkColors.surface,
    pillLostText: '#FFB891', // DetailDark turuncu çip metni
    pillSavedText: palette.darkActionText,
    body: darkColors.textBody,
    stackBorder: darkColors.surface,
    adDrop: palette.darkActionTint,
    adBadgeBg: 'rgba(21, 14, 38, 0.18)',
  },
};

// Ölçüler ---------------------------------------------------------------------------------------------

export const momentsMetrics = {
  // Ortak (kapat, butonlar: ortak IconButton / Button)
  footerGap: 4,
  bottomPadding: 30,

  // Completion
  ringOuter: 320,
  ringOuterLeft: 35,
  ringOuterTop: 96,
  ringInner: 240,
  ringInnerLeft: 75,
  ringInnerTop: 136,
  completionDikenTop: 8,
  completionDiken: 232,
  completionTextTop: 6,
  completionTextGap: 4,
  streakCardTop: 18,
  streakCardPaddingY: 14,
  streakCardPaddingX: 16,
  streakCardRadius: 24,
  streakCardGap: 14,
  streakColumn: 78,
  weekGap: 4,
  dayDot: 26,
  dayRing: 3,
  dayCheckSize: 13,
  dayCheckStroke: 3.8,
  dayDropSize: 14,
  /** Gün etiketi kutusu: "Bugün" 29 px'lik sütundan taşar, ortalanır */
  dayLabelWidth: 44,
  friendsTop: 14,
  friendsGap: 10,
  /** Arkadaş yığını (ortak AvatarStack; kenar 2, binme -8 ortak) */
  stackAvatar: 30,

  // Finished
  glow: 280,
  glowLeft: 55,
  glowTop: 84,
  finishedDikenTop: -8,
  finishedDiken: 192,
  finishedTextTop: 10,
  finishedTextGap: 6,
  badgePaddingY: 5,
  badgePaddingX: 12,
  statsTop: 16,
  statsGap: 10,
  statPaddingY: 12,
  statPaddingX: 8,
  statRadius: 18,
  statGap: 2,
  gardenTop: 12,
  gardenHeight: 64,
  gardenPaddingLeft: 8,
  gardenPaddingRight: 14,
  gardenRadius: 20,
  gardenGap: 10,
  gardenDikenRow: 56,
  gardenDikenSmall: 40,
  gardenDikenLarge: 44,
  chevronSize: 20,
  chevronStroke: 2.4,

  // ShareCard
  cardWidth: 360,
  cardHeight: 640,
  cardPaddingTop: 34,
  cardPaddingX: 26,
  cardPaddingBottom: 40,
  cardRingOuter: 300,
  cardRingOuterLeft: 30,
  cardRingOuterTop: 74,
  cardRingInner: 220,
  cardRingInnerLeft: 70,
  cardRingInnerTop: 114,
  logoSize: 30,
  logoRadius: 8,
  logoGap: 8,
  cardDikenTop: 14,
  cardDiken: 196,
  bigNumberTop: 8,
  cardTitleTop: 10,
  cardSubTop: 8,
  handlePaddingY: 10,
  handlePaddingX: 18,
  /** Görsel çıktı (EKRANLAR 2.7): 360×640 tasarım = 1080×1920 PNG (3 kat) */
  shareImageWidth: 1080,
  shareImageHeight: 1920,
  /** Geliştirme önizlemesi (/dev/share-card): kartın ekrandaki köşesi (paylaşılan görselde köşe yok) */
  previewRadius: 22,
  previewGap: 16,

  // StreakLost
  pillGap: 6,
  pillPaddingY: 7,
  pillPaddingX: 12,
  pillIconSize: 16,
  pillClockStroke: 2.6,
  pillCheckStroke: 3,
  lostDikenTop: 14,
  lostDiken: 236,
  lostTextTop: 10,
  lostTextGap: 8,
  lostTextMaxWidth: 320,
  friendsPillTop: 14,
  friendsPillGap: 8,
  friendsPillPaddingY: 8,
  friendsPillPaddingLeft: 8,
  friendsPillPaddingRight: 14,
  lostStackAvatar: 26,
  actionsGap: 10,
  adButtonHeight: 58,
  adButtonGap: 10,
  adDropSize: 22,
  adBadgePaddingY: 3,
  adBadgePaddingX: 8,
  adBadgeRadius: 8,

  // Seri kartı alevi ve kutlaması
  streakColumnFlame: 96,
  flameHeight: 28,
  flameNumberGap: 2,
  heatSize: 56,
  emberSize: 5,
  plusTop: -8,
  plusRight: -6,
  plusPaddingX: 7,
  plusPaddingY: 2,
  pillTop: -15,
  pillPaddingLeft: 9,
  pillPaddingRight: 12,
  pillPaddingYTop: 3,
  pillPaddingYBottom: 1,
  pillFlameHeight: 15,
  pillGapFlame: 4,
  pillShadowY: 3,
  glowInset: 4,
  glowBorder: 3,
  glowBlur: 24,
  rippleBorder: 3,
  rippleScale: 1.9,
  sparkSize: 16,
  /** Kıvılcım Diken'in tepesinden çıkar: Diken kutusunun üstünden (px) */
  sparkFromTop: 16,
  sparkTrailSize: 6,
  /** Kıvılcımın yayı: önce sağa ve yukarı, sonra hedefin üstünden iner (px) */
  sparkRiseX: 70,
  sparkRiseY: -40,
  sparkDiveX: 10,
  sparkDiveY: -120,
  sparkSpinDeg: 560,
} as const;

// Hareket (Completion) --------------------------------------------------------------------------------

/**
 * Tamamlama anı: Diken aşağıdan küçülmüş gelir, iki kez hafifçe zıplar; konfeti ilk zıplamayla
 * yukarıdan süzülerek belirir. Tasarımda hareket yok — hepsi bitince görünüm tasarımla birebir.
 * "Hareketi azalt" açıksa hiçbiri oynamaz.
 */
export const momentsMotion = {
  /** Başlamadan önce bir kare bekle (ilk karede zaman sapması sıçrama yapmasın) */
  startDelayMs: 32,
  /** Giriş: aşağıdan (px) ve küçükten (ölçek) saksının altından büyüyerek */
  enterOffset: 24,
  enterScale: 0.88,
  enterDurationMs: 320,
  /** Zıplama: yükseklik (px), çıkış/iniş süresi, sayısı ve aralarındaki bekleme */
  hopHeight: 14,
  hopUpMs: 170,
  hopDownMs: 230,
  hopCount: 2,
  hopGapMs: 70,
  /** İnişte saksı hafifçe basılır (dikey ölçek) */
  landSquash: 0.96,
  landSquashMs: 90,
  /** Konfeti girişin sonunda, ilk zıplamayla birlikte belirir ve bu kadar (px) yukarıdan iner */
  confettiDelayMs: 320,
  confettiDurationMs: 600,
  confettiDrop: 14,
} as const;

/**
 * Seri kartının kutlaması (Completion). Zamanlar ekran açılışından (ms). Sıra: Diken'den bugünün dairesine
 * kıvılcım → gün dolar → alev harlanır, sayı kayar (ilk günde alev sıfırdan tutuşur) → kilometre taşında
 * kart alev alır. Titreşimler de aynı anlarda (src/features/moments/useStreakFlare).
 */
export const streakFlareMotion = {
  sparkAt: 550,
  sparkMs: 430,
  /** Kıvılcımın arkasındaki ışık noktaları */
  trailCount: 6,
  trailMs: 380,
  dayFillAt: 980,
  dayFillMs: 360,
  rippleMs: 520,
  checkAt: 1100,
  checkMs: 260,
  flareAt: 1160,
  flareMs: 760,
  flareScale: 1.5,
  milestoneFlareScale: 1.75,
  numberOutMs: 260,
  numberInMs: 640,
  plusMs: 900,
  /** İlk gün: alev tutuşur, sonra "1" */
  igniteAt: 1200,
  igniteMs: 650,
  startNumberAt: 1420,
  numberPopMs: 380,
  /** Kilometre taşı: kart parlar, nabız atar */
  milestoneAt: 1420,
  glowMs: 1100,
  cardPulseMs: 700,
  pillAt: 1440,
  pillMs: 460,
  heatMs: 900,
  emberMs: 900,
  emberStaggerMs: 22,
  emberCount: 11,
  startEmberCount: 12,
  milestoneEmberCount: 22,
  emberRise: 34,
  emberSpread: 44,
  milestoneEmberSpread: 70,
  /** Ekran açık kaldıkça alevin sakin titremesi */
  flickerMs: 1400,
  innerFlickerMs: 900,
  /** Titreşim anları */
  hapticLightAt: 980,
  hapticSuccessAt: 1160,
  hapticIgniteAt: 1200,
  hapticStartSuccessAt: 1420,
  hapticMilestoneAt: [1420, 1560],
} as const;

// Yazı ------------------------------------------------------------------------------------------------

export const momentsTypography = {
  /** "Bugün tamam!" · Baloo 2 800 · 46 · 1 */
  completionTitle: { fontFamily: fonts.heading, fontSize: 46, lineHeight: 46 },
  /** Kutlama açıklaması · Nunito 700 · 16 · 1.4 */
  completionSub: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 16 * 1.4 },
  /** Seri sayısı · Baloo 2 800 · 44 · 0.95 */
  streakNumber: { fontFamily: fonts.heading, fontSize: 44, lineHeight: 44 * 0.95 },
  /** "günlük seri" · Nunito 800 · 12 */
  streakLabel: { fontFamily: fonts.extraBold, fontSize: 12 },
  /** Gün kısaltması · Nunito 800 · 11 */
  dayLabel: { fontFamily: fonts.extraBold, fontSize: 11 },
  /** Arkadaş satırı · Nunito 700 · 14 */
  friends: { fontFamily: fonts.bold, fontSize: 14 },
  /** Yığındaki avatar harfi · Nunito 800 · 13 (ortak AvatarStack 30'da 12) */
  stackInitial: { fontFamily: fonts.extraBold, fontSize: 13 },

  /** "30/30 GÜN" · Nunito 800 · 13 · aralık 0.6 */
  badge: { fontFamily: fonts.extraBold, fontSize: 13, letterSpacing: 0.6 },
  /** "Efsane!" · Baloo 2 800 · 50 · 1 */
  finishedTitle: { fontFamily: fonts.heading, fontSize: 50, lineHeight: 50 },
  /** Bitti açıklaması · Nunito 600 · 16 · 1.45 */
  finishedSub: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 16 * 1.45 },
  /** İstatistik sayısı · Baloo 2 800 · 26 · 1 */
  statValue: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 26 },
  /** İstatistik etiketi · Nunito 800 · 12 */
  statLabel: { fontFamily: fonts.extraBold, fontSize: 12 },
  /** Bahçe satırı · Nunito 800 · 15 · 1.25 */
  garden: { fontFamily: fonts.extraBold, fontSize: 15, lineHeight: 15 * 1.25 },

  /** "Gazla" logosu · Baloo 2 800 · 24 · 1 */
  logo: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 24 },
  /** "30 GÜN" · Baloo 2 800 · 86 · 0.85 */
  bigNumber: { fontFamily: fonts.heading, fontSize: 86, lineHeight: 86 * 0.85 },
  /** Kart başlığı · Baloo 2 800 · 26 · 1.05 */
  cardTitle: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 26 * 1.05 },
  /** "Deniz başardı." · Nunito 700 · 15 */
  cardSub: { fontFamily: fonts.bold, fontSize: 15 },
  /** Kullanıcı adı hapı · Nunito 800 · 14 */
  handle: { fontFamily: fonts.extraBold, fontSize: 14 },

  /** Kurtarma süresi hapı · Nunito 800 · 13 */
  pill: { fontFamily: fonts.extraBold, fontSize: 13 },
  /** "Serin koptu" · Baloo 2 800 · 36 · 1 */
  lostTitle: { fontFamily: fonts.heading, fontSize: 36, lineHeight: 36 },
  /** Seri koptu açıklaması · Nunito 600 · 16 · 1.45 */
  lostSub: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 16 * 1.45 },
  /** Arkadaş hapı · Nunito 700 · 14 */
  friendsPill: { fontFamily: fonts.bold, fontSize: 14 },
  /** "30 sn" rozeti · Nunito 800 · 12 */
  adBadge: { fontFamily: fonts.extraBold, fontSize: 12 },

  /** Seri kartı: "+1" · Nunito 800 · 13 */
  plusOne: { fontFamily: fonts.extraBold, fontSize: 13 },
  /** "SERİ BAŞLADI!", "1 HAFTA!" · Baloo 2 800 · 15 · aralık 0.6 */
  flarePill: { fontFamily: fonts.heading, fontSize: 15, lineHeight: 19, letterSpacing: 0.6 },
} as const satisfies Record<string, TextStyle>;
