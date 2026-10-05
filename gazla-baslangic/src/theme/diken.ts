/**
 * Diken maskotunun çizim renkleri — kaynak: design/Diken.dc.html.
 * Maskot açık ve koyu modda aynı görünür; bu renkler temaya göre değişmez.
 */
import { palette } from './colors';

export const dikenColors = {
  /** Dış çizgi, göz bebeği, ağız */
  outline: palette.nightPurple,
  /** Göz akı, göz parıltısı */
  eyeWhite: palette.white,

  // Gövde
  body: palette.dikenGreen,
  bodyShade: '#2C9459',
  ribLeft: '#2A8A52',
  ribRight: '#237A48',
  bodyHighlight: '#8BE0AE',
  spine: '#E9FFF1',

  // Solgun gövde
  wiltedBody: '#A3B56B',
  wiltedShade: '#8C9E58',
  wiltedHighlight: '#C9D69B',
  wiltedSpine: '#EEF3D8',

  // Yüz
  cheek: '#FF8A7A',
  tongue: '#FF7F6E',
  /** Gözyaşı ve ter damlası */
  drop: '#8FD0FF',

  // Çiçek, bant ve parıltı
  petal: palette.flowerYellow,
  flowerCenter: palette.potOrange,
  flowerShine: '#FFB185',
  band: palette.potOrange,
  bandShine: '#FFA06E',
  sparkle: palette.flowerYellow,

  // Saksı
  pot: palette.potOrange,
  potShade: '#E0470F',
  potLine: '#C93A08',
  potRim: '#FF7A3D',
  potRimShine: '#FFB185',
} as const;
