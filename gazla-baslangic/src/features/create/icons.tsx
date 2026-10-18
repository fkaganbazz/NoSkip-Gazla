/**
 * Oluşturma ekranına özel çizgi ikonlar (viewBox 24×24). İmza `@/components/icons` ile aynı.
 */
import Svg, { G, Path } from 'react-native-svg';

import type { IconProps } from '@/components/icons';

/** Başlangıç günü — takvim. Tasarımda çizimi yok; kilit/saat ikonlarıyla aynı çizgi dilinde. */
export function CalendarIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M5 6.5 H19 V19.5 H5 Z" />
        <Path d="M5 10.5 H19 M9 4 V8 M15 4 V8" />
      </G>
    </Svg>
  );
}
