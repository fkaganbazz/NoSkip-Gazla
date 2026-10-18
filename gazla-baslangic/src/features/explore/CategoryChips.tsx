import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { ChallengeCategory } from '@/data';
import { borderWidth, componentColors, layout, useTheme } from '@/theme';
import { exploreMetrics as m, exploreTypography } from '@/theme/explore';

import { CATEGORY_CHIPS } from './labels';

type Props = {
  /** null = Tümü */
  value: ChallengeCategory | null;
  onChange: (value: ChallengeCategory | null) => void;
};

const OPTIONS: { value: ChallengeCategory | null; label: string }[] = [{ value: null, label: 'Tümü' }, ...CATEGORY_CHIPS];

// Kategori çipleri: ekran kenarına kadar yatay kayar (Explore.dc.html).
export default function CategoryChips({ value, onChange }: Props) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}>
      {OPTIONS.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.label}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            hitSlop={{ top: 2, bottom: 2 }}
            style={[
              styles.chip,
              {
                backgroundColor: on ? c.chipSelectedBg : colors.surface,
                borderColor: on ? c.chipSelectedBg : c.chipBorder,
              },
            ]}>
            <Text style={[exploreTypography.chip, { color: on ? c.chipSelectedText : colors.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    marginTop: m.chipsMarginTop,
    marginHorizontal: -layout.screenPadding,
    flexGrow: 0,
  },
  row: {
    paddingHorizontal: layout.screenPadding,
    gap: m.chipGap,
  },
  chip: {
    height: m.chipHeight,
    paddingHorizontal: m.chipPaddingX,
    borderRadius: m.chipRadius,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
