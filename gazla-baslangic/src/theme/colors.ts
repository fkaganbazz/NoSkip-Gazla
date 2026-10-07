/**
 * Renk token'ları — kaynak: design/Tokens.dc.html (renkler) ve
 * design/TodayDark.dc.html, design/DetailDark.dc.html, design/TabBar.dc.html (koyu mod rolleri).
 *
 * Kural: beyaz metin sadece aksiyon yeşilinin ve hata kırmızısının üstünde.
 * Turuncu ve sarı zeminde metin her zaman gece moru.
 */

/** Tokens.dc.html'deki ham palet, gruplarıyla birebir. */
export const palette = {
  // MARKA
  dikenGreen: '#3BAE6A', // Diken yeşili — maskot, ilerleme
  actionGreen: '#1F7A45', // Aksiyon yeşili — ana buton, beyaz metin
  pressedGreen: '#165C34', // Basılı — buton gölgesi
  green100: '#DDF3E4', // Yeşil 100 — kart zemini
  green50: '#EEF8F1', // Yeşil 50 — ekran zemini

  // MÜREKKEP
  nightPurple: '#24163F', // Gece moru — başlık ve metin
  ink700: '#3F3358', // Mürekkep 700 — gövde metni
  ink500: '#5B4A7A', // Mürekkep 500 — ikincil metin
  ink400: '#6B5E80', // Mürekkep 400 — yer tutucu

  // VURGU VE DURUM
  potOrange: '#FF5A1F', // Saksı turuncusu — dürt, saksı
  orange700: '#C2410C', // Turuncu 700 — turuncu metin
  flowerYellow: '#FFC83D', // Çiçek sarısı — kutlama, rozet
  error: '#B42318', // Hata — silme, şikayet
  rescue: '#FFE3D2', // Kurtarma — kurtarılan gün

  // ZEMİN
  sand: '#FFF8F2', // Kum — ekran zemini
  card: '#FFFFFF', // Kart — kart ve sayfa
  line: '#EFE6DC', // Çizgi — kart kenarı
  fill: '#F6EEE5', // Dolgu — ikincil yüzey
  strongLine: '#E3D8CC', // Güçlü çizgi — form kenarı

  // KOYU MOD
  darkBackground: '#150E26', // Zemin — ekran zemini
  darkSurface: '#211538', // Yüzey — kartlar
  darkLine: '#33264F', // Çizgi — kart kenarı
  darkTextSecondary: '#B7AACF', // İkincil metin — açıklamalar
  darkAction: '#3BAE6A', // Aksiyon — buton, koyu metinle

  // KOYU MOD — Tokens'ta yok, koyu referans ekranlarından (TodayDark, DetailDark, TabBar)
  darkFill: '#2B1E47', // DetailDark: çip ve takvim hücresi zemini
  darkTextBody: '#E4DBF2', // DetailDark: gövde metni
  darkActionText: '#8BE0AE', // TabBar koyu: aktif sekme metni
  darkActionTint: '#1F4D33', // TabBar koyu: aktif sekme hapı

  // ALT MENÜ — Tokens'ta yok, TabBar.dc.html'den
  fabShadow: '#0E0820', // TabBar açık: + butonunun gölgesi
  darkTabBar: '#1D1233', // TabBar koyu: menü zemini

  white: '#FFFFFF',
} as const;

/**
 * Anlamsal renk rolleri. Ekranlar bunları `useTheme().colors` ile kullanır.
 * Koyu karşılığı tasarımda olmayan renkler (kurtarma, güçlü çizgi, yer tutucu…)
 * burada yok; o ekranların koyu tasarımı gelene kadar `palette`ten okunur.
 */
export type ColorRoles = {
  /** Ekran zemini */
  background: string;
  /** Kart ve alt sayfa */
  surface: string;
  /** İkincil yüzey (çip, takvim hücresi) */
  surfaceMuted: string;
  /** Kart kenarı, ayraç */
  border: string;

  /** Başlık ve ana metin */
  text: string;
  /** Gövde metni */
  textBody: string;
  /** İkincil metin, açıklama */
  textSecondary: string;

  /** Ana buton zemini */
  action: string;
  /** Ana buton üstündeki metin/ikon */
  onAction: string;
  /** Ana butonun alttaki 4 px gölgesi */
  actionShadow: string;
  /** Yüzey üstünde yeşil metin/ikon (aktif sekme, bağlantı) */
  actionText: string;
  /** Yeşil yumuşak zemin (aktif sekme hapı, durum çipi) */
  actionTint: string;

  /** Diken yeşili — maskot, ilerleme çubuğu */
  brand: string;

  /** Saksı turuncusu — dürt */
  accent: string;
  /** Turuncu zemindeki metin */
  onAccent: string;

  /** Çiçek sarısı — kutlama, rozet */
  highlight: string;
  /** Sarı zemindeki metin */
  onHighlight: string;

  /** Hata — silme, şikayet */
  danger: string;
  /** Hata zeminindeki metin */
  onDanger: string;
};

export const lightColors: ColorRoles = {
  background: palette.sand,
  surface: palette.card,
  surfaceMuted: palette.fill,
  border: palette.line,

  text: palette.nightPurple,
  textBody: palette.ink700,
  textSecondary: palette.ink500,

  action: palette.actionGreen,
  onAction: palette.white,
  actionShadow: palette.pressedGreen,
  actionText: palette.actionGreen,
  actionTint: palette.green100,

  brand: palette.dikenGreen,

  accent: palette.potOrange,
  onAccent: palette.nightPurple,

  highlight: palette.flowerYellow,
  onHighlight: palette.nightPurple,

  danger: palette.error,
  onDanger: palette.white,
};

export const darkColors: ColorRoles = {
  background: palette.darkBackground,
  surface: palette.darkSurface,
  surfaceMuted: palette.darkFill,
  border: palette.darkLine,

  text: palette.sand, // TodayDark: ana metin
  textBody: palette.darkTextBody,
  textSecondary: palette.darkTextSecondary,

  action: palette.darkAction,
  onAction: palette.darkBackground, // TodayDark: yeşil buton üstünde koyu ikon
  actionShadow: palette.actionGreen, // TodayDark: 0 3px 0 #1F7A45
  actionText: palette.darkActionText,
  actionTint: palette.darkActionTint,

  brand: palette.dikenGreen,

  accent: palette.potOrange,
  onAccent: palette.darkBackground, // TodayDark: turuncu rozet metni

  highlight: palette.flowerYellow,
  onHighlight: palette.nightPurple,

  danger: palette.error,
  onDanger: palette.white,
};
