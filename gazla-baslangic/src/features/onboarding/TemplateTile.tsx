import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, challengeIcons } from '@/components/icons';
import type { Template } from '@/data';
import { borderWidth, challengeTints, typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

import { templateMeta } from './logic';

type Props = {
  template: Template;
  selected: boolean;
  onPick: (id: string) => void;
};

// İlk challenge seçim kartı (PickChallenge.dc.html): ikon karosu, ad, kategori · süre; seçiliyse
// yeşil halka ve sağ üstte tik.
function TemplateTile({ template, selected, onPick }: Props) {
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const tint = challengeTints[template.tint][scheme];
  const Icon = challengeIcons[template.icon];
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
      <View style={[styles.iconTile, { backgroundColor: tint.bg }]}>
        <Icon color={tint.ink} size={m.tileIconSize} strokeWidth={m.tileIconStroke} />
      </View>
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
  iconTile: {
    width: m.tileIconTile,
    height: m.tileIconTile,
    borderRadius: m.tileIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
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
