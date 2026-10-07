/**
 * Çizgi ikonlar (viewBox 24×24). Kaynak: TabBar.dc.html, Create.dc.html.
 * Boyut ve çizgi kalınlığı çağıran yerden, tema token'larından gelir.
 */
import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

export type IconProps = {
  color: ColorValue;
  size: number;
  strokeWidth: number;
};

const VIEW_BOX = '0 0 24 24';

function LineIcon({
  color,
  size,
  strokeWidth,
  rounded = true,
  children,
}: IconProps & { rounded?: boolean; children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <G
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin={rounded ? 'round' : undefined}>
        {children}
      </G>
    </Svg>
  );
}

/** Bugün — ev */
export function HomeIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M3.5 10.5 L12 4 L20.5 10.5 V19 C20.5 19.6 20.1 20 19.5 20 H15 V14.5 H9 V20 H4.5 C3.9 20 3.5 19.6 3.5 19 Z" />
    </LineIcon>
  );
}

/** Keşfet — pusula */
export function CompassIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M15.5 8.5 L13.5 13.5 L8.5 15.5 L10.5 10.5 Z" />
    </LineIcon>
  );
}

/** Arkadaşlar — iki kişi */
export function FriendsIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Circle cx={9} cy={8} r={3.5} />
      <Path d="M2.5 20 C2.5 16 5.5 13.5 9 13.5 C12.5 13.5 15.5 16 15.5 20" />
      <Path d="M16 4.6 C17.9 5 19.1 6.6 19.1 8.4 C19.1 10.2 17.9 11.7 16 12.1" />
      <Path d="M17.8 14.1 C20 14.8 21.5 17 21.5 20" />
    </LineIcon>
  );
}

/** Bahçem — filiz */
export function SproutIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M12 21 V11" />
      <Path d="M12 11 C12 7 9.5 4.5 5 4.5 C5 8.5 7.5 11 12 11 Z" />
      <Path d="M12 13.5 C12 10 14.5 7.5 19 7.5 C19 11 16.5 13.5 12 13.5 Z" />
    </LineIcon>
  );
}

/** Yeni challenge — artı (tasarımda stroke-linejoin yok) */
export function PlusIcon(props: IconProps) {
  return (
    <LineIcon {...props} rounded={false}>
      <Path d="M12 5 V19 M5 12 H19" />
    </LineIcon>
  );
}

/** Kapat — çarpı (tasarımda stroke-linejoin yok) */
export function CloseIcon(props: IconProps) {
  return (
    <LineIcon {...props} rounded={false}>
      <Path d="M6 6 L18 18 M18 6 L6 18" />
    </LineIcon>
  );
}
