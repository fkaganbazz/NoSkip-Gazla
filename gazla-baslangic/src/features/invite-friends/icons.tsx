/**
 * Davet ekranına özel çizgi ikonlar (viewBox 24×24) — kaynak: InviteFriends.dc.html.
 * İmza `@/components/icons` ile aynı (color, size, strokeWidth).
 */
import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

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

/** Kopyala — üst üste iki kare */
export function CopyIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M9 9 H19 V19 H9 Z" />
      <Path d="M5 15 V5 H15" />
    </LineIcon>
  );
}

/** Mesajla gönder — konuşma balonu */
export function MessageIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 5 H20 V15 H11 L7 19 V15 H4 Z" />
    </LineIcon>
  );
}

/** Paylaş — kutudan çıkan ok */
export function ShareIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M12 3.5 V15" />
      <Path d="M7.5 8 L12 3.5 L16.5 8" />
      <Path d="M5 12 V19.5 H19 V12" />
    </LineIcon>
  );
}

/** Kullanıcı adıyla ara — büyüteç (Explore'daki aramadan biraz büyük) */
export function UserSearchIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M17 11 A6 6 0 1 1 5 11 A6 6 0 1 1 17 11 Z" />
      <Path d="M15.5 15.5 L20.5 20.5" />
    </LineIcon>
  );
}
