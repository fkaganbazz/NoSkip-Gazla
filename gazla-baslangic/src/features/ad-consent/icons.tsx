/** Reklam izni madde ikonları (AdConsent.dc.html; viewBox 24×24, ortak ikon imzası) */
import Svg, { Circle, Path } from 'react-native-svg';

import type { IconProps } from '@/components/icons';

/** Oynat — dolu üçgen (seri kurtarma reklamı) */
export function PlayIcon({ color, size }: Omit<IconProps, 'strokeWidth'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 4.5 L19 12 L7 19.5 Z" fill={color} />
    </Svg>
  );
}

/** Hedef — iç içe daireler (ilgi alanına göre reklam) */
export function TargetIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.5} fill="none" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx={12} cy={12} r={4.5} fill="none" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx={12} cy={12} r={1} fill={color} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
