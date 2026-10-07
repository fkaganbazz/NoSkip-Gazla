/**
 * Alt menü token'ları — kaynak: design/TabBar.dc.html (390×88, açık/koyu).
 */
import { palette } from './colors';

export type TabBarColors = {
  /** Menü zemini; + butonunun kenar halkası da bu renk */
  background: string;
  /** Üst kenar çizgisi */
  border: string;
  /** Seçili sekme ikon ve etiketi */
  active: string;
  /** Seçili olmayan sekme ikon ve etiketi */
  inactive: string;
  /** Seçili sekmenin ikon hapı */
  activePill: string;
  /** + butonu zemini */
  fab: string;
  /** + butonunun alttaki düz gölgesi */
  fabShadow: string;
  /** + ikonu */
  fabIcon: string;
};

export const tabBarColors: Record<'light' | 'dark', TabBarColors> = {
  light: {
    background: palette.card,
    border: palette.line,
    active: palette.actionGreen,
    inactive: palette.ink500,
    activePill: palette.green100,
    fab: palette.nightPurple,
    fabShadow: palette.fabShadow,
    fabIcon: palette.sand,
  },
  dark: {
    background: palette.darkTabBar,
    border: palette.darkLine,
    active: palette.darkActionText,
    inactive: palette.darkTextSecondary,
    activePill: palette.darkActionTint,
    fab: palette.darkAction,
    fabShadow: palette.actionGreen,
    fabIcon: palette.darkBackground,
  },
};

export const tabBarMetrics = {
  /** Menü yüksekliği, üst kenar dahil · 88 */
  height: 88,
  paddingTop: 6,
  paddingHorizontal: 6,
  /** Alt boşluk · 24 (ev göstergesi bu boşlukta kalır) */
  paddingBottom: 24,
  /** Sekme dokunma alanı · 52 */
  itemMinHeight: 52,
  /** İkon hapı ile etiket arası · 3 */
  itemGap: 3,
  pillWidth: 56,
  pillHeight: 30,
  iconSize: 24,
  iconStrokeWidth: 2.2,
  /** + butonunun iç ölçüsü · 56 (tasarımda content-box; 4'lük kenar bunun dışında) */
  fabSize: 56,
  fabBorderWidth: 4,
  /** + butonunun menüden yukarı taşması: margin-top -30 */
  fabLift: 30,
  fabShadowOffset: 4,
  fabIconSize: 28,
  fabIconStrokeWidth: 2.8,
} as const;
