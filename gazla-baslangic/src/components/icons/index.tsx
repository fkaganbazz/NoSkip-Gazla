/**
 * Çizgi ikonlar (viewBox 24×24). Kaynak: TabBar.dc.html, Create.dc.html, Today.dc.html ve ekranlarda
 * tekrar eden ikonlar (her birinin yorumunda kaynak dosya). Path'ler dc.html'den birebir.
 * Boyut ve çizgi kalınlığı çağıran yerden, tema token'larından gelir.
 */
import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { dikenColors } from '@/theme';

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

/**
 * Seri çipi ve logo filizi — alt menüdeki filizden biraz farklı (Today.dc.html, Components.dc.html,
 * Main.dc.html logo: 26, çizgi 2.4). onboarding/icons LogoSproutIcon ile aynı çizim.
 */
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

/** Açılır seçim — aşağı ok (Profile.dc.html yıl seçici: 20, çizgi 2.4) */
export function ChevronDownIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M6 9 L12 15 L18 9" />
    </LineIcon>
  );
}

/** Azalt — eksi (NumberEntry.dc.html: 26, çizgi 3; tasarımda stroke-linejoin yok) */
export function MinusIcon(props: IconProps) {
  return (
    <LineIcon {...props} rounded={false}>
      <Path d="M5.5 12 H18.5" />
    </LineIcon>
  );
}

/** Başlangıç günü — takvim. Tasarımda karşılığı yok (Create'teki tasarım dışı satır); kilit/saat çizgi dilinde. */
export function CalendarIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M5 6.5 H19 V19.5 H5 Z" />
      <Path d="M5 10.5 H19 M9 4 V8 M15 4 V8" />
    </LineIcon>
  );
}

// Paylaşım ve iletişim ikonları

/** Paylaş — kutudan çıkan ok (ChallengePreview.dc.html, Finished.dc.html, InviteFriends.dc.html) */
export function ShareIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M12 3.5 V15" />
      <Path d="M7.5 8 L12 3.5 L16.5 8" />
      <Path d="M5 12 V19.5 H19 V12" />
    </LineIcon>
  );
}

/** Gönder — kağıt uçak (Poke.dc.html, PhotoProof.dc.html: 20, çizgi 2.6) */
export function SendIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 12 L20 4 L14 20 L11 13 Z" />
    </LineIcon>
  );
}

/** Kopyala — üst üste iki kare (InviteFriends.dc.html: 16, çizgi 2.4) */
export function CopyIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M9 9 H19 V19 H9 Z" />
      <Path d="M5 15 V5 H15" />
    </LineIcon>
  );
}

/** Mesaj — konuşma balonu (InviteFriends.dc.html "Mesajla"; Activity.dc.html dürtme rozeti) */
export function MessageIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 5 H20 V15 H11 L7 19 V15 H4 Z" />
    </LineIcon>
  );
}

/** E-posta — zarf (SignIn.dc.html: 20, çizgi 2.2) */
export function MailIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M4 6 H20 V18 H4 Z" />
      <Path d="M4.5 6.5 L12 12.5 L19.5 6.5" />
    </LineIcon>
  );
}

/** Dürt — işaret eden el (Detail.dc.html: 20, çizgi 2.6; FriendProfile.dc.html: 22, çizgi 2.2) */
export function HandIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M8 13 V6.5 C8 5.7 8.7 5 9.5 5 C10.3 5 11 5.7 11 6.5 V12 M11 11 V4.5 C11 3.7 11.7 3 12.5 3 C13.3 3 14 3.7 14 4.5 V11 M14 11 V6 C14 5.2 14.7 4.5 15.5 4.5 C16.3 4.5 17 5.2 17 6 V14 C17 18 14.5 21 11 21 C8 21 6.5 19.5 5 17 L3.5 14 C3 13 3.4 12 4.3 11.6 C5.2 11.2 6.2 11.6 6.7 12.4 L8 14.5" />
    </LineIcon>
  );
}

/** Yıldız (ChallengePreview.dc.html, Activity.dc.html bitirme rozeti, Garden.dc.html) */
export function StarIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M12 3 L14.6 8.6 L20.5 9.3 L16.1 13.4 L17.3 19.3 L12 16.3 L6.7 19.3 L7.9 13.4 L3.5 9.3 L9.4 8.6 Z" />
    </LineIcon>
  );
}

/** Çevrimdışı — üstü çizili wifi (Components.dc.html bilgi tostu: 20, çizgi 2.2) */
export function WifiOffIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M2.5 9 C8 3.8 16 3.8 21.5 9" />
      <Path d="M6 12.5 C9.5 9.5 14.5 9.5 18 12.5" />
      <Path d="M9.5 16 C11 14.8 13 14.8 14.5 16" />
      <Path d="M3 3 L21 21" />
    </LineIcon>
  );
}

// Dolu ikonlar (çizgisiz; strokeWidth verilse de kullanılmaz, imza diğerleriyle uyumlu kalsın diye isteğe bağlı)

type FilledIconProps = Omit<IconProps, 'strokeWidth'> & { strokeWidth?: number };

/** Seçenekler — üç nokta (Detail.dc.html, FriendProfile.dc.html: 20) */
export function DotsIcon({ color, size }: FilledIconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <G fill={color}>
        <Circle cx={5} cy={12} r={2} />
        <Circle cx={12} cy={12} r={2} />
        <Circle cx={19} cy={12} r={2} />
      </G>
    </Svg>
  );
}

/** Kenarsız dolu damla — kurtarılan gün, "Diken'i sula" (Detail.dc.html, ChallengePreview.dc.html, StreakLost.dc.html) */
export function SolidDropIcon({ color, size }: FilledIconProps) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Path
        d="M12 3 C15.4 7.4 17.6 10.6 17.6 14 C17.6 17.3 15.1 20 12 20 C8.9 20 6.4 17.3 6.4 14 C6.4 10.6 8.6 7.4 12 3 Z"
        fill={color}
      />
    </Svg>
  );
}

/**
 * Diken'in yüzü — uygulama ikonunun küçük hali (viewBox 100×100; NotifPermission.dc.html, ShareCard.dc.html,
 * InviteLanding.dc.html, Activity.dc.html). Gövde kutunun altına taşar; zemin rengi ve köşe çağıran yerin
 * kapsayıcısından (`overflow: hidden`). Renkler maskot paletinden, iki modda aynı.
 */
export function DikenFaceIcon({ size }: { size: number }) {
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

/** Şekersiz — sarılı şeker (InviteLanding.dc.html "10 gün şekersiz" karosu; 28, çizgi 2) */
export function CandyIcon(props: IconProps) {
  return (
    <LineIcon {...props}>
      <Path d="M8 12 C8 9.8 9.8 8 12 8 C14.2 8 16 9.8 16 12 C16 14.2 14.2 16 12 16 C9.8 16 8 14.2 8 12 Z" />
      <Path d="M8.4 10 L4 7.8 V16.2 L8.4 14" />
      <Path d="M15.6 10 L20 7.8 V16.2 L15.6 14" />
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

