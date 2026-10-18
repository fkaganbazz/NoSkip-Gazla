import { Pressable, StyleSheet, Text, View } from 'react-native';

import Diken from '@/components/Diken';
import { typography, useTheme } from '@/theme';
import { exploreColors, exploreMetrics as m, exploreTypography } from '@/theme/explore';

type Props = {
  title: string;
  /** Şu an yapan kişi sayısı; yüklenmediyse null */
  activeCount: number | null;
  onPress: () => void;
};

// "Haftanın challenge'ı" kartı (Explore.dc.html).
export default function FeaturedCard({ title, activeCount, onPress }: Props) {
  const { scheme } = useTheme();
  const c = exploreColors[scheme];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Haftanın challenge'ı: ${title}. İncele`}
      style={({ pressed }) => [styles.card, { backgroundColor: c.featuredBg, opacity: pressed ? 0.92 : 1 }]}>
      <View style={[styles.circle, { backgroundColor: c.featuredCircle }]} />
      <View style={styles.column}>
        <Text style={[exploreTypography.featuredLabel, { color: c.featuredLabel }]}>HAFTANIN CHALLENGE&apos;I</Text>
        <Text numberOfLines={2} style={[exploreTypography.featuredTitle, { color: c.featuredTitle }]}>
          {title}
        </Text>
        {activeCount !== null && activeCount > 0 && (
          <Text style={[typography.meta, { color: c.featuredSub }]}>{`${activeCount} kişi şu an yapıyor`}</Text>
        )}
        <View style={[styles.button, { backgroundColor: c.featuredButtonBg }]}>
          <Text style={[typography.captionStrong, { color: c.featuredButtonText }]}>İncele</Text>
        </View>
      </View>
      <View style={styles.diken} pointerEvents="none">
        <Diken mood="saskin" stage="tam" size={m.featuredDikenSize} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.featuredMarginTop,
    height: m.featuredHeight,
    paddingVertical: m.featuredPaddingY,
    paddingHorizontal: m.featuredPaddingX,
    borderRadius: m.featuredRadius,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  circle: {
    position: 'absolute',
    right: m.featuredCircleRight,
    bottom: m.featuredCircleBottom,
    width: m.featuredCircleSize,
    height: m.featuredCircleSize,
    borderRadius: m.featuredCircleSize / 2,
  },
  column: {
    width: m.featuredColumnWidth,
    gap: m.featuredGap,
  },
  button: {
    marginTop: 'auto',
    alignSelf: 'flex-start',
    height: m.featuredButtonHeight,
    paddingHorizontal: m.featuredButtonPaddingX,
    borderRadius: m.featuredButtonRadius,
    justifyContent: 'center',
  },
  diken: {
    position: 'absolute',
    right: m.featuredDikenRight,
    bottom: m.featuredDikenBottom,
  },
});
