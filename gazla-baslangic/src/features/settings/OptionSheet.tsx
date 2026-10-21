import { Pressable, StyleSheet, Text, View } from 'react-native';

import Sheet from '@/components/Sheet';
import { Radio } from '@/components/ui';
import { borderWidth, typography, useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

type Option<T extends string | number> = { value: T; label: string; detail?: string };

type Props<T extends string | number> = {
  visible: boolean;
  title: string;
  /** Listenin üstünde kısa açıklama (Gün bitişi) */
  description?: string;
  options: Option<T>[];
  value: T | undefined;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/** Tek seçimli liste (ortak Sheet, kart zemini): satır basılır, sağda seçim düğmesi; seçince kapanır */
export default function OptionSheet<T extends string | number>({
  visible,
  title,
  description,
  options,
  value,
  onSelect,
  onClose,
}: Props<T>) {
  const { colors, scheme } = useTheme();
  return (
    // Hatırlatma saatleri (16 satır) ekrana sığmıyor: kaydırılabilir gövde
    <Sheet visible={visible} onClose={onClose} title={title} surface scrollable>
      {description ? (
        <Text style={[typography.body, styles.description, { color: colors.textBody }]}>{description}</Text>
      ) : null}
      <View role="radiogroup" aria-label={title}>
        {options.map((o, i) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              // Seçim durumu iOS/Android'de ve web'de (aria-checked) okunur; Segmented ile aynı
              role="radio"
              aria-checked={selected}
              aria-label={o.label}
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
  description: {
    marginBottom: m.optionDescriptionGap,
  },
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
