/**
 * Sosyal ekranlara özgü çizgi ikonlar (viewBox 24×24). Kaynak: Friends.dc.html, FriendProfile.dc.html,
 * Poke.dc.html. İmza `@/components/icons` ile aynı (color, size, strokeWidth); ortak olanlar (el, gönder,
 * mesaj, yıldız, üç nokta) oradan gelir.
 */
import type { ReactNode } from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

import type { IconProps } from '@/components/icons';

function LineIcon({ color, size, strokeWidth, children }: IconProps & { children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
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

/** Sert mod notu — kalkan (Poke.dc.html) */
export function ShieldIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M12 3 L20 6 V12 C20 16.5 16.5 20 12 21 C7.5 20 4 16.5 4 12 V6 Z" />
    </LineIcon>
  );
}

