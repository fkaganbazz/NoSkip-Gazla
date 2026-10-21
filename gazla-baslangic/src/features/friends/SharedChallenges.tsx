import { Pressable, StyleSheet, Text } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import { FriendList } from '@/components/FriendRow';
import type { FriendProfile } from '@/data';
import { borderWidth, cardColors, cardTypography, typography, useTheme } from '@/theme';
import { socialMetrics as m } from '@/theme/social';

type Props = {
  items: FriendProfile['sharedChallenges'];
  onOpen: (challengeId: string) => void;
};

// Ortak challenge listesi: renkli ikon karosu, ad, arkadaşın ilerlemesi "11/30" (FriendProfile.dc.html).
export default function SharedChallenges({ items, onOpen }: Props) {
  const { colors, scheme } = useTheme();

  return (
    <FriendList style={styles.card}>
      {items.map((item, i) => {
        const progress = item.dayIndex === 0 ? 'Başlamadı' : `${item.daysDone}/${item.durationDays}`;
        return (
          <Pressable
            key={item.challengeId}
            onPress={() => onOpen(item.challengeId)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${progress}`}
            style={({ pressed }) => [
              styles.row,
              i < items.length - 1 && { borderBottomWidth: borderWidth.thin, borderBottomColor: cardColors[scheme].rowDivider },
              pressed && { backgroundColor: colors.surfaceMuted },
            ]}>
            <CategoryTile icon={item.icon} tint={item.tint} size={36} iconSize={m.sharedIconSize} />
            <Text numberOfLines={1} style={[cardTypography.rowTitle, styles.title, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[typography.metaStrong, { color: colors.textSecondary }]}>{progress}</Text>
          </Pressable>
        );
      })}
    </FriendList>
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
  title: {
    flex: 1,
  },
});
