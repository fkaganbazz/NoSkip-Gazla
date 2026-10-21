import type { ComponentType } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { challengeIcons, type IconProps } from '@/components/icons';
import type { ChallengeCategory, ChallengeIconKey, ChallengeTintKey } from '@/data/types';
import { cardMetrics as m, categoryTint, challengeTints, useTheme, type CategoryTileSize, type Tint } from '@/theme';

type Props = {
  /** Challenge ikonu (veri anahtarı) ya da ortak ikon bileşeni (ör. Keşfet "Kendin oluştur": `AddIcon`) */
  icon: ChallengeIconKey | ComponentType<IconProps>;
  /** Zemin/ikon rengini belirler (PickChallenge: detoks mor, sosyal şeftali, spor yeşil …) */
  category?: ChallengeCategory | null;
  /**
   * Challenge rengi (kategori yoksa ya da verideki renk kullanılacaksa) ya da doğrudan zemin/ikon rengi
   * (ör. `{ bg: colors.actionTint, ink: colors.actionText }`); kategoriden önce gelir
   */
  tint?: ChallengeTintKey | Tint;
  /** 36 PickChallenge · 42 Explore · 44 görev kartı · 52 InviteLanding · 56 Detail; köşe ve ikon ölçüsü buna göre */
  size?: CategoryTileSize;
  /** İkon ölçüsünü tasarımdan farklı vermek için (ör. ortak challenge satırında 20) */
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};

// Challenge ikon karosu: kategori renginde yuvarlak köşeli kare ve ortasında çizgi ikon.
export function CategoryTile({ icon, category, tint, size = 44, iconSize, style }: Props) {
  const { scheme } = useTheme();
  const t = typeof tint === 'object' ? tint : challengeTints[tint ?? categoryTint(category)][scheme];
  const metrics = m.categoryTile[size];
  const Icon = typeof icon === 'string' ? challengeIcons[icon] : icon;

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
