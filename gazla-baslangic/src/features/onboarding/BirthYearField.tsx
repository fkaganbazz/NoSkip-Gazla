import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronDownIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { borderWidth, componentTypography as ct, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as ot } from '@/theme/onboarding';

import BirthYearSheet from './BirthYearSheet';

type Props = {
  value: number | null;
  onChange: (year: number) => void;
};

// "Doğum yılın" seçimi (Profile.dc.html): kenarlı buton + aşağı ok; dokununca yıl listesi alt sayfada açılır
// (BirthYearSheet; Ayarlar'da da aynı liste).
export default function BirthYearField({ value, onChange }: Props) {
  const { colors, scheme } = useTheme();
  const t = useT();
  const tx = t.onboarding.profile.birthYear;
  const c = onboardingColors[scheme];
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.field}>
      <Text nativeID="birth-year-label" style={[ct.inputLabel, { color: colors.text }]}>
        {tx.label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={tx.a11yLabel(value)}
        accessibilityHint={tx.a11yHint}
        style={[styles.button, { backgroundColor: c.fieldBg, borderColor: c.fieldBorder }]}>
        <Text style={[ot.fieldValue, { color: value ? colors.text : colors.textSecondary }]}>{value ?? tx.placeholder}</Text>
        <ChevronDownIcon color={colors.textSecondary} size={m.chevronSize} strokeWidth={m.chevronStroke} />
      </Pressable>
      <Text style={[ot.fieldNote, { color: colors.textSecondary }]}>{tx.note}</Text>

      <BirthYearSheet visible={open} value={value} onSelect={onChange} onClose={() => setOpen(false)} />
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
});
