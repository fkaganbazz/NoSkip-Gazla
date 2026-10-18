/**
 * An ekranlarına özel ikonlar — Finished.dc.html (paylaş), ShareCard.dc.html (Gazla logosu).
 */
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import type { IconProps } from '@/components/icons';
import { celebrationColors as c } from '@/theme/moments';

/** Paylaş — yukarı ok ve kutu */
export function ShareIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 3.5 V15" />
        <Path d="M7.5 8 L12 3.5 L16.5 8" />
        <Path d="M5 12 V19.5 H19 V12" />
      </G>
    </Svg>
  );
}

/** Gazla logosu (AppIcon): gece moru karoda Diken'in yüzü. Köşe, çağıran yerin kapsayıcısından. */
export function GazlaMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M0 0 H100 V100 H0 Z" fill={c.logoBg} />
      <Path d="M16 110 V58 C16 36 31 20 50 20 C69 20 84 36 84 58 V110 Z" fill={c.logoBody} />
      <Path d="M58 21.5 C73 25 84 40 84 58 V110 H72 V60 C72 44 67 30 58 21.5 Z" fill={c.logoShade} />
      <Path
        d="M50 20.5 L44 10 M50 20 L50 7 M50 20.5 L56 10"
        fill="none"
        stroke={c.logoBody}
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      <Ellipse cx={38} cy={61} rx={8.5} ry={10} fill={c.logoEye} stroke={c.logoInk} strokeWidth={3} />
      <Circle cx={41} cy={64} r={4.5} fill={c.logoInk} />
      <Path d="M27.5 61 A10.5 12 0 0 1 48.5 61 Z" fill={c.logoBody} />
      <Path d="M29 61 H47" fill="none" stroke={c.logoInk} strokeWidth={3.5} strokeLinecap="round" />
      <Ellipse cx={62} cy={60} rx={9} ry={10.5} fill={c.logoEye} stroke={c.logoInk} strokeWidth={3} />
      <Circle cx={65} cy={62} r={4.8} fill={c.logoInk} />
      <Circle cx={66.7} cy={60} r={1.6} fill={c.logoEye} />
      <Path
        d="M29 49.5 L46 52 M54 45 Q62 36 71 42 M41 79 Q52 82 61 73"
        fill="none"
        stroke={c.logoInk}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
