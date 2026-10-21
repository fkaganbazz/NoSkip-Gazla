import { Pressable, StyleSheet, Text, View } from 'react-native';

import Sheet from '@/components/Sheet';
import { Radio } from '@/components/ui';
import {
  borderWidth,
  componentColors,
  componentMetrics as cm,
  componentTypography as ct,
  typography,
  useTheme,
} from '@/theme';

export type OptionSheetOption<T extends string | number> = { value: T; label: string; detail?: string };

type Props<T extends string | number> = {
  visible: boolean;
  title: string;
  /** Listenin üstünde kısa açıklama (Gün bitişi) */
  description?: string;
  options: OptionSheetOption<T>[];
  value: T | undefined;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/**
 * Tek seçimli liste (ortak Sheet, kart zemini; Settings.dc.html satır dili): satır basılır, sağda seçim düğmesi;
 * seçince kapanır. Ayarlar seçenekleri, hatırlatma saati (Ayarlar → Bildirimler, Detail "…").
 */
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
    // Hatırlatma saatleri (31 satır) ekrana sığmıyor: kaydırılabilir gövde
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
                  borderBottomColor: componentColors[scheme].optionDivider,
                },
                pressed && { opacity: cm.optionPressedOpacity },
              ]}>
              <View style={styles.texts}>
                <Text style={[ct.optionTitle, { color: colors.text }]}>{o.label}</Text>
                {o.detail ? <Text style={[ct.optionDetail, { color: colors.textSecondary }]}>{o.detail}</Text> : null}
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
    marginBottom: cm.optionDescriptionGap,
  },
  row: {
    minHeight: cm.optionRowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.optionRowGap,
    paddingVertical: cm.optionRowPaddingY,
  },
  texts: {
    flex: 1,
    gap: cm.optionRowTextGap,
  },
});
