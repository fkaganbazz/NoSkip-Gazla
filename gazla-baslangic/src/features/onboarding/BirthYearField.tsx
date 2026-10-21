import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, ChevronDownIcon } from '@/components/icons';
import Sheet, { SheetFlatList, type SheetHandle } from '@/components/Sheet';
import { borderWidth, componentTypography as ct, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

import { birthYearOptions } from './logic';

type Props = {
  value: number | null;
  onChange: (year: number) => void;
};

/** Liste açılınca seçili yıl yoksa bu kadar yıl öncesi ortada gelir */
const DEFAULT_AGE = 20;

// "Doğum yılın" seçimi (Profile.dc.html): kenarlı buton + aşağı ok; dokununca yıl listesi alt sayfada açılır.
export default function BirthYearField({ value, onChange }: Props) {
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const [open, setOpen] = useState(false);
  const sheet = useRef<SheetHandle>(null);
  const years = useMemo(() => birthYearOptions(), []);
  const initialIndex = Math.max(0, years.indexOf(value ?? years[0] - DEFAULT_AGE) - 3);

  return (
    <View style={styles.field}>
      <Text nativeID="birth-year-label" style={[ct.inputLabel, { color: colors.text }]}>
        Doğum yılın
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Doğum yılın${value ? `, ${value}` : ''}`}
        accessibilityHint="Yıl listesini açar"
        style={[styles.button, { backgroundColor: c.fieldBg, borderColor: c.fieldBorder }]}>
        <Text style={[t.fieldValue, { color: value ? colors.text : colors.textSecondary }]}>{value ?? 'Seç'}</Text>
        <ChevronDownIcon color={colors.textSecondary} size={m.chevronSize} strokeWidth={m.chevronStroke} />
      </Pressable>
      <Text style={[t.fieldNote, { color: colors.textSecondary }]}>
        Profilinde görünmez, sadece yaş kontrolü için sorulur.
      </Text>

      <Sheet ref={sheet} visible={open} onClose={() => setOpen(false)} title="Doğum yılın" surface>
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
                  onChange(item);
                  sheet.current?.close();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected, checked: selected }}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: selected ? colors.actionTint : pressed ? colors.surfaceMuted : 'transparent' },
                ]}>
                <Text style={[t.fieldValue, { color: selected ? colors.actionText : colors.text }]}>{item}</Text>
                {selected && <CheckIcon color={colors.actionText} size={m.chevronSize} strokeWidth={m.chevronStroke} />}
              </Pressable>
            );
          }}
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: m.fieldGap,
  },
  button: {
    height: m.fieldHeight,
    paddingHorizontal: m.fieldPaddingX,
    borderRadius: m.fieldRadius,
    borderWidth: borderWidth.thick,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
