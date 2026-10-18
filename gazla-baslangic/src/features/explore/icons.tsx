/**
 * Önizleme ekranına özel ikonlar (viewBox 24×24) — kaynak: design/ChallengePreview.dc.html.
 * İmza ortak ikonlarla aynı: color, size, strokeWidth.
 */
import Svg, { G, Path } from 'react-native-svg';

import type { IconProps } from '@/components/icons';

const VIEW_BOX = '0 0 24 24';

/** Paylaş — yukarı ok ve kutu */
export function ShareIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 3.5 V15" />
        <Path d="M7.5 8 L12 3.5 L16.5 8" />
        <Path d="M5 12 V19.5 H19 V12" />
      </G>
    </Svg>
  );
}

/** Yıldız — "Son gün bahçene yeni bir kaktüs eklenir" */
export function StarIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M12 3 L14.6 8.6 L20.5 9.3 L16.1 13.4 L17.3 19.3 L12 16.3 L6.7 19.3 L7.9 13.4 L3.5 9.3 L9.4 8.6 Z"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Dolu damla — "Kaçırırsan Diken solar" (çizgisiz; strokeWidth kullanılmaz) */
export function SolidDropIcon({ color, size }: Omit<IconProps, 'strokeWidth'>) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M12 3 C15.4 7.4 17.6 10.6 17.6 14 C17.6 17.3 15.1 20 12 20 C8.9 20 6.4 17.3 6.4 14 C6.4 10.6 8.6 7.4 12 3 Z"
        fill={color}
      />
    </Svg>
  );
}
