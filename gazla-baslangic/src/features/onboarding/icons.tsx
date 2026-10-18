/**
 * Onboarding'e özel çizgi ikonlar (viewBox 24×24) — imza `@/components/icons` ile aynı (color, size, strokeWidth).
 * Kaynak: Main.dc.html (logo filizi), SignIn.dc.html (zarf), Profile.dc.html (aşağı ok),
 * NotifPermission.dc.html (bildirimdeki uygulama ikonu).
 */
import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { dikenColors } from '@/theme';

type IconProps = {
  color: ColorValue;
  size: number;
  strokeWidth: number;
};

function LineIcon({ color, size, strokeWidth, children }: IconProps & { children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </G>
    </Svg>
  );
}

/** Logo — filiz (Main.dc.html; Bahçem ikonundan biraz daha uzun) */
export function LogoSproutIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M12 21 V10" />
      <Path d="M12 10 C12 6 9.5 3.5 5 3.5 C5 7.5 7.5 10 12 10 Z" />
      <Path d="M12 13 C12 9.5 14.5 7 19 7 C19 10.5 16.5 13 12 13 Z" />
    </LineIcon>
  );
}

/** E-posta — zarf (SignIn.dc.html) */
export function MailIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 6 H20 V18 H4 Z" />
      <Path d="M4.5 6.5 L12 12.5 L19.5 6.5" />
    </LineIcon>
  );
}

/** Açılır seçim — aşağı ok (Profile.dc.html) */
export function ChevronDownIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M6 9 L12 15 L18 9" />
    </LineIcon>
  );
}

/**
 * Bildirim önizlemesindeki uygulama ikonu: Diken'in yüzü (NotifPermission.dc.html, viewBox 100×100).
 * Renkler maskot paletinden; ikon zemini (gece moru) ve köşesi çağıran yerde.
 */
export function DikenAppIcon({ size }: { size: number }) {
  const ink = dikenColors.outline;
  const white = dikenColors.eyeWhite;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M16 110 V58 C16 36 31 20 50 20 C69 20 84 36 84 58 V110 Z" fill={dikenColors.body} />
      <Path d="M58 21.5 C73 25 84 40 84 58 V110 H72 V60 C72 44 67 30 58 21.5 Z" fill={dikenColors.bodyShade} />
      <Path
        d="M50 20.5 L44 10 M50 20 L50 7 M50 20.5 L56 10"
        fill="none"
        stroke={dikenColors.body}
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      <Ellipse cx={38} cy={61} rx={8.5} ry={10} fill={white} stroke={ink} strokeWidth={3} />
      <Circle cx={41} cy={64} r={4.5} fill={ink} />
      <Path d="M27.5 61 A10.5 12 0 0 1 48.5 61 Z" fill={dikenColors.body} />
      <Path d="M29 61 H47" fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
      <Ellipse cx={62} cy={60} rx={9} ry={10.5} fill={white} stroke={ink} strokeWidth={3} />
      <Circle cx={65} cy={62} r={4.8} fill={ink} />
      <Circle cx={66.7} cy={60} r={1.6} fill={white} />
      <Path
        d="M29 49.5 L46 52 M54 45 Q62 36 71 42 M41 79 Q52 82 61 73"
        fill="none"
        stroke={ink}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
