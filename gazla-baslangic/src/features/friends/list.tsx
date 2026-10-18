/**
 * Sosyal ekranların liste parçaları: bölüm etiketi, liste kartı, kişi satırı, küçük satır butonu
 * (Friends.dc.html, Activity.dc.html, FriendProfile.dc.html).
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { flatShadowStyle } from '@/components/FlatShadow';
import { borderWidth, componentColors, layout, typography, useTheme } from '@/theme';
import { socialColors, socialMetrics as m, socialTypography } from '@/theme/social';

// Bölüm etiketi ----------------------------------------------------------------------------------

/** "BUGÜN BEKLEYENLER · 2" — Nunito 800 · 13 · aralık 0.6; renk bölüme göre */
export function SectionTitle({
  children,
  color,
  style,
}: {
  children: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={style}>
      <Text accessibilityRole="header" style={[typography.label, { color: color ?? colors.textSecondary }]}>
        {children}
      </Text>
    </View>
  );
}

// Liste kartı ve satır -------------------------------------------------------------------------------

/** Beyaz kart, 1 px kenar, köşe 20 */
export function ListCard({
  children,
  radius = m.listRadius,
  style,
}: {
  children: ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { borderRadius: radius, backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}>
      {children}
    </View>
  );
}

type PersonRowProps = {
  avatar: ReactNode;
  title: string;
  sub?: string;
  /** Sağdaki butonlar */
  trailing?: ReactNode;
  /** Avatar + ad alanına basınca (profil) */
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Altında ayraç çizgisi (son satırda yok) */
  divider?: boolean;
};

/** 62 px kişi satırı: avatar, ad + alt bilgi, sağda buton(lar) */
export function PersonRow({ avatar, title, sub, trailing, onPress, accessibilityLabel, divider }: PersonRowProps) {
  const { colors, scheme } = useTheme();
  const body = (
    <>
      {avatar}
      <View style={styles.texts}>
        <Text numberOfLines={1} style={[socialTypography.rowTitle, { color: colors.text }]}>
          {title}
        </Text>
        {!!sub && (
          <Text numberOfLines={1} style={[socialTypography.rowSub, { color: colors.textSecondary }]}>
            {sub}
          </Text>
        )}
      </View>
    </>
  );
  return (
    <View
      style={[
        styles.row,
        divider && { borderBottomWidth: borderWidth.thin, borderBottomColor: socialColors[scheme].rowDivider },
      ]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? title}
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
          {body}
        </Pressable>
      ) : (
        <View style={styles.main}>{body}</View>
      )}
      {trailing}
    </View>
  );
}

// Küçük satır butonu -----------------------------------------------------------------------------

export type SmallButtonVariant = 'action' | 'muted' | 'hype' | 'poke' | 'ink';

type SmallButtonProps = {
  title: string;
  onPress?: () => void;
  variant: SmallButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Metin yerine ikon (sil butonu) — kare buton olur */
  icon?: ReactNode;
  /** Yatay iç boşluk (varsayılan 12) */
  paddingX?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * 36 px satır butonu: Kabul et (yeşil), Sil (dolgu), Gaz ver / Tebrik et (açık yeşil hap),
 * Dürt (turuncu hap, 2 px gölge), Paylaş / Karşılık ver (koyu).
 */
export function SmallButton({
  title,
  onPress,
  variant,
  loading,
  disabled,
  accessibilityLabel,
  icon,
  paddingX,
  style,
}: SmallButtonProps) {
  const { colors, scheme } = useTheme();
  const c = socialColors[scheme];
  const look = {
    action: { bg: colors.action, fg: colors.onAction, radius: m.smallButtonRadius, shadow: undefined },
    muted: { bg: colors.surfaceMuted, fg: colors.textBody, radius: m.smallButtonRadius, shadow: undefined },
    hype: { bg: c.hypeBg, fg: c.hypeText, radius: m.pillRadius, shadow: undefined },
    poke: { bg: colors.accent, fg: colors.onAccent, radius: m.pillRadius, shadow: componentColors[scheme].pokeShadow },
    ink: { bg: c.inkButtonBg, fg: c.inkButtonText, radius: m.smallButtonRadius, shadow: undefined },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      hitSlop={(layout.minTouchTarget - m.smallButtonHeight) / 2}
      style={({ pressed }) => [
        styles.small,
        {
          backgroundColor: look.bg,
          borderRadius: look.radius,
          paddingHorizontal: icon ? 0 : (paddingX ?? m.smallButtonPaddingX),
          width: icon ? m.smallButtonHeight : undefined,
          opacity: disabled ? 0.5 : 1,
        },
        look.shadow &&
          (pressed
            ? { transform: [{ translateY: m.pokePillShadow }] }
            : flatShadowStyle(m.pokePillShadow, look.shadow)),
        !look.shadow && pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={look.fg} />
      ) : (
        (icon ?? <Text style={[typography.captionStrong, { color: look.fg }]}>{title}</Text>)
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: borderWidth.thin,
    overflow: 'hidden',
  },
  row: {
    height: m.rowHeight,
    paddingLeft: m.rowPaddingLeft,
    paddingRight: m.rowPaddingRight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  main: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.7,
  },
  small: {
    height: m.smallButtonHeight,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
