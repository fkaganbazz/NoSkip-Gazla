/**
 * Ayarlar grubuna özel token'lar — kaynak: design/Settings.dc.html, design/Notifications.dc.html,
 * design/DeleteAccount.dc.html, design/AdConsent.dc.html (profil düzenleme: design/Profile.dc.html).
 * Bu ekranların koyu tasarımı yok; koyu karşılıklar en yakın koyu role / vurgu rengine bağlandı.
 * Genel rollerle aynı olan renkler `useTheme().colors`tan gelir; burada yalnızca bu ekranlarda geçenler var.
 */
import type { TextStyle } from 'react-native';

import { avatarTints, challengeTints } from './accents';
import { palette } from './colors';
import { fonts } from './typography';

export type SettingsColors = {
  /** Kart içi satır ayracı (açıkta kart kenarından açık) */
  rowDivider: string;
  /** Görünüm seçici: zemin, seçili hücre, gölge */
  themeTrack: string;
  themeThumb: string;
  themeShadow: string;
  /** Alt sayfa arkasındaki karartma */
  backdrop: string;
  /** Profil düzenleme: kamera butonu zemini, ikonu, dış halkası */
  cameraBg: string;
  cameraIcon: string;
  cameraRing: string;
  /** Bildirimler: kural çipleri (zemin / metin) */
  ruleChipStrongBg: string;
  ruleChipStrongText: string;
  ruleChipLilacBg: string;
  ruleChipLilacText: string;
  ruleChipPeachBg: string;
  ruleChipPeachText: string;
  /** Bildirim metni başlığı: Diken'den gelen / arkadaştan gelen */
  dikenTitle: string;
  friendTitle: string;
  /** Reklam izni: Diken arkasındaki daire ve madde karoları (zemin / ikon) */
  adCircle: string;
  adNoAdBg: string;
  adNoAdInk: string;
  adRescueBg: string;
  adRescueInk: string;
  adTargetBg: string;
  adTargetInk: string;
};

export const settingsColors: Record<'light' | 'dark', SettingsColors> = {
  light: {
    rowDivider: '#F4EDE5',
    themeTrack: palette.line,
    themeThumb: palette.card,
    themeShadow: 'rgba(36, 22, 63, 0.14)',
    // Tasarımda yok (alt sayfa açık hali çizilmedi): gece moru %45
    backdrop: 'rgba(36, 22, 63, 0.45)',
    cameraBg: palette.nightPurple,
    cameraIcon: palette.white,
    cameraRing: palette.sand,
    ruleChipStrongBg: palette.nightPurple,
    ruleChipStrongText: palette.sand,
    ruleChipLilacBg: challengeTints.lilac.light.bg,
    ruleChipLilacText: challengeTints.lilac.light.ink,
    ruleChipPeachBg: palette.rescue,
    ruleChipPeachText: '#9A3412',
    dikenTitle: palette.actionGreen,
    friendTitle: palette.orange700,
    adCircle: palette.green100,
    adNoAdBg: palette.green100,
    adNoAdInk: '#1F6B40',
    adRescueBg: palette.rescue,
    adRescueInk: palette.orange700,
    adTargetBg: challengeTints.lilac.light.bg,
    adTargetInk: challengeTints.lilac.light.ink,
  },
  dark: {
    // Koyu tasarım yok: ayraç kart kenarından bir ton koyu (DetailDark dolgu)
    rowDivider: palette.darkFill,
    themeTrack: palette.darkFill,
    themeThumb: palette.darkSurface,
    themeShadow: 'rgba(0, 0, 0, 0.35)',
    backdrop: 'rgba(0, 0, 0, 0.55)',
    cameraBg: palette.sand,
    cameraIcon: palette.darkBackground,
    cameraRing: palette.darkBackground,
    ruleChipStrongBg: palette.sand,
    ruleChipStrongText: palette.darkBackground,
    ruleChipLilacBg: challengeTints.lilac.dark.bg,
    ruleChipLilacText: challengeTints.lilac.dark.ink,
    ruleChipPeachBg: avatarTints.peach.dark.bg,
    ruleChipPeachText: avatarTints.peach.dark.ink,
    dikenTitle: palette.darkActionText,
    friendTitle: '#FF9A6B', // TodayDark: turuncu metin
    adCircle: palette.darkActionTint,
    adNoAdBg: avatarTints.mint.dark.bg,
    adNoAdInk: avatarTints.mint.dark.ink,
    adRescueBg: avatarTints.peach.dark.bg,
    adRescueInk: avatarTints.peach.dark.ink,
    adTargetBg: challengeTints.lilac.dark.bg,
    adTargetInk: challengeTints.lilac.dark.ink,
  },
};

