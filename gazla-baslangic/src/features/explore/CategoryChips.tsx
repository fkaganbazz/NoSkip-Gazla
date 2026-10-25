import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components/ui';
import type { ChallengeCategory } from '@/data';
import { useT } from '@/i18n';
import { layout } from '@/theme';
import { exploreMetrics as m } from '@/theme/explore';

import { CATEGORY_ORDER } from './labels';

type Props = {
  /** null = Tümü */
  value: ChallengeCategory | null;
  onChange: (value: ChallengeCategory | null) => void;
};

// Kategori çipleri: ekran kenarına kadar yatay kayar (Explore.dc.html).
export default function CategoryChips({ value, onChange }: Props) {
  const t = useT();
  const options: { value: ChallengeCategory | null; label: string }[] = [
    { value: null, label: t.explore.chips.all },
    ...CATEGORY_ORDER.map((c) => ({ value: c, label: t.explore.chips.categories[c] })),
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}>
      {options.map((o) => (
        <Chip key={o.value ?? 'all'} label={o.label} size="lg" selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
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
});
