import { StyleSheet, Text, View } from 'react-native';

import Diken from '@/components/Diken';
import { DropIcon, StreakIcon } from '@/components/icons';
import { radius, todayColors, todayMetrics as m, todayTypography, typography, useTheme } from '@/theme';

import type { HeroState } from './logic';

type Props = {
  done: number;
  total: number;
  hero: HeroState;
};

// Su durumu kartı: seri çipi, başlık, açıklama, su damlaları ve Diken (Today.dc.html).
export default function HeroCard({ done, total, hero }: Props) {
  const { scheme } = useTheme();
  const c = todayColors[scheme];
  const waterLabel = `${done}/${total} su`;

  return (
    <View style={[styles.card, { backgroundColor: c.heroBg }]}>
      <View style={[styles.circle, { backgroundColor: c.heroCircle }]} />

      <View style={styles.column}>
        <View style={[styles.chip, { backgroundColor: c.streakChipBg }]}>
          <StreakIcon
            color={c.streakChipIcon}
            size={m.streakIconSize}
            strokeWidth={m.streakIconStrokeWidth}
          />
          <Text style={[todayTypography.streakChip, { color: c.streakChipText }]}>
            {`${hero.streak} GÜNLÜK SERİ`}
          </Text>
        </View>
        <Text style={[todayTypography.heroTitle, { color: c.heroTitle }]}>{hero.title}</Text>
        <Text style={[todayTypography.heroSub, { color: c.heroSub }]}>{hero.sub}</Text>

        <View accessible accessibilityLabel={waterLabel} style={styles.drops}>
          {Array.from({ length: total }, (_, i) => (
            <DropIcon
              key={i}
              color={c.dropStroke}
              fill={i < done ? c.dropFilled : c.dropEmpty}
              size={m.dropSize}
              strokeWidth={m.dropStrokeWidth}
            />
          ))}
          <Text style={[typography.metaStrong, styles.dropLabel, { color: c.heroSub }]}>
            {waterLabel}
          </Text>
        </View>
      </View>

      <View style={styles.diken}>
        <Diken mood={hero.mood} stage="tam" gear="bant" size={m.dikenSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.heroMarginTop,
    height: m.heroHeight,
    paddingTop: m.heroPaddingTop,
    paddingHorizontal: m.heroPaddingX,
    paddingBottom: m.heroPaddingBottom,
    borderRadius: m.heroRadius,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    right: m.heroCircleRight,
    top: m.heroCircleTop,
    width: m.heroCircleSize,
    height: m.heroCircleSize,
    borderRadius: m.heroCircleSize / 2,
  },
  column: {
    flex: 1,
    width: m.heroColumnWidth,
    gap: m.heroGap,
  },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.streakChipGap,
    paddingVertical: m.streakChipPaddingY,
    paddingLeft: m.streakChipPaddingLeft,
    paddingRight: m.streakChipPaddingRight,
    borderRadius: radius.full,
  },
  drops: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.dropGap,
  },
  dropLabel: {
    marginLeft: m.dropLabelGap,
  },
  diken: {
    position: 'absolute',
    right: m.dikenRight,
    bottom: m.dikenBottom,
  },
});
