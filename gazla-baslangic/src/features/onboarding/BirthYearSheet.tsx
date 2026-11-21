import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { CheckIcon } from '@/components/icons';
import Sheet, { SheetFlatList, type SheetHandle } from '@/components/Sheet';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { onboardingMetrics as m, onboardingTypography as ot } from '@/theme/onboarding';

import { birthYearOptions } from './logic';

type Props = {
  visible: boolean;
  value: number | null;
  onSelect: (year: number) => void;
  onClose: () => void;
  /** Başlık; varsayılan Profile adımındaki "Doğum yılın" */
  title?: string;
};

/** Liste açılınca seçili yıl yoksa bu kadar yıl öncesi ortada gelir */
const DEFAULT_AGE = 20;

// Doğum yılı listesi (alt sayfa): Profile adımı (BirthYearField) ve Ayarlar → Doğum yılı. Seçince kapanır.
export default function BirthYearSheet({ visible, value, onSelect, onClose, title }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const sheet = useRef<SheetHandle>(null);
  const years = useMemo(() => birthYearOptions(), []);
  const initialIndex = Math.max(0, years.indexOf(value ?? years[0] - DEFAULT_AGE) - 3);

  return (
    <Sheet ref={sheet} visible={visible} onClose={onClose} title={title ?? t.onboarding.profile.birthYear.label} surface>
      <SheetFlatList
        data={years}
        keyExtractor={(y) => String(y)}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({ length: m.yearRowHeight, offset: m.yearRowHeight * index, index })}
        style={styles.list}
        renderItem={({ item }) => {
          const selected = item === value;
          return (
            <Pressable
              onPress={() => {
                onSelect(item);
                sheet.current?.close();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: selected ? colors.actionTint : pressed ? colors.surfaceMuted : 'transparent' },
              ]}>
              <Text style={[ot.fieldValue, { color: selected ? colors.actionText : colors.text }]}>{item}</Text>
              {selected && <CheckIcon color={colors.actionText} size={m.chevronSize} strokeWidth={m.chevronStroke} />}
            </Pressable>
          );
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: {
    height: m.yearRowHeight * m.yearListRows,
  },
  row: {
    height: m.yearRowHeight,
    paddingHorizontal: m.fieldPaddingX,
    borderRadius: m.fieldRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
