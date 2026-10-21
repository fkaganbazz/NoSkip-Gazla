import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { FlatShadowUnderlay, flatShadowStyle } from '@/components/FlatShadow';
import {
  borderWidth,
  colorsFor,
  componentColors,
  componentMetrics as cm,
  componentTypography as ct,
  layout,
  radius,
  useTheme,
  type ColorScheme,
} from '@/theme';

/**
 * primary (yeşil), secondary (beyaz, 2 px kenar), orange (Dürt), danger (Sil), text (zeminsiz) — Components.dc.html.
 * ink: gece moru (Report.dc.html "Şikayeti gönder"; koyuda PhotoProof "Tekrar çek").
 * onGreen: yeşil kutlama zemininde kum zemin + yeşil metin (Completion.dc.html "Süper").
 */
export type ButtonVariant = 'primary' | 'secondary' | 'orange' | 'danger' | 'text' | 'ink' | 'onGreen';

/** lg 56 / 17 (varsayılan; metin buton 48 / 16), md 52 / 16 (metin buton 44), sm 36 / 14 hap, 2 px gölge */
export type ButtonSize = 'lg' | 'md' | 'sm';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** İşlem sürüyor: dönen gösterge, basılamaz */
  loading?: boolean;
  /** Metnin solundaki ikon; fonksiyon verilirse buton metninin rengiyle çağrılır */
  icon?: ReactNode | ((color: string) => ReactNode);
  /** Metnin sağındaki öğe (ör. StreakLost "30 sn" rozeti) */
  trailing?: ReactNode;
  /** Metin (ve fonksiyon ikon) rengini ezer — ör. yeşil kutlama zeminindeki metin buton */
  color?: string;
  /** Temadan bağımsız sabit ekran (PhotoProof iki modda koyu: `scheme="dark"`) */
  scheme?: ColorScheme;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Kenar boşluğu, flex, genişlik, konum dış çerçeveye; yükseklik ve diğerleri butonun kendisine gider */
  style?: StyleProp<ViewStyle>;
};

type Look = { bg: string; fg: string; shadow?: string; border?: string };

// Tok buton: altında düz gölge (blur yok). Basılınca 2 px iner, gölge 2 px kalır (hapta 1 / 1).
// iOS/web: boxShadow; Android 9 altı: butonun arkasında aynı çerçevede alt katman (FlatShadowUnderlay).
export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
  trailing,
  color,
  scheme: schemeOverride,
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props) {
  const theme = useTheme();
  const scheme = schemeOverride ?? theme.scheme;
  const colors = schemeOverride ? colorsFor(schemeOverride) : theme.colors;
  const c = componentColors[scheme];
  const inactive = disabled || loading;
  const isText = variant === 'text';
  const small = size === 'sm';

  const look: Look = (() => {
    if (disabled) {
      return { bg: isText ? 'transparent' : c.disabledBg, fg: c.disabledText };
    }
    switch (variant) {
      case 'secondary':
        return { bg: c.secondaryBg, fg: colors.text, shadow: c.secondaryBorder, border: c.secondaryBorder };
      case 'orange':
        return { bg: colors.accent, fg: colors.onAccent, shadow: c.pokeShadow };
      case 'danger':
        return { bg: colors.danger, fg: colors.onDanger, shadow: c.dangerShadow };
      case 'ink':
        return { bg: c.inkButtonBg, fg: c.inkButtonText, shadow: c.inkButtonShadow };
      case 'onGreen':
        return { bg: c.onGreenButtonBg, fg: c.onGreenButtonText, shadow: c.onGreenButtonShadow };
      case 'text':
        return { bg: 'transparent', fg: colors.text };
      default:
        return { bg: colors.action, fg: colors.onAction, shadow: colors.actionShadow };
    }
  })();
  const fg = color ?? look.fg;

  const height = isText
    ? size === 'lg'
      ? cm.textButtonHeight.lg
      : cm.textButtonHeight.md
    : cm.buttonHeight[size];
  const shadow = small ? cm.buttonSmShadow : cm.buttonShadow;
  const pressedShadow = small ? cm.buttonSmShadowPressed : cm.buttonShadowPressed;
  const textStyle = small ? ct.buttonSmall : size === 'lg' && !isText ? ct.button : ct.buttonCompact;
  const [frameStyle, buttonStyle] = splitStyle(style);

  return (
    <View style={frameStyle}>
      {look.shadow && <FlatShadowUnderlay offset={shadow} color={look.shadow} radius={radius.button} />}
      <Pressable
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: inactive, busy: loading }}
        hitSlop={height < layout.minTouchTarget ? (layout.minTouchTarget - height) / 2 : undefined}
        style={({ pressed }) => [
          styles.button,
          {
            minHeight: height,
            backgroundColor: look.bg,
            borderColor: look.border,
            borderWidth: look.border ? borderWidth.thick : 0,
          },
          look.shadow &&
            (pressed && !inactive
              ? [{ transform: [{ translateY: shadow - pressedShadow }] }, flatShadowStyle(pressedShadow, look.shadow)]
              : flatShadowStyle(shadow, look.shadow)),
          isText && pressed && styles.textPressed,
          buttonStyle,
        ]}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {typeof icon === 'function' ? icon(fg) : icon}
            <Text numberOfLines={1} style={[textStyle, styles.title, { color: fg }]}>
              {title}
            </Text>
            {trailing}
          </>
        )}
      </Pressable>
    </View>
  );
}

// Dış çerçeveye (gölge katmanıyla birlikte) taşınan yerleşim stilleri
const FRAME_KEYS = new Set<string>([
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'zIndex',
]);

function splitStyle(style: StyleProp<ViewStyle>): [ViewStyle | undefined, ViewStyle | undefined] {
  const flat = StyleSheet.flatten(style) as Record<string, unknown> | undefined;
  if (!flat) return [undefined, undefined];
  const frame: Record<string, unknown> = {};
  const button: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    (FRAME_KEYS.has(key) ? frame : button)[key] = value;
  }
  return [frame as ViewStyle, button as ViewStyle];
}

const styles = StyleSheet.create({
  button: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: cm.buttonGap,
    paddingHorizontal: cm.buttonPaddingX,
    borderRadius: radius.button,
  },
  title: {
    flexShrink: 1,
  },
  textPressed: {
    opacity: 0.7,
  },
});
