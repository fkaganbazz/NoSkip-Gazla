import { Pressable, StyleSheet, Text, View } from 'react-native';

import Sheet from '@/components/Sheet';
import { Radio } from '@/components/ui';
import { borderWidth, useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

type Option<T extends string> = { value: T; label: string; detail?: string };

type Props<T extends string> = {
  visible: boolean;
  title: string;
  options: Option<T>[];
  value: T | undefined;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/** Tek seçimli liste (ortak Sheet, kart zemini): satır basılır, sağda seçim düğmesi; seçince kapanır */
export default function OptionSheet<T extends string>({ visible, title, options, value, onSelect, onClose }: Props<T>) {
  const { colors, scheme } = useTheme();
  return (
    // Hatırlatma saatleri (16 satır) ekrana sığmıyor: kaydırılabilir gövde
    <Sheet visible={visible} onClose={onClose} title={title} surface scrollable>
      <View accessibilityRole="radiogroup">
        {options.map((o, i) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={o.label}
              onPress={() => {
                onSelect(o.value);
                onClose();
              }}
              style={({ pressed }) => [
                styles.row,
                i < options.length - 1 && {
                  borderBottomWidth: borderWidth.thin,
                  borderBottomColor: settingsColors[scheme].rowDivider,
                },
                pressed && { opacity: 0.7 },
              ]}>
              <View style={styles.texts}>
                <Text style={[t.rowTitle, { color: colors.text }]}>{o.label}</Text>
                {o.detail ? <Text style={[t.rowDetail, { color: colors.textSecondary }]}>{o.detail}</Text> : null}
              </View>
              <Radio selected={selected} />
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: m.optionRowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
    paddingVertical: m.optionRowPaddingY,
  },
  texts: {
    flex: 1,
    gap: m.rowTextGap,
  },
});
