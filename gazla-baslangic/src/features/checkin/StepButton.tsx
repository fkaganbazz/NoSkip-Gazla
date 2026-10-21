import { Pressable, StyleSheet, View } from 'react-native';

import { FlatShadowUnderlay, flatShadowStyle } from '@/components/FlatShadow';
import { AddIcon, MinusIcon } from '@/components/icons';
import { numberEntryColors, numberEntryMetrics as m } from '@/theme/checkin';
import { useTheme } from '@/theme';

type Props = {
  kind: 'minus' | 'plus';
  onPress: () => void;
  accessibilityLabel: string;
};

// Sayaçtaki 64 px yuvarlak eksi (beyaz, kenarlı) / artı (yeşil) butonu (NumberEntry.dc.html).
export default function StepButton({ kind, onPress, accessibilityLabel }: Props) {
  const { colors, scheme } = useTheme();
  const c = numberEntryColors[scheme];
  const plus = kind === 'plus';
  const shadow = plus ? colors.actionShadow : c.minusBorder;
  const ink = plus ? colors.onAction : colors.text;

  return (
    <View style={styles.frame}>
      <FlatShadowUnderlay offset={m.stepButtonShadow} color={shadow} size={m.stepButton} radius={m.stepButton / 2} />
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.button,
          plus
            ? { backgroundColor: colors.action }
            : { backgroundColor: c.minusBg, borderWidth: m.stepButtonBorder, borderColor: c.minusBorder },
          pressed ? { transform: [{ translateY: m.stepButtonShadow }] } : flatShadowStyle(m.stepButtonShadow, shadow),
        ]}>
        {plus ? (
          <AddIcon color={ink} size={m.stepIconSize} strokeWidth={m.stepIconStrokeWidth} />
        ) : (
          <MinusIcon color={ink} size={m.stepIconSize} strokeWidth={m.stepIconStrokeWidth} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: m.stepButton,
    height: m.stepButton,
  },
  button: {
    width: m.stepButton,
    height: m.stepButton,
    borderRadius: m.stepButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
