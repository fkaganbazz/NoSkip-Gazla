/**
 * Kişi avatarı ve yüz yığını — Components.dc.html (avatar halkaları), Today.dc.html (arkadaş şeridi),
 * Friends.dc.html (satır avatarı), Poke.dc.html, yüz yığınları (ChallengePreview, InviteLanding,
 * Completion, StreakLost). Ölçüler dış ölçüdür (halka ve kenar dahil, tasarımdaki border-box).
 */
import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { AddIcon, CheckIcon } from '@/components/icons';
import type { AvatarTintKey } from '@/data/types';
import { avatarInitialStyle, avatarTints, cardColors, cardMetrics as m, useTheme } from '@/theme';

/** Türkçe büyük harf (i → İ, ı → I); Intl'e bağlı kalmadan */
export const upperTr = (ch: string) => (ch === 'i' ? 'İ' : ch === 'ı' ? 'I' : ch.toUpperCase());

/** done: düz yeşil (bugünü yaptı) · pending: kesikli turuncu (bekliyor) · invite: kesikli gri (davetli) */
export type AvatarRing = 'done' | 'pending' | 'invite';

export type AvatarProps = {
  /** Baş harf ve ekran okuyucu etiketi */
  name: string;
  /** Fotoğraf yokken zemin/harf rengi (avatarTints) */
  tint: AvatarTintKey;
  url?: string | null;
  /** Dış ölçü, halka ve kenar dahil · varsayılan 40 */
  size?: number;
  ring?: AvatarRing | null;
  /** Halka kalınlığı ve halka–yüz boşluğu; verilmezse ölçüye göre tasarımdaki değer (54: 3/3, 48: 2/3, 40: 2/2) */
  ringWidth?: number;
  ringGap?: number;
  /** Sağ altta yeşil tik rozeti (bugünü tamamladı); 52 ve üstünde Today, altında Friends ölçüsü */
  badge?: boolean;
  /** Rozet kenarı: avatarın altındaki zemin (varsayılan kart yüzeyi; Today şeridinde ekran zemini) */
  badgeBorderColor?: string;
  /** Zemin renginde dış kenar — yüz yığınında üst üste binme kenarı, InviteLanding'de beyaz kenar */
  outlineColor?: string;
  outlineWidth?: number;
  /** Baş harf stili; verilmezse yüz çapına göre tasarımdaki boyut */
  initialStyle?: TextStyle;
  accessibilityLabel?: string;
  /** Satırın kendi etiketi varsa avatarı ekran okuyucudan gizle */
  decorative?: boolean;
  /** Avatarın üstüne çizilecek ek (ör. profil fotoğrafı kamera rozeti) */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Baş harfli ya da fotoğraflı yuvarlak avatar; isteğe bağlı durum halkası, tik rozeti ve dış kenar */
export function Avatar({
  name,
  tint,
  url,
  size = m.avatarSize,
  ring,
  ringWidth,
  ringGap,
  badge = false,
  badgeBorderColor,
  outlineColor,
  outlineWidth = m.stackOutline,
  initialStyle,
  accessibilityLabel,
  decorative = false,
  children,
  style,
}: AvatarProps) {
  const { colors, scheme } = useTheme();
  const c = cardColors[scheme];
  const t = avatarTints[tint][scheme];

  const ringSpec = m.avatarRings.find((r) => size >= r.minSize) ?? m.avatarRings[m.avatarRings.length - 1];
  const rw = ring ? (ringWidth ?? (ring === 'invite' ? m.inviteRingWidth : ringSpec.width)) : 0;
  const rg = ring ? (ringGap ?? ringSpec.gap) : 0;
  const face = size - 2 * (rw + rg);
  const ringColor = ring === 'done' ? c.ringDone : ring === 'pending' ? c.ringPending : c.ringInvite;
  const outline = outlineColor ? outlineWidth : 0;

  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : (accessibilityLabel ?? name)}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : undefined}
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        ring && {
          borderWidth: rw,
          borderColor: ringColor,
          borderStyle: ring === 'done' ? 'solid' : 'dashed',
          padding: rg,
        },
        style,
      ]}>
      {/* Yüz, dış kutunun içini doldurur (dışarıdan verilen kenar/boşluk da hesaba katılır) */}
      <View
        style={[
          styles.face,
          styles.fill,
          { borderRadius: size / 2, backgroundColor: t.bg },
          outline > 0 && { borderWidth: outline, borderColor: outlineColor },
        ]}>
        {url ? (
          <Image source={{ uri: url }} style={styles.photo} />
        ) : (
          <Text style={[avatarInitialStyle(face), initialStyle, { color: t.ink }]}>{upperTr(name.charAt(0))}</Text>
        )}
      </View>
      {badge && <DoneBadge size={size} borderColor={badgeBorderColor ?? colors.surface} />}
      {children}
    </View>
  );
}

