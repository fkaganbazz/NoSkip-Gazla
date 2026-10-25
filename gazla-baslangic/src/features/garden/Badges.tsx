import { StyleSheet, Text, View } from 'react-native';

import { LockIcon } from '@/components/icons';
import type { Badge } from '@/data';
import { useT } from '@/i18n';
import { borderWidth, typography, useTheme } from '@/theme';
import { badgeIconColor, badgeTints, gardenColors, gardenMetrics as m } from '@/theme/garden';

import { badgeIcons } from './icons';
import { badgeOrder, chunk } from './logic';

type Props = {
  badges: Badge[];
};

// "Rozetler n / 12" (Garden.dc.html): kazanılanlar renkli dairede ikon + ad, kilitliler gri zeminde
// kesikli halka + kilit ve "Kilitli". Satırda 4 kutu; kazanılanlar önce.
export default function Badges({ badges }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const ordered = badgeOrder(badges);
  const earned = ordered.filter((b) => b.earnedAt).length;

  return (
    <View>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[typography.sectionTitle, { color: colors.text }]}>
          {t.garden.badges.title}
        </Text>
        <Text
          accessibilityLabel={t.garden.badges.countA11y(earned, badges.length)}
          style={[typography.captionStrong, { color: colors.textSecondary }]}>
          {`${earned} / ${badges.length}`}
        </Text>
      </View>
      <View style={styles.grid}>
        {chunk(ordered, m.badgesPerRow).map((row, r) => (
          <View key={r} style={styles.row}>
            {Array.from({ length: m.badgesPerRow }, (_, i) => {
              const badge = row[i];
              return badge ? <BadgeTile key={badge.key} badge={badge} /> : <View key={i} style={styles.tile} />;
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function BadgeTile({ badge }: { badge: Badge }) {
  const { colors, scheme } = useTheme();
  const t = useT();
  const c = gardenColors[scheme];

  if (!badge.earnedAt) {
    return (
      <View
        accessible
        accessibilityLabel={t.garden.badges.lockedA11y(badge.title, badge.description)}
        style={[styles.tile, styles.lockedTile, { backgroundColor: colors.surfaceMuted }]}>
        <View style={[styles.circle, styles.lockedRing, { borderColor: c.badgeLockedRing }]}>
          <LockIcon color={c.badgeLockedIcon} size={m.badgeLockIconSize} strokeWidth={m.badgeIconStrokeWidth} />
        </View>
        <Text style={[typography.smallStrong, styles.label, { color: colors.textSecondary }]}>{t.garden.badges.locked}</Text>
      </View>
    );
  }

  const Icon = badgeIcons[badge.icon];
  return (
    <View
      accessible
      accessibilityLabel={t.garden.badges.earnedA11y(badge.title, badge.description)}
      style={[styles.tile, styles.earnedTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.circle, { backgroundColor: badgeTints[badge.tint] }]}>
        <Icon color={badgeIconColor} size={m.badgeIconSize} strokeWidth={m.badgeIconStrokeWidth} />
      </View>
      <Text numberOfLines={2} style={[typography.smallStrong, styles.label, { color: colors.text }]}>
        {badge.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: m.badgesHeaderMarginTop,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  grid: {
    marginTop: m.badgesMarginTop,
    gap: m.badgeGap,
  },
  row: {
    flexDirection: 'row',
    gap: m.badgeGap,
  },
  tile: {
    flex: 1,
    minWidth: 0,
  },
  earnedTile: {
    padding: m.badgePadding,
    borderRadius: m.badgeRadius,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    gap: m.badgeInnerGap,
  },
  lockedTile: {
    padding: m.badgePadding,
    borderRadius: m.badgeRadius,
    alignItems: 'center',
    gap: m.badgeInnerGap,
  },
  circle: {
    width: m.badgeCircle,
    height: m.badgeCircle,
    borderRadius: m.badgeCircle / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedRing: {
    borderWidth: m.badgeLockedRingBorder,
    borderStyle: 'dashed',
  },
  label: {
    textAlign: 'center',
  },
});
