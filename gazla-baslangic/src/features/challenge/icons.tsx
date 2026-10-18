/**
 * Challenge detayına özel ikonlar — kaynak: design/Detail.dc.html. İmza ortak ikonlarla aynı
 * (`color`, `size`, `strokeWidth`).
 */
import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { IconProps } from '@/components/icons';

const VIEW_BOX = '0 0 24 24';

/** Seçenekler — üç nokta (dolu) */
export function DotsIcon({ color, size }: Omit<IconProps, 'strokeWidth'>) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Circle cx={5} cy={12} r={2} fill={color} />
      <Circle cx={12} cy={12} r={2} fill={color} />
      <Circle cx={19} cy={12} r={2} fill={color} />
    </Svg>
  );
}

/** Dürt — işaret eden el */
export function HandIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M8 13 V6.5 C8 5.7 8.7 5 9.5 5 C10.3 5 11 5.7 11 6.5 V12 M11 11 V4.5 C11 3.7 11.7 3 12.5 3 C13.3 3 14 3.7 14 4.5 V11 M14 11 V6 C14 5.2 14.7 4.5 15.5 4.5 C16.3 4.5 17 5.2 17 6 V14 C17 18 14.5 21 11 21 C8 21 6.5 19.5 5 17 L3.5 14 C3 13 3.4 12 4.3 11.6 C5.2 11.2 6.2 11.6 6.7 12.4 L8 14.5"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Kurtarılan gün — kenarsız dolu damla */
export function SolidDropIcon({ color, size }: { color: ColorValue; size: number }) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M12 3 C15.4 7.4 17.6 10.6 17.6 14 C17.6 17.3 15.1 20 12 20 C8.9 20 6.4 17.3 6.4 14 C6.4 10.6 8.6 7.4 12 3 Z"
        fill={color}
      />
    </Svg>
  );
}
