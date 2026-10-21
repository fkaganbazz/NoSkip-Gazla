/**
 * İşaretleme ekranlarına özel çizgi ikonlar (viewBox 24×24). İmza `@/components/icons` ile aynı.
 */
import Svg, { Path } from 'react-native-svg';

import type { IconProps } from '@/components/icons';

/** Azalt — eksi (NumberEntry.dc.html; tasarımda stroke-linejoin yok) */
export function MinusIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5.5 12 H18.5" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Gönder — kağıt uçak (PhotoProof.dc.html) */
export function SendIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 12 L20 4 L14 20 L11 13 Z"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
