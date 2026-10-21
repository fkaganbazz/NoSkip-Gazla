import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components/ui';
import type { ChallengeCategory } from '@/data';
import { layout } from '@/theme';
import { exploreMetrics as m } from '@/theme/explore';

import { CATEGORY_CHIPS } from './labels';

type Props = {
  /** null = Tümü */
  value: ChallengeCategory | null;
  onChange: (value: ChallengeCategory | null) => void;
};

const OPTIONS: { value: ChallengeCategory | null; label: string }[] = [{ value: null, label: 'Tümü' }, ...CATEGORY_CHIPS];

// Kategori çipleri: ekran kenarına kadar yatay kayar (Explore.dc.html).
export default function CategoryChips({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}>
      {OPTIONS.map((o) => (
        <Chip key={o.label} label={o.label} size="lg" selected={o.value === value} onPress={() => onChange(o.value)} />
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
