import { Image, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { upperTr } from '@/components/ui';
import type { PersonLite } from '@/data';
import { avatarTints, componentTypography, useTheme } from '@/theme';
import { socialColors, socialMetrics as m } from '@/theme/social';

type Props = {
  person: Pick<PersonLite, 'displayName' | 'avatarUrl' | 'avatarTint'>;
  /** Dış ölçü (halka dahil) */
  size: number;
  /** pending: turuncu kesikli halka; done: sağ altta yeşil tik */
  state?: 'plain' | 'pending' | 'done';
  /** Kesikli halka ile avatar arasındaki boşluk */
  ringPadding?: number;
  textStyle?: TextStyle;
  style?: StyleProp<ViewStyle>;
};

// Baş harfli (ya da fotoğraflı) avatar; bekleyen arkadaşta kesikli halka, bitirende tik rozeti
// (Friends.dc.html, Poke.dc.html). Harf boyutu tasarımdaki gibi çağıran yerden gelir.
export default function PersonAvatar({
  person,
  size,
  state = 'plain',
  ringPadding = m.pendingRingPadding,
  textStyle,
  style,
}: Props) {
  const { colors, scheme } = useTheme();
  const c = socialColors[scheme];
  const tint = avatarTints[person.avatarTint][scheme];
  const inner = state === 'pending' ? size - 2 * (m.pendingRingWidth + ringPadding) : size;

  const face = (
    <View style={[styles.face, { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: tint.bg }]}>
      {person.avatarUrl ? (
        <Image source={{ uri: person.avatarUrl }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
      ) : (
        <Text style={[componentTypography.avatarInitial, textStyle, { color: tint.ink }]}>
          {upperTr(person.displayName.charAt(0))}
        </Text>
      )}
    </View>
  );

  return (
    <View
      accessible={false}
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        state === 'pending' && [
          styles.ring,
          { borderColor: c.pendingRing, borderWidth: m.pendingRingWidth, padding: ringPadding },
        ],
        style,
      ]}>
      {face}
      {state === 'done' && (
        <View style={[styles.badge, { backgroundColor: colors.action, borderColor: colors.surface }]}>
          <CheckIcon color={colors.onAction} size={m.doneBadgeIconSize} strokeWidth={m.doneBadgeIconStrokeWidth} />
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
  ring: {
    borderStyle: 'dashed',
  },
  badge: {
    position: 'absolute',
    right: m.doneBadgeOffset,
    bottom: m.doneBadgeOffset,
    width: m.doneBadgeSize,
    height: m.doneBadgeSize,
    borderRadius: m.doneBadgeSize / 2,
    borderWidth: m.doneBadgeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
