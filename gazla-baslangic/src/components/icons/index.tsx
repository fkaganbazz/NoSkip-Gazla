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

// Ortak gezinme ve form ikonları

/** Geri — sola ok (Settings.dc.html) */
export function BackIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M15 5 L8 12 L15 19" />
    </LineIcon>
  );
}

/** Satır sonu — sağa ok (Create.dc.html) */
export function ChevronRightIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M9 5 L16 12 L9 19" />
    </LineIcon>
  );
}

/** Ara — büyüteç (Explore.dc.html; tasarımda stroke-linejoin yok) */
export function SearchIcon(props: IconProps) {
  return (
    <LineIcon {...props} rounded={false}>
      <Circle cx={11} cy={11} r={6.5} />
      <Path d="M16 16 L20.5 20.5" />
    </LineIcon>
  );
}

/** Saat — hatırlatma (Create.dc.html) */
export function ClockIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 7.5 V12 L15 14" />
    </LineIcon>
  );
}

/** Kilit — görünürlük (Create.dc.html) */
export function LockIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M6 11 H18 V20 H6 Z" />
      <Path d="M8.5 11 V8 C8.5 6 10 4.5 12 4.5 C14 4.5 15.5 6 15.5 8 V11" />
    </LineIcon>
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

/** Kahvesiz — fincan (PickChallenge.dc.html) */
export function CoffeeIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M5 8 H16 V14 C16 17 13.8 19 11 19 H10 C7.2 19 5 17 5 14 Z M16 10 H18 C19.4 10 20.5 11.1 20.5 12.5 C20.5 13.9 19.4 15 18 15 H16 M9 3.5 C8.3 4.4 8.3 5.3 9 6.2 M12.5 3.5 C11.8 4.4 11.8 5.3 12.5 6.2" />
    </LineIcon>
  );
}

/** İltifat — kalpli konuşma balonu (PickChallenge.dc.html) */
export function ChatHeartIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 5 H20 V15 H11 L7 19 V15 H4 Z M12 12.4 C10.3 11.2 9.4 10.2 9.4 9.2 C9.4 8.4 10 7.8 10.8 7.8 C11.3 7.8 11.7 8.1 12 8.6 C12.3 8.1 12.7 7.8 13.2 7.8 C14 7.8 14.6 8.4 14.6 9.2 C14.6 10.2 13.7 11.2 12 12.4 Z" />
    </LineIcon>
  );
}

/** Harcamasız — cüzdan (PickChallenge.dc.html) */
export function WalletIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M6 6.5 H18 C19.4 6.5 20.5 7.6 20.5 9 V17 C20.5 18.4 19.4 19.5 18 19.5 H6 C4.6 19.5 3.5 18.4 3.5 17 V9 C3.5 7.6 4.6 6.5 6 6.5 Z M15.5 13 H20.5 M6 6.5 L15 3.5 L16.2 6.5" />
    </LineIcon>
  );
}

/** Ters el — diş fırçası (Explore.dc.html) */
export function ToothbrushIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M5 19 L13 11" />
      <Path d="M12 6 H19 V9 H12 Z" />
      <Path d="M13.5 6 V4.5 M15.5 6 V4.5 M17.5 6 V4.5" />
      <Path d="M4 20.5 L5.5 19" />
    </LineIcon>
  );
}

/** Şekersiz — şeker. Tasarımda çizimi yok; aynı çizgi diliyle sarılı şeker. */
export function CandyIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M16 12 A4 4 0 1 1 8 12 A4 4 0 1 1 16 12 Z" />
      <Path d="M8.3 10.5 L4 8.5 V15.5 L8.3 13.5 M15.7 10.5 L20 8.5 V15.5 L15.7 13.5" />
    </LineIcon>
  );
}

export const challengeIcons = {
  check: CheckIcon,
  phoneOff: PhoneOffIcon,
  book: BookIcon,
  timer: TimerIcon,
  coffee: CoffeeIcon,
  chatHeart: ChatHeartIcon,
  wallet: WalletIcon,
  toothbrush: ToothbrushIcon,
  candy: CandyIcon,
} as const satisfies Record<import('@/data/types').ChallengeIconKey, (props: IconProps) => ReactNode>;

export type ChallengeIcon = keyof typeof challengeIcons;

