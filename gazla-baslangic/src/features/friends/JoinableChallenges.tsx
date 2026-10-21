import { StyleSheet, Text, View } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import { FriendList, FriendRowButton } from '@/components/FriendRow';
import type { JoinableChallenge } from '@/data';
import { borderWidth, cardColors, cardTypography, useTheme } from '@/theme';
import { socialMetrics as m } from '@/theme/social';

import { joinableSub } from './logic';

type Props = {
  items: JoinableChallenge[];
  onJoin: (item: JoinableChallenge) => void;
  /** Katılımı sürmekte olan challenge (buton dönen gösterge, diğerleri pasif) */
  joiningId?: string;
};

// Arkadaşın "Arkadaşlarım" görünürlüklü, katılabileceğin challenge'ları (tasarlanmadı): ortak challenge
// listesiyle aynı kart ve karo; ad + "7 gün · 2 kişi · yarın başlıyor", sağda "Katıl".
export default function JoinableChallenges({ items, onJoin, joiningId }: Props) {
  const { colors, scheme } = useTheme();

  return (
    <FriendList style={styles.card}>
      {items.map((item, i) => {
        const sub = joinableSub(item);
        return (
          <View
            key={item.challengeId}
            style={[
              styles.row,
              i < items.length - 1 && { borderBottomWidth: borderWidth.thin, borderBottomColor: cardColors[scheme].rowDivider },
            ]}>
            <View accessible accessibilityLabel={`${item.title}, ${sub}`} style={styles.main}>
              <CategoryTile icon={item.icon} tint={item.tint} size={36} iconSize={m.sharedIconSize} />
              <View style={styles.texts}>
                <Text numberOfLines={1} style={[cardTypography.rowTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={[cardTypography.rowSub, { color: colors.textSecondary }]}>
                  {sub}
                </Text>
              </View>
            </View>
            <FriendRowButton
              title="Katıl"
              variant="action"
              onPress={() => onJoin(item)}
              loading={joiningId === item.challengeId}
              disabled={!!joiningId && joiningId !== item.challengeId}
              accessibilityLabel={`${item.title} challenge'ına katıl`}
            />
          </View>
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
    minHeight: m.joinableRowMinHeight,
    paddingVertical: m.joinableRowPaddingY,
    paddingHorizontal: m.sharedRowPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  main: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
});