export const settingsMetrics = {
  // Ayarlar listesi
  profileCardMarginTop: 18,
  profileCardPaddingY: 14,
  profileCardPaddingX: 16,
  profileCardGap: 14,
  profileAvatar: 52,
  profileChevronSize: 20,
  chevronStrokeWidth: 2.4,
  sectionMarginTop: 22,
  groupMarginTop: 8,
  rowPaddingY: 14,
  rowPaddingX: 16,
  rowGap: 12,
  rowTextGap: 2,
  /** Bağlantı satırı en az yüksekliği · 56 (Destek ve yasal satırları 54) */
  linkRowHeight: 56,
  linkRowHeightCompact: 54,
  rowChevronSize: 18,
  themeTrackPadding: 4,
  themeTrackRadius: 16,
  themeCellHeight: 44,
  themeCellRadius: 12,
  footerMarginTop: 20,
  screenPaddingBottom: 40,

  // Engellenenler (tasarımı yok): boş durum metninin üst boşluğu · 2 × bölüm boşluğu
  emptyMarginTop: 44,

  // Alt sayfa (seçenek listesi, profil düzenleme)
  sheetPaddingTop: 20,
  sheetMaxHeightRatio: 0.85,
  optionRowHeight: 52,
  optionRowPaddingY: 10,

  // Profil düzenleme (Profile.dc.html)
  editAvatar: 84,
  editAvatarGap: 16,
  cameraButton: 36,
  cameraBorder: 3,
  cameraOffset: -4,
  cameraIconSize: 16,
  cameraIconStrokeWidth: 2.4,
  editFieldsMarginTop: 24,
  editFieldsGap: 16,

  // Bildirimler
  chipsMarginTop: 18,
  chipsGap: 10,
  ruleChipPaddingY: 8,
  ruleChipPaddingX: 14,
  copyRowPaddingY: 12,

  // Hesabı sil
  deleteDikenSize: 150,
  deleteDikenMarginTop: 6,
  deleteTitleMarginTop: 6,
  deleteTitleGap: 6,
  deleteListMarginTop: 16,
  deleteListRadius: 20,
  deleteRowHeight: 52,
  deleteIconSize: 20,
  deleteIconStrokeWidth: 2.2,
  confirmMarginTop: 16,
  confirmButtonHeight: 56,
  actionsGap: 4,
  deletePaddingBottom: 30,

  // Reklam izni
  adHeroHeight: 230,
  adCircleSize: 200,
  adCircleTop: 20,
  adDikenSize: 176,
  adTitleMarginTop: 14,
  adLeadMarginTop: 8,
  adListMarginTop: 14,
  adListGap: 12,
  adTile: 34,
  adTileRadius: 11,
  adTextPaddingTop: 6,
  adCheckSize: 18,
  adCheckStrokeWidth: 3,
  adPlaySize: 16,
  adTargetSize: 18,
  adTargetStrokeWidth: 2.4,
  adNoteMarginBottom: 8,
  adPaddingBottom: 30,
} as const;

/** Bu ekranlara özgü metin stilleri */
export const settingsTypography = {
  /** Profil kartı adı · Nunito 800 · 17 */
  profileName: { fontFamily: fonts.extraBold, fontSize: 17 },
  /** Profil avatar harfi · Baloo 2 800 · 24 (düzenleme ekranında 36) */
  profileInitial: { fontFamily: fonts.heading, fontSize: 24 },
  editInitial: { fontFamily: fonts.heading, fontSize: 36 },
  /** Satır başlığı · Nunito 800 · 16 */
  rowTitle: { fontFamily: fonts.extraBold, fontSize: 16 },
  /** Satır açıklaması · Nunito 600 · 13 */
  rowDetail: { fontFamily: fonts.semiBold, fontSize: 13 },
  /** Profil fotoğrafı açıklaması · Nunito 600 · 14 (Profile.dc.html) */
  photoHint: { fontFamily: fonts.semiBold, fontSize: 14 },
  /** Satır sağındaki değer · Nunito 700 · 15 */
  rowValue: { fontFamily: fonts.bold, fontSize: 15 },
  /** Görünüm seçici hücresi · Nunito 800 · 15 */
  themeCell: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Sürüm satırı · Nunito 700 · 13 */
  footer: { fontFamily: fonts.bold, fontSize: 13 },
  /** Alt başlık satırı (Hesabı sil) · Nunito 800 · 17 */
  headerTitle: { fontFamily: fonts.extraBold, fontSize: 17 },
  /** Hesabı sil başlığı · Baloo 2 800 · 28 · 1.1 */
  deleteTitle: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 28 * 1.1 },
  /** Silinecekler satırı · Nunito 800 · 15 */
  deleteRow: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Reklam izni başlığı · Baloo 2 800 · 30 · 1.08 */
  adTitle: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 30 * 1.08 },
  /** Reklam izni maddesi · Nunito 700 · 15 · 1.4 */
  adItem: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 15 * 1.4 },
  /** Alt not · Nunito 600 · 13 · 1.45 */
  note: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 13 * 1.45 },
  /** Bildirim kural çipi · Nunito 800 · 14 */
  ruleChip: { fontFamily: fonts.extraBold, fontSize: 14 },
  /** Bildirim metni: ne zaman · Nunito 800 · 12 · aralık 0.4 (push kartı üst satırı) */
  copyWhen: { fontFamily: fonts.extraBold, fontSize: 12, letterSpacing: 0.4 },
  /** Bildirim metni: başlık · Nunito 800 · 15 */
  copyTitle: { fontFamily: fonts.extraBold, fontSize: 15 },
  /** Bildirim metni: gövde · Nunito 600 · 14 · 1.35 */
  copyBody: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 14 * 1.35 },
} as const satisfies Record<string, TextStyle>;
