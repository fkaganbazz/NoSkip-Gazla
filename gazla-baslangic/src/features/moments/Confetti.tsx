/**
 * Kutlama ekranlarının arka plan konfetisi — Completion.dc.html (390×460), Finished.dc.html (390×420),
 * ShareCard.dc.html (360×640). Koordinatlar tasarımdaki SVG'den birebir.
 */
import { StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { confettiColors as k } from '@/theme/moments';

type Piece =
  | { t: 'rect'; x: number; y: number; w: number; h: number; fill: string; rotate: string }
  | { t: 'circle'; cx: number; cy: number; r: number; fill: string }
  | { t: 'star'; d: string; fill: string };

const COMPLETION: Piece[] = [
  { t: 'rect', x: 46, y: 118, w: 12, h: 7, fill: k.yellow, rotate: 'rotate(-24 52 121)' },
  { t: 'rect', x: 318, y: 96, w: 12, h: 7, fill: k.orange, rotate: 'rotate(32 324 99)' },
  { t: 'rect', x: 300, y: 210, w: 10, h: 6, fill: k.sand, rotate: 'rotate(-40 305 213)' },
  { t: 'rect', x: 66, y: 250, w: 10, h: 6, fill: k.mint, rotate: 'rotate(18 71 253)' },
  { t: 'rect', x: 342, y: 300, w: 12, h: 7, fill: k.yellow, rotate: 'rotate(64 348 303)' },
  { t: 'rect', x: 28, y: 352, w: 12, h: 7, fill: k.orange, rotate: 'rotate(-12 34 355)' },
  { t: 'rect', x: 120, y: 70, w: 9, h: 6, fill: k.mint, rotate: 'rotate(40 124 73)' },
  { t: 'rect', x: 250, y: 64, w: 10, h: 6, fill: k.sand, rotate: 'rotate(-20 255 67)' },
  { t: 'circle', cx: 92, cy: 170, r: 4.5, fill: k.sand },
  { t: 'circle', cx: 296, cy: 150, r: 5, fill: k.yellow },
  { t: 'circle', cx: 330, cy: 382, r: 4, fill: k.mint },
  { t: 'circle', cx: 52, cy: 298, r: 4, fill: k.yellow },
  { t: 'circle', cx: 200, cy: 54, r: 3.5, fill: k.orange },
  { t: 'star', d: 'M348 176 L351.5 186.5 L362 190 L351.5 193.5 L348 204 L344.5 193.5 L334 190 L344.5 186.5 Z', fill: k.yellow },
  { t: 'star', d: 'M40 196 L42.8 204.2 L51 207 L42.8 209.8 L40 218 L37.2 209.8 L29 207 L37.2 204.2 Z', fill: k.sand },
];

const FINISHED: Piece[] = [
  { t: 'rect', x: 40, y: 130, w: 12, h: 7, fill: k.potOrange, rotate: 'rotate(-24 46 133)' },
  { t: 'rect', x: 330, y: 118, w: 12, h: 7, fill: k.green, rotate: 'rotate(32 336 121)' },
  { t: 'rect', x: 316, y: 260, w: 10, h: 6, fill: k.yellow, rotate: 'rotate(-40 321 263)' },
  { t: 'rect', x: 54, y: 286, w: 10, h: 6, fill: k.purple, rotate: 'rotate(18 59 289)' },
  { t: 'rect', x: 104, y: 80, w: 9, h: 6, fill: k.green, rotate: 'rotate(40 108 83)' },
  { t: 'rect', x: 268, y: 72, w: 10, h: 6, fill: k.potOrange, rotate: 'rotate(-20 273 75)' },
  { t: 'circle', cx: 80, cy: 200, r: 4.5, fill: k.yellow },
  { t: 'circle', cx: 316, cy: 188, r: 5, fill: k.orange },
  { t: 'circle', cx: 344, cy: 330, r: 4, fill: k.green },
  { t: 'circle', cx: 32, cy: 344, r: 4, fill: k.purple },
];

const SHARE: Piece[] = [
  { t: 'rect', x: 36, y: 120, w: 12, h: 7, fill: k.yellow, rotate: 'rotate(-24 42 123)' },
  { t: 'rect', x: 306, y: 104, w: 12, h: 7, fill: k.orange, rotate: 'rotate(32 312 107)' },
  { t: 'rect', x: 296, y: 300, w: 10, h: 6, fill: k.sand, rotate: 'rotate(-40 301 303)' },
  { t: 'rect', x: 44, y: 310, w: 10, h: 6, fill: k.mint, rotate: 'rotate(18 49 313)' },
  { t: 'circle', cx: 70, cy: 210, r: 4.5, fill: k.sand },
  { t: 'circle', cx: 298, cy: 196, r: 5, fill: k.yellow },
  { t: 'star', d: 'M320 238 L323.5 248.5 L334 252 L323.5 255.5 L320 266 L316.5 255.5 L306 252 L316.5 248.5 Z', fill: k.yellow },
  { t: 'star', d: 'M28 248 L30.8 256.2 L39 259 L30.8 261.8 L28 270 L25.2 261.8 L17 259 L25.2 256.2 Z', fill: k.sand },
];

const SETS = {
  completion: { pieces: COMPLETION, width: 390, height: 460 },
  finished: { pieces: FINISHED, width: 390, height: 420 },
  share: { pieces: SHARE, width: 360, height: 640 },
} as const;

/** Tasarım genişliğinde (390/360) sol üstten çizilir; ekran daha dar ya da genişse ortalanır. */
export default function Confetti({ variant, left = 0 }: { variant: keyof typeof SETS; left?: number }) {
  const set = SETS[variant];
  return (
    <Svg
      width={set.width}
      height={set.height}
      viewBox={`0 0 ${set.width} ${set.height}`}
      style={[styles.svg, { left }]}>
      {set.pieces.map((p, i) =>
        p.t === 'rect' ? (
          <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={2} fill={p.fill} transform={p.rotate} />
        ) : p.t === 'circle' ? (
          <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} />
        ) : (
          <Path key={i} d={p.d} fill={p.fill} />
        ),
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
    top: 0,
    pointerEvents: 'none',
  },
});
