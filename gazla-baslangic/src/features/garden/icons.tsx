/**
 * Bahçem ekranına özel ikonlar (viewBox 24×24) — kaynak: design/Garden.dc.html.
 * İmza ortak ikonlarla aynı: color, size, strokeWidth.
 */
import Svg, { G, Path } from 'react-native-svg';

import type { IconProps } from '@/components/icons';

/** Ayarlar — dişli */
export function GearIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 12 A3 3 0 1 1 9 12 A3 3 0 1 1 15 12 Z" />
        <Path d="M19.4 15 A1.7 1.7 0 0 0 19.7 16.9 L19.8 17 A2 2 0 1 1 17 19.8 L16.9 19.7 A1.7 1.7 0 0 0 15 19.4 A1.7 1.7 0 0 0 14 21 V21.2 A2 2 0 1 1 10 21.2 V21.1 A1.7 1.7 0 0 0 8.9 19.5 A1.7 1.7 0 0 0 7 19.8 L6.9 19.9 A2 2 0 1 1 4.1 17.1 L4.2 17 A1.7 1.7 0 0 0 4.6 15 A1.7 1.7 0 0 0 3 14 H2.8 A2 2 0 1 1 2.8 10 H2.9 A1.7 1.7 0 0 0 4.5 8.9 A1.7 1.7 0 0 0 4.2 7 L4.1 6.9 A2 2 0 1 1 6.9 4.1 L7 4.2 A1.7 1.7 0 0 0 9 4.6 A1.7 1.7 0 0 0 10 3 V2.8 A2 2 0 1 1 14 2.8 V2.9 A1.7 1.7 0 0 0 15.1 4.5 A1.7 1.7 0 0 0 17 4.2 L17.1 4.1 A2 2 0 1 1 19.9 6.9 L19.8 7 A1.7 1.7 0 0 0 19.4 9 A1.7 1.7 0 0 0 21 10 H21.2 A2 2 0 1 1 21.2 14 H21.1 A1.7 1.7 0 0 0 19.4 15 Z" />
      </G>
    </Svg>
  );
}
