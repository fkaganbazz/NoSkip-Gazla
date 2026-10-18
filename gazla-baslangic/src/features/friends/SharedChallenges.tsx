import { Pressable, StyleSheet, Text, View } from 'react-native';

import { challengeIcons } from '@/components/icons';
import type { FriendProfile } from '@/data';
import { borderWidth, challengeTints, typography, useTheme } from '@/theme';
import { socialColors, socialMetrics as m, socialTypography } from '@/theme/social';

import { ListCard } from './list';

type Props = {
  items: FriendProfile['sharedChallenges'];
  onOpen: (challengeId: string) => void;
};

// Ortak challenge listesi: renkli ikon karosu, ad, arkadaşın ilerlemesi "11/30" (FriendProfile.dc.html).
export default function SharedChallenges({ items, onOpen }: Props) {
  const { colors, scheme } = useTheme();
  const c = socialColors[scheme];

  return (
    <ListCard style={styles.card}>
      {items.map((item, i) => {
        const tint = challengeTints[item.tint][scheme];
        const Icon = challengeIcons[item.icon];
        const progress = item.dayIndex === 0 ? 'Başlamadı' : `${item.daysDone}/${item.durationDays}`;
        return (
          <Pressable
            key={item.challengeId}
            onPress={() => onOpen(item.challengeId)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${progress}`}
            style={({ pressed }) => [
              styles.row,
              i < items.length - 1 && { borderBottomWidth: borderWidth.thin, borderBottomColor: c.rowDivider },
              pressed && { backgroundColor: colors.surfaceMuted },
            ]}>
            <View style={[styles.tile, { backgroundColor: tint.bg }]}>
              <Icon color={tint.ink} size={m.sharedIconSize} strokeWidth={m.sharedIconStrokeWidth} />
            </View>
            <Text numberOfLines={1} style={[socialTypography.rowTitle, styles.title, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[typography.metaStrong, { color: colors.textSecondary }]}>{progress}</Text>
          </Pressable>
        );
      })}
    </ListCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.sectionListMarginTop,
  },
  row: {
    height: m.sharedRowHeight,
    paddingHorizontal: m.sharedRowPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  tile: {
    width: m.sharedTile,
    height: m.sharedTile,
    borderRadius: m.sharedTileRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
});
