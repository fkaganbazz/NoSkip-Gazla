import { StyleSheet, Text, View } from 'react-native';

import { AddIcon, CheckIcon } from '@/components/icons';
import {
  avatarTints,
  todayColors,
  todayMetrics as m,
  todayTypography,
  typography,
  useTheme,
} from '@/theme';

import type { TodayFriend } from './types';

/** Rozetin dış ölçüsü (RN ölçüsü kenarı içerir) */
const BADGE_OUTER = m.friendBadgeSize + m.friendBadgeBorder * 2;

type Props = {
  friends: TodayFriend[];
};

/** Türkçe büyük harf (i → İ, ı → I); Intl'e bağlı kalmadan */
const upperTr = (ch: string) => (ch === 'i' ? 'İ' : ch === 'ı' ? 'I' : ch.toUpperCase());

// Arkadaşların bugünkü durumu: bitirenler yeşil halka + tik, bekleyenler kesikli halka + Dürt,
// sonda davet (Today.dc.html). Dürt ve davet ekranları gelince bağlanacak.
export default function FriendsRow({ friends }: Props) {
  const { colors, scheme } = useTheme();
  const c = todayColors[scheme];

  return (
    <View style={styles.row}>
      {friends.map((friend) => {
        const tint = avatarTints[friend.tint][scheme];
        const initial = upperTr(friend.name.charAt(0));
        return (
          <View
            key={friend.id}
            accessible
            accessibilityLabel={friend.doneToday ? `${friend.name}, bugün tamam` : `${friend.name}, bekliyor, dürt`}
            style={styles.item}>
            <View
              style={[
                styles.ring,
                friend.doneToday
                  ? { borderColor: c.friendDoneRing }
                  : { borderColor: c.friendPendingRing, borderStyle: 'dashed' },
              ]}>
              <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
                <Text style={[todayTypography.avatarInitial, { color: tint.ink }]}>{initial}</Text>
              </View>
              {friend.doneToday && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.action, borderColor: colors.background },
                  ]}>
                  <CheckIcon
                    color={colors.onAction}
                    size={m.friendBadgeIconSize}
                    strokeWidth={m.friendBadgeIconStrokeWidth}
                  />
                </View>
              )}
            </View>
            {friend.doneToday ? (
              <Text style={[typography.metaStrong, { color: colors.text }]}>{friend.name}</Text>
            ) : (
              <View style={[styles.poke, { backgroundColor: colors.accent }]}>
                <Text style={[typography.smallStrong, { color: colors.onAccent }]}>Dürt</Text>
              </View>
            )}
          </View>
        );
      })}

      <View accessible accessibilityLabel="Davet et" style={styles.item}>
        <View style={[styles.invite, { borderColor: c.inviteRing }]}>
          <AddIcon
            color={colors.textSecondary}
            size={m.inviteIconSize}
            strokeWidth={m.inviteIconStrokeWidth}
          />
        </View>
        <Text style={[typography.metaStrong, { color: colors.textSecondary }]}>Davet et</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: m.sectionListMarginTop,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    width: m.friendWidth,
    alignItems: 'center',
    gap: m.friendGap,
  },
  ring: {
    width: m.avatarSize,
    height: m.avatarSize,
    borderRadius: m.avatarSize / 2,
    borderWidth: m.avatarRing,
    padding: m.avatarPadding,
  },
  avatar: {
    flex: 1,
    borderRadius: m.avatarSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: m.friendBadgeRight,
    bottom: m.friendBadgeBottom,
    width: BADGE_OUTER,
    height: BADGE_OUTER,
    borderRadius: m.friendBadgeRadius,
    borderWidth: m.friendBadgeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poke: {
    paddingVertical: m.pokePaddingY,
    paddingHorizontal: m.pokePaddingX,
    borderRadius: m.pokeRadius,
  },
  invite: {
    width: m.avatarSize,
    height: m.avatarSize,
    borderRadius: m.avatarSize / 2,
    borderWidth: m.inviteRing,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