/** Sağ alttaki yeşil tik rozeti */
function DoneBadge({ size, borderColor }: { size: number; borderColor: string }) {
  const { colors } = useTheme();
  const b = m.avatarBadges.find((x) => size >= x.minSize) ?? m.avatarBadges[m.avatarBadges.length - 1];
  return (
    <View
      style={[
        styles.badge,
        {
          right: b.right,
          bottom: b.bottom,
          width: b.size,
          height: b.size,
          borderRadius: b.radius,
          borderWidth: b.border,
          borderColor,
          backgroundColor: colors.action,
        },
      ]}>
      <CheckIcon color={colors.onAction} size={b.iconSize} strokeWidth={b.iconStrokeWidth} />
    </View>
  );
}

/** Boş davet yuvası: kesikli gri halka ve artı (Today "Davet et") */
export function AddAvatar({ size = m.bubbleAvatar, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const { colors, scheme } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.add,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: m.inviteRingWidth,
          borderColor: cardColors[scheme].ringInvite,
        },
        style,
      ]}>
      <AddIcon color={colors.textSecondary} size={m.addIconSize} strokeWidth={m.addIconStrokeWidth} />
    </View>
  );
}

// Yüz yığını --------------------------------------------------------------------------------------

export type StackPerson = { name: string; tint: AvatarTintKey; url?: string | null; id?: string };

type AvatarStackProps = {
  people: StackPerson[];
  /** Her yüzün dış ölçüsü (kenar dahil): 26 StreakLost · 28 ChallengePreview · 30 InviteLanding, Completion */
  size: number;
  /** Kenar rengi = yığının altındaki zemin */
  outlineColor: string;
  outlineWidth?: number;
  /** Üst üste binme (negatif) · varsayılan -8 */
  overlap?: number;
  /** En çok bu kadar yüz; kalanlar "+N" ile gösterilir */
  max?: number;
  /** Toplam kişi sayısı people'dan büyükse fark da "+N"e eklenir */
  total?: number;
  initialStyle?: TextStyle;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Üst üste binen baş harfli avatarlar; fazlası "+N" yuvarlağı */
export function AvatarStack({
  people,
  size,
  outlineColor,
  outlineWidth = m.stackOutline,
  overlap = m.stackOverlap,
  max,
  total,
  initialStyle,
  accessibilityLabel,
  style,
}: AvatarStackProps) {
  const { colors } = useTheme();
  const shown = max != null && people.length > max ? people.slice(0, max) : people;
  const extra = Math.max(0, (total ?? people.length) - shown.length);

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? people.map((p) => p.name).join(', ')}
      style={[styles.stack, style]}>
      {shown.map((p, i) => (
        <Avatar
          key={p.id ?? `${p.name}-${i}`}
          name={p.name}
          tint={p.tint}
          url={p.url}
          size={size}
          outlineColor={outlineColor}
          outlineWidth={outlineWidth}
          initialStyle={initialStyle}
          decorative
          style={i > 0 && { marginLeft: overlap }}
        />
      ))}
      {extra > 0 && (
        // "+N" için tasarım yok: ikincil yüzey zemini ve ikincil metin, yüzlerle aynı ölçü ve kenar
        <View
          style={[
            styles.face,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: outlineWidth,
              borderColor: outlineColor,
              backgroundColor: colors.surfaceMuted,
              marginLeft: shown.length > 0 ? overlap : 0,
            },
          ]}>
          <Text style={[avatarInitialStyle(size), initialStyle, { color: colors.textSecondary }]}>{`+${extra}`}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    flexDirection: 'row',
  },
});
