import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import { CheckIcon } from '@/components/icons';
import type { Template } from '@/data';
import { borderWidth, typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

import { templateMeta } from './logic';

type Props = {
  template: Template;
  selected: boolean;
  onPick: (id: string) => void;
};

// İlk challenge seçim kartı (PickChallenge.dc.html): kategori karosu, ad, kategori · süre; seçiliyse
// yeşil halka ve sağ üstte tik.
function TemplateTile({ template, selected, onPick }: Props) {
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const meta = templateMeta(template);

  const shadow = selected
    ? `0 0 0 ${m.tileRing}px ${c.tileSelected}`
    : c.tileShadow
      ? `0 ${m.tileShadowY}px ${m.tileShadowBlur}px ${c.tileShadow}`
      : undefined;

  return (
    <Pressable
      onPress={() => onPick(template.id)}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      // Web: seçim aria-checked olarak çıkar (accessibilityState web'de yansımıyor)
      aria-checked={selected}
      accessibilityLabel={`${template.title}, ${meta}`}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: selected ? c.tileSelectedBg : c.tileBg,
          borderColor: selected ? c.tileSelected : c.tileBorder,
          boxShadow: shadow,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <CategoryTile icon={template.icon} tint={template.tint} size={36} />
      <Text numberOfLines={3} style={[t.tileTitle, styles.title, { color: colors.text }]}>
        {template.title}
      </Text>
      <Text numberOfLines={1} style={[typography.meta, styles.meta, { color: colors.textSecondary }]}>
        {meta}
      </Text>
      {selected && (
        <View style={[styles.badge, { backgroundColor: c.tileSelected }]}>
          <CheckIcon color={c.tileBadgeIcon} size={m.tileBadgeIconSize} strokeWidth={m.tileBadgeIconStroke} />
        </View>
      )}
    </Pressable>
  );
}

export default memo(TemplateTile);

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: m.tileHeight,
    padding: m.tilePadding,
    borderRadius: m.tileRadius,
    borderWidth: borderWidth.thin,
    alignItems: 'flex-start',
  },
  title: {
    marginTop: m.tileTitleMarginTop,
  },
  meta: {
    marginTop: 'auto',
  },
  badge: {
    position: 'absolute',
    top: m.tileBadgeOffset,
    right: m.tileBadgeOffset,
    width: m.tileBadgeSize,
    height: m.tileBadgeSize,
    borderRadius: m.tileBadgeSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
