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
  useTheme,
  type ColorScheme,
} from '@/theme';

/**
 * primary (yeşil), secondary (beyaz, 2 px kenar), orange (Dürt), danger (Sil), text (zeminsiz) — Components.dc.html.
 * ink: gece moru, koyuda kum (Report.dc.html "Şikayeti gönder"). onDark: koyu ekran butonu (PhotoProof.dc.html
 * "Tekrar çek"; `scheme="dark"` ile). onGreen: yeşil kutlama zemininde kum zemin + yeşil metin (Completion "Süper").
 * apple / google: giriş sağlayıcıları (SignIn.dc.html) — gölgesiz; basılınca ve pasifken saydamlaşır, renk değişmez.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'orange'
  | 'danger'
  | 'text'
  | 'ink'
  | 'onDark'
  | 'onGreen'
  | 'apple'
  | 'google';

/**
 * lg 56 / 17 (varsayılan; metin buton 48 / 16), lgCompact 54 / 17, md 52 / 16 (metin buton 44),
 * mdCompact 50 / 15 köşe 16 gölge 3, sm 36 / 14 hap gölge 2 — ölçüler `componentMetrics.button`.
 */
export type ButtonSize = keyof typeof cm.button;

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
  /**
   * İkinci satır (Nunito 700 · 12, ikincil metin): başlık 16 olur, yükseklik en az boy kadar, dikey 8
   * (StreakLost.dc.html "Ücretsiz hakkımı kullan / Ayda 1 hak · bu ay 1 hakkın var")
   */
  subtitle?: string;
  /** Kenar ve gölge aksiyon yeşili (kenarlı varyantlar; StreakLost: reklam yüklenemedi, ücretsiz hak önerilir) */
  highlighted?: boolean;
  /** Metin (ve fonksiyon ikon) rengini ezer — ör. yeşil kutlama zeminindeki metin buton */
  color?: string;
  /** Temadan bağımsız sabit ekran (PhotoProof iki modda koyu: `scheme="dark"`) */
  scheme?: ColorScheme;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Kenar boşluğu, flex, genişlik, konum dış çerçeveye; yükseklik ve diğerleri butonun kendisine gider */
  style?: StyleProp<ViewStyle>;
};

type Look = { bg: string; fg: string; shadow?: string; border?: string; flat?: boolean };

const TEXT_STYLE = {
  lg: ct.button,
  lgCompact: ct.button,
  md: ct.buttonCompact,
  mdCompact: ct.buttonPair,
  sm: ct.buttonSmall,
} as const;

// Tok buton: altında düz gölge (blur yok). Basılınca gölgenin yarısı kadar iner (lg 2 px, hap 1 px).
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
  subtitle,
  highlighted = false,
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
  const spec = cm.button[size];

  const look: Look = (() => {
    switch (variant) {
      case 'apple':
        return { bg: c.appleButtonBg, fg: c.appleButtonText, flat: true };
      case 'google':
        return { bg: c.googleButtonBg, fg: c.googleButtonText, border: c.googleButtonBorder, flat: true };
    }
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
      case 'onDark':
        return { bg: c.onDarkButtonBg, fg: c.onDarkButtonText, shadow: c.onDarkButtonShadow };
      case 'onGreen':
        return { bg: c.onGreenButtonBg, fg: c.onGreenButtonText, shadow: c.onGreenButtonShadow };
      case 'text':
        return { bg: 'transparent', fg: colors.text };
      default:
        return { bg: colors.action, fg: colors.onAction, shadow: colors.actionShadow };
    }
  })();
  // Vurgu: kenar ve gölge aksiyon yeşili
  if (highlighted && !disabled && look.border) {
    look.border = colors.action;
    look.shadow = look.shadow && colors.action;
  }
  const fg = color ?? look.fg;
  const subtitleColor = disabled && !look.flat ? c.disabledText : variant === 'secondary' || isText ? colors.textSecondary : fg;

  const height = isText ? (size === 'lg' ? cm.textButtonHeight.lg : cm.textButtonHeight.md) : spec.height;
  const shadow = spec.shadow;
  const pressedShadow = shadow / 2;
  // İki satırlı buton başlığı 16; metin buton 16 (sm'de 14, ör. Activity "Tümü okundu")
  const textStyle = subtitle ? ct.buttonCompact : isText ? (size === 'sm' ? ct.buttonSmall : ct.buttonCompact) : TEXT_STYLE[size];
  const [frameStyle, buttonStyle] = splitStyle(style);

  return (
    <View style={frameStyle}>
      {look.shadow && <FlatShadowUnderlay offset={shadow} color={look.shadow} radius={spec.radius} />}
      <Pressable
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)}
        accessibilityHint={accessibilityHint}
        aria-disabled={inactive}
        aria-busy={loading}
        hitSlop={height < layout.minTouchTarget ? (layout.minTouchTarget - height) / 2 : undefined}
        style={({ pressed }) => [
          styles.button,
          subtitle && styles.twoLine,
          {
            minHeight: height,
            borderRadius: spec.radius,
            paddingHorizontal: spec.paddingX,
            backgroundColor: look.bg,
            borderColor: look.border,
            borderWidth: look.border ? borderWidth.thick : 0,
          },
          look.shadow &&
            (pressed && !inactive
              ? [{ transform: [{ translateY: shadow - pressedShadow }] }, flatShadowStyle(pressedShadow, look.shadow)]
              : flatShadowStyle(shadow, look.shadow)),
          look.flat && {
            opacity: pressed && !inactive ? cm.buttonFlatPressedOpacity : disabled ? cm.buttonFlatDisabledOpacity : 1,
          },
          isText && pressed && styles.textPressed,
          buttonStyle,
        ]}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : subtitle ? (
          <>
            <Text numberOfLines={1} style={[textStyle, { color: fg }]}>
              {title}
            </Text>
            <Text numberOfLines={1} style={[ct.buttonSubtitle, { color: subtitleColor }]}>
              {subtitle}
            </Text>
          </>
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
  },
  // İki satır: başlık ve alt satır alt alta
  twoLine: {
    flexDirection: 'column',
    gap: cm.buttonSubtitleGap,
    paddingVertical: cm.buttonSubtitlePaddingY,
  },
  title: {
    flexShrink: 1,
  },
  textPressed: {
    opacity: 0.7,
  },
});
