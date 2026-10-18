import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { flatShadowStyle } from '@/components/FlatShadow';
import {
  borderWidth,
  componentColors,
  componentMetrics as cm,
  componentTypography as ct,
  palette,
  radius,
  useTheme,
} from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'poke' | 'danger' | 'text';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** İşlem sürüyor: dönen gösterge, basılamaz */
  loading?: boolean;
  /** Metnin solundaki ikon */
  icon?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// Tok butonlar: altlarında 4 px düz gölge (Components.dc.html). Ana 56, ikincil 54 + 2 kenar,
// Dürt/Sil/pasif 52, metin butonu 48.
export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
  style,
}: Props) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  const inactive = disabled || loading;

  const look = (() => {
    if (disabled) {
      return { bg: c.disabledBg, text: c.disabledText, shadow: undefined, border: undefined, height: cm.buttonHeight.compact };
    }
    switch (variant) {
      case 'secondary':
        return { bg: c.secondaryBg, text: colors.text, shadow: c.secondaryBorder, border: c.secondaryBorder, height: cm.buttonHeight.secondary };
      case 'poke':
        return { bg: colors.accent, text: colors.onAccent, shadow: c.pokeShadow, border: undefined, height: cm.buttonHeight.compact };
      case 'danger':
        return { bg: colors.danger, text: colors.onDanger, shadow: c.dangerShadow, border: undefined, height: cm.buttonHeight.compact };
      case 'text':
        return { bg: 'transparent', text: colors.text, shadow: undefined, border: undefined, height: cm.buttonHeight.text };
      default:
        return { bg: colors.action, text: colors.onAction, shadow: colors.actionShadow, border: undefined, height: cm.buttonHeight.primary };
    }
  })();

  const textStyle = variant === 'primary' || variant === 'secondary' ? ct.button : ct.buttonCompact;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height: look.height,
          backgroundColor: look.bg,
          borderColor: look.border,
          borderWidth: look.border ? borderWidth.thick : 0,
        },
        // Basılınca gölge kaybolur, buton gölge kadar aşağı iner
        pressed && look.shadow ? { transform: [{ translateY: cm.buttonShadow }] } : flatShadowStyle(cm.buttonShadow, look.shadow),
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={look.text === palette.white ? palette.white : look.text} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[textStyle, { color: look.text }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
