/**
 * Bahçem ekranına özel ikonlar (viewBox 24×24) — kaynak: design/Garden.dc.html.
 * İmza ortak ikonlarla aynı: color, size, strokeWidth.
 */
import type { ComponentType } from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

import {
  CalendarIcon,
  CameraIcon,
  ClockIcon,
  FriendsIcon,
  HandIcon,
  MessageIcon,
  SproutIcon,
  StarIcon,
  StreakIcon,
  type IconProps,
} from '@/components/icons';
import type { BadgeIconKey } from '@/data';

/** Ayarlar — dişli */
export function GearIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 12 A3 3 0 1 1 9 12 A3 3 0 1 1 15 12 Z" />
        <Path d="M19.4 15 A1.7 1.7 0 0 0 19.7 16.9 L19.8 17 A2 2 0 1 1 17 19.8 L16.9 19.7 A1.7 1.7 0 0 0 15 19.4 A1.7 1.7 0 0 0 14 21 V21.2 A2 2 0 1 1 10 21.2 V21.1 A1.7 1.7 0 0 0 8.9 19.5 A1.7 1.7 0 0 0 7 19.8 L6.9 19.9 A2 2 0 1 1 4.1 17.1 L4.2 17 A1.7 1.7 0 0 0 4.6 15 A1.7 1.7 0 0 0 3 14 H2.8 A2 2 0 1 1 2.8 10 H2.9 A1.7 1.7 0 0 0 4.5 8.9 A1.7 1.7 0 0 0 4.2 7 L4.1 6.9 A2 2 0 1 1 6.9 4.1 L7 4.2 A1.7 1.7 0 0 0 9 4.6 A1.7 1.7 0 0 0 10 3 V2.8 A2 2 0 1 1 14 2.8 V2.9 A1.7 1.7 0 0 0 15.1 4.5 A1.7 1.7 0 0 0 17 4.2 L17.1 4.1 A2 2 0 1 1 19.9 6.9 L19.8 7 A1.7 1.7 0 0 0 19.4 9 A1.7 1.7 0 0 0 21 10 H21.2 A2 2 0 1 1 21.2 14 H21.1 A1.7 1.7 0 0 0 19.4 15 Z" />
      </G>
    </Svg>
  );
}

/** Rozet "Erkenci" — güneş (Garden.dc.html) */
export function SunIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Circle cx={12} cy={12} r={4} />
        <Path d="M12 2.5 V5 M12 19 V21.5 M2.5 12 H5 M19 12 H21.5 M5.3 5.3 L7 7 M17 17 L18.7 18.7 M5.3 18.7 L7 17 M17 7 L18.7 5.3" />
      </G>
    </Svg>
  );
}

/** Rozet "Şampiyon" — kupa. Tasarımda karşılığı yok; Garden.dc.html çizgi dilinde (tasarım onayı bekliyor). */
export function TrophyIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M8 4 H16 V10 C16 12.2 14.2 14 12 14 C9.8 14 8 12.2 8 10 Z" />
        <Path d="M8 6 H5 C5 8.5 6.3 10 8.2 10.3 M16 6 H19 C19 8.5 17.7 10 15.8 10.3" />
        <Path d="M12 14 V19.5 M8 19.5 H16" />
      </G>
    </Svg>
  );
}

/** Rozet "Gece kuşu" — hilal. Tasarımda karşılığı yok; Garden.dc.html çizgi dilinde (tasarım onayı bekliyor). */
export function MoonIcon({ color, size, strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19.5 14.5 A8 8 0 1 1 9.5 4.5 A6.5 6.5 0 0 0 19.5 14.5 Z" />
      </G>
    </Svg>
  );
}

/**
 * Rozet anahtarı → ikon (BadgeIconKey). star, speech (= MessageIcon, aynı path), sun Garden.dc.html'den;
 * diğerleri uygulamadaki ortak çizgi ikonlar; trophy ve moon tasarımda yok.
 */
export const badgeIcons: Record<BadgeIconKey, ComponentType<IconProps>> = {
  star: StarIcon,
  speech: MessageIcon,
  sun: SunIcon,
  streak: StreakIcon,
  calendar: CalendarIcon,
  sprout: SproutIcon,
  trophy: TrophyIcon,
  hand: HandIcon,
  clock: ClockIcon,
  moon: MoonIcon,
  friends: FriendsIcon,
  camera: CameraIcon,
};
