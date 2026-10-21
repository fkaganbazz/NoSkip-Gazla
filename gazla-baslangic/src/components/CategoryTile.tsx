import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { challengeIcons } from '@/components/icons';
import type { ChallengeCategory, ChallengeIconKey, ChallengeTintKey } from '@/data/types';
import { cardMetrics as m, categoryTint, challengeTints, useTheme, type CategoryTileSize } from '@/theme';

type Props = {
  icon: ChallengeIconKey;
  /** Zemin/ikon rengini belirler (PickChallenge: detoks mor, sosyal şeftali, spor yeşil …) */
  category?: ChallengeCategory | null;
  /** Açık renk: kategori yoksa (özel challenge) ya da verideki renk kullanılacaksa; kategoriden önce gelir */
  tint?: ChallengeTintKey;
  /** 36 PickChallenge · 42 Explore · 44 görev kartı · 52 InviteLanding · 56 Detail; köşe ve ikon ölçüsü buna göre */
  size?: CategoryTileSize;
  /** İkon ölçüsünü tasarımdan farklı vermek için (ör. ortak challenge satırında 20) */
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};

// Challenge ikon karosu: kategori renginde yuvarlak köşeli kare ve ortasında çizgi ikon.
export function CategoryTile({ icon, category, tint, size = 44, iconSize, style }: Props) {
  const { scheme } = useTheme();
  const t = challengeTints[tint ?? categoryTint(category)][scheme];
  const metrics = m.categoryTile[size];
  const Icon = challengeIcons[icon];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { width: size, height: size, borderRadius: metrics.radius, backgroundColor: t.bg }, style]}>
      <Icon color={t.ink} size={iconSize ?? metrics.iconSize} strokeWidth={m.categoryTileStrokeWidth} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
