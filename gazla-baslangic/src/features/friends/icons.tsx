/**
 * Sosyal ekranların çizgi ikonları (viewBox 24×24). Kaynak: Friends.dc.html, FriendProfile.dc.html,
 * Poke.dc.html, Activity.dc.html. İmza `@/components/icons` ile aynı (color, size, strokeWidth).
 */
import type { ReactNode } from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

import type { IconProps } from '@/components/icons';

function LineIcon({
  color,
  size,
  strokeWidth,
  rounded = true,
  children,
}: IconProps & { rounded?: boolean; children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
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

/** Arkadaş ekle — kişi + artı (Friends.dc.html) */
export function UserPlusIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Circle cx={10} cy={8} r={3.5} />
      <Path d="M3.5 20 C3.5 16 6.5 13.5 10 13.5 C11.5 13.5 12.9 14 14 14.8" />
      <Path d="M18.5 14 V20 M15.5 17 H21.5" />
    </LineIcon>
  );
}

/** Arkadaşlıktan çıkar — kişi + eksi (FriendProfile.dc.html) */
export function UserMinusIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Circle cx={10} cy={8} r={3.5} />
      <Path d="M3.5 20 C3.5 16 6.5 13.5 10 13.5 C11.5 13.5 12.9 14 14 14.8" />
      <Path d="M15.5 17 H21.5" />
    </LineIcon>
  );
}

/** Dürt — parmak (FriendProfile.dc.html) */
export function PokeHandIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M8 13 V6.5 C8 5.7 8.7 5 9.5 5 C10.3 5 11 5.7 11 6.5 V12 M11 11 V4.5 C11 3.7 11.7 3 12.5 3 C13.3 3 14 3.7 14 4.5 V11 M14 11 V6 C14 5.2 14.7 4.5 15.5 4.5 C16.3 4.5 17 5.2 17 6 V14 C17 18 14.5 21 11 21 C8 21 6.5 19.5 5 17 L3.5 14 C3 13 3.4 12 4.3 11.6 C5.2 11.2 6.2 11.6 6.7 12.4 L8 14.5" />
    </LineIcon>
  );
}

/** Engelle — çizili daire */
export function BlockIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M6 6 L18 18" />
    </LineIcon>
  );
}

/** Şikayet et — bayrak */
export function FlagIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M5 21 V4" />
      <Path d="M5 4.5 H17 L14.5 8.5 L17 12.5 H5" />
    </LineIcon>
  );
}

/** Seçenekler — üç nokta (dolu; strokeWidth kullanılmaz) */
export function DotsIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill={color}>
        <Circle cx={5} cy={12} r={2} />
        <Circle cx={12} cy={12} r={2} />
        <Circle cx={19} cy={12} r={2} />
      </G>
    </Svg>
  );
}

/** Sert mod notu — kalkan (Poke.dc.html) */
export function ShieldIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M12 3 L20 6 V12 C20 16.5 16.5 20 12 21 C7.5 20 4 16.5 4 12 V6 Z" />
    </LineIcon>
  );
}

/** Gönder — kağıt uçak (Poke.dc.html) */
export function SendIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 12 L20 4 L14 20 L11 13 Z" />
    </LineIcon>
  );
}

/** Dürtme rozeti — konuşma balonu (Activity.dc.html) */
export function ChatIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 5 H20 V15 H11 L7 19 V15 H4 Z" />
    </LineIcon>
  );
}

/** Bitirme rozeti — yıldız (Activity.dc.html) */
export function StarIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M12 3 L14.6 8.6 L20.5 9.3 L16.1 13.4 L17.3 19.3 L12 16.3 L6.7 19.3 L7.9 13.4 L3.5 9.3 L9.4 8.6 Z" />
    </LineIcon>
  );
}
