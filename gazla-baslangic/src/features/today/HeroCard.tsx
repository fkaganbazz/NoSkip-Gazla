import { StyleSheet, Text, View } from 'react-native';

import Diken from '@/components/Diken';
import { DropMeter } from '@/components/DropMeter';
import { StreakChip } from '@/components/StreakChip';
import { todayColors, todayMetrics as m, todayTypography, useTheme } from '@/theme';

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

  return (
    <View style={[styles.card, { backgroundColor: c.heroBg }]}>
      <View style={[styles.circle, { backgroundColor: c.heroCircle }]} />

      <View style={styles.column}>
        <StreakChip days={hero.streak} />
        <Text style={[todayTypography.heroTitle, { color: c.heroTitle }]}>{hero.title}</Text>
        <Text style={[todayTypography.heroSub, { color: c.heroSub }]}>{hero.sub}</Text>
        <DropMeter filled={done} total={total} showLabel labelColor={c.heroSub} style={styles.drops} />
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
    minHeight: m.heroHeight,
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
  // 390 genişlikte tasarımdaki 196; daha dar ekranlarda Diken'in altına girmeden daralır.
  column: {
    flex: 1,
    maxWidth: m.heroColumnWidth,
    marginRight: m.heroColumnReserve,
    gap: m.heroGap,
  },
  drops: {
    marginTop: 'auto',
  },
  diken: {
    position: 'absolute',
    right: m.dikenRight,
    bottom: m.dikenBottom,
  },
});
