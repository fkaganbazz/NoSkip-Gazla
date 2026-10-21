/**
 * Davet ekranına özel çizgi ikonlar (viewBox 24×24) — kaynak: InviteFriends.dc.html. Kopyala, Mesajla gönder ve
 * Paylaş ikonları ortak (`@/components/icons`). İmza ortak ikonlarla aynı (color, size, strokeWidth).
 */
import Svg, { G, Path } from 'react-native-svg';

import type { IconProps } from '@/components/icons';

/** Kullanıcı adıyla ara — büyüteç (Explore'daki aramadan biraz büyük) */
export function UserSearchIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M17 11 A6 6 0 1 1 5 11 A6 6 0 1 1 17 11 Z" />
        <Path d="M15.5 15.5 L20.5 20.5" />
      </G>
    </Svg>
  );
}

/** Rehberden bul — kişi kartı */
export function ContactsIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M6 3.5 H18 V20.5 H6 Z" />
        <Path d="M14.5 10 A2.5 2.5 0 1 1 9.5 10 A2.5 2.5 0 1 1 14.5 10 Z" />
        <Path d="M8.5 17 C9 15 10.3 14 12 14 C13.7 14 15 15 15.5 17" />
      </G>
    </Svg>
  );
}
