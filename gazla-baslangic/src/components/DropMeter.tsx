import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { DropIcon } from '@/components/icons';
import { cardColors, cardMetrics as m, cardTypography, useTheme } from '@/theme';

type Props = {
  /** Dolu damla sayısı (tamamlanan görev) */
  filled: number;
  /** Toplam damla (bugünkü görev) */
  total: number;
  /** regular: 22 px, 4 aralık (Today) · small: 20 px, 3 aralık (Components) */
  size?: 'regular' | 'small';
  /** Sağdaki "n/m su" etiketi */
  showLabel?: boolean;
  /** Etiket metnini değiştirmek için */
  label?: string;
  /** Etiket rengi (varsayılan kahraman kartının alt metin yeşili) */
  labelColor?: string;
  style?: StyleProp<ViewStyle>;
};

// Su damlaları: dolu yeşil, boş beyaz zemin + yeşil kenar (koyuda boş zemin saydam) — Today.dc.html.
export function DropMeter({ filled, total, size = 'regular', showLabel = false, label, labelColor, style }: Props) {
  const { scheme } = useTheme();
  const c = cardColors[scheme];
  const d = m.drop[size];
  const text = label ?? `${filled}/${total} su`;

  return (
    <View accessible accessibilityLabel={text} style={[styles.row, { gap: d.gap }, style]}>
      {Array.from({ length: total }, (_, i) => (
        <DropIcon
          key={i}
          color={c.dropStroke}
          fill={i < filled ? c.dropFilled : c.dropEmpty}
          size={d.size}
          strokeWidth={m.dropStrokeWidth}
        />
      ))}
      {showLabel && (
        <Text style={[cardTypography.dropLabel, styles.label, { color: labelColor ?? c.dropLabel }]}>{text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: m.dropLabelGap,
  },
});
