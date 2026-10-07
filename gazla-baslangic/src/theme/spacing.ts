/**
 * Boşluk ve köşe token'ları — kaynak: design/Tokens.dc.html (BOŞLUK VE KÖŞE)
 * ve CLAUDE.md "Tema kuralları".
 */

/** Boşluk ölçeği: 4 · 8 · 12 · 16 · 20 · 24 · 32 */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

/** Köşe yarıçapları */
export const radius = {
  /** Buton · 18 */
  button: 18,
  /** Kart · 22 */
  card: 22,
  /** Alt sayfa (sheet) · 28 — sadece üst köşeler */
  sheet: 28,
  /** Çip · tam yuvarlak */
  full: 999,
} as const;

/** Yerleşim ve dokunma ölçüleri */
export const layout = {
  /** Ekran kenar boşluğu · 20 */
  screenPadding: spacing.lg,
  /** En küçük dokunma alanı · 44 */
  minTouchTarget: 44,
  /** Ana buton yüksekliği · 56 */
  buttonHeight: 56,
  /** Butonun altındaki düz gölgenin yüksekliği · 4 */
  buttonShadowOffset: 4,
  /** Çip yüksekliği · 38 (Components.dc.html) */
  chipHeight: 38,
  /** Çip yatay iç boşluğu · 14 (Components.dc.html) */
  chipPaddingX: 14,
} as const;

/** Kenar kalınlıkları — Components.dc.html: kart 1, form ve ikincil buton 2 */
export const borderWidth = {
  thin: 1,
  thick: 2,
} as const;

/** İkon ölçüleri — kapat butonu: Create.dc.html (18, çizgi 2.8) */
export const iconMetrics = {
  closeSize: 18,
  closeStrokeWidth: 2.8,
} as const;
