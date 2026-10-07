/**
 * Çizgi ikonlar (viewBox 24×24). Kaynak: TabBar.dc.html, Create.dc.html, Today.dc.html.
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

/** Seçili olmayan / tamamlanan işaret — tik */
export function CheckIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M5 12.5 L10 17.5 L19 7" />
    </LineIcon>
  );
}

/** Ekle — küçük artı (sayı girişi, davet; tasarımda stroke-linejoin yok) */
export function AddIcon(props: IconProps) {
  return (
    <LineIcon {...props} rounded={false}>
      <Path d="M12 5.5 V18.5 M5.5 12 H18.5" />
    </LineIcon>
  );
}

/** Fotoğraf kanıtı — kamera */
export function CameraIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 8 H7.5 L9 5.5 H15 L16.5 8 H20 V19 H4 Z" />
      <Path d="M15.5 13 A3.5 3.5 0 1 1 8.5 13 A3.5 3.5 0 1 1 15.5 13 Z" />
    </LineIcon>
  );
}

/** Aktivite — zil */
export function BellIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M6 16.5 V11 C6 7.7 8.7 5 12 5 C15.3 5 18 7.7 18 11 V16.5 L19.5 18 H4.5 Z" />
      <Path d="M10 20.5 C10.4 21.3 11.1 21.7 12 21.7 C12.9 21.7 13.6 21.3 14 20.5" />
    </LineIcon>
  );
}

/** Seri çipi — filiz (alt menüdeki filizden biraz farklı) */
export function StreakIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M12 21 V10" />
      <Path d="M12 10 C12 6 9.5 3.5 5 3.5 C5 7.5 7.5 10 12 10 Z" />
      <Path d="M12 13 C12 9.5 14.5 7 19 7 C19 10.5 16.5 13 12 13 Z" />
    </LineIcon>
  );
}

/** Su damlası — dolu/boş zemin ayrı verilir */
export function DropIcon({ color, size, strokeWidth, fill }: IconProps & { fill: ColorValue }) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M12 2.8 C15.6 7.4 18 10.7 18 14.3 C18 17.8 15.3 20.6 12 20.6 C8.7 20.6 6 17.8 6 14.3 C6 10.7 8.4 7.4 12 2.8 Z"
        fill={fill}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Challenge ikonları (görev kartındaki karo)

/** Telefonsuz — üstü çizili telefon */
export function PhoneOffIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M8 3 H16 C17.1 3 18 3.9 18 5 V19 C18 20.1 17.1 21 16 21 H8 C6.9 21 6 20.1 6 19 V5 C6 3.9 6.9 3 8 3 Z M11 18 H13 M3.5 3.5 L20.5 20.5" />
    </LineIcon>
  );
}

/** Okuma — açık kitap */
export function BookIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 5.5 C6.5 4.5 9.5 4.5 12 6 C14.5 4.5 17.5 4.5 20 5.5 V19 C17.5 18 14.5 18 12 19.5 C9.5 18 6.5 18 4 19 Z M12 6 V19.5" />
    </LineIcon>
  );
}

/** Süre — kronometre */
export function TimerIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M20 13.5 A8 8 0 1 1 4 13.5 A8 8 0 1 1 20 13.5 Z M12 9.5 V13.5 L14.5 16 M9.5 2.5 H14.5" />
    </LineIcon>
  );
}

export const challengeIcons = {
  phoneOff: PhoneOffIcon,
  book: BookIcon,
  timer: TimerIcon,
} as const;

export type ChallengeIcon = keyof typeof challengeIcons;

