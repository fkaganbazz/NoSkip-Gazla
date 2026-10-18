/**
 * Form ve geri bildirim — design/Components.dc.html: metin alanı (varsayılan, odakta, hata),
 * avatar, bilgi tostu (çevrimdışı), geri al tostu, sayı rozeti, yükleniyor / hata durumları.
 */
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import type { AvatarTintKey } from '@/data';
import {
  avatarTints,
  borderWidth,
  componentColors,
  componentMetrics as cm,
  componentTypography as ct,
  fonts,
  layout,
  spacing,
  typography,
  useTheme,
} from '@/theme';

import Button from './Button';

// Metin alanı ------------------------------------------------------------------------------------

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  /** Doluysa kırmızı kenar ve alt satırda mesaj */
  error?: string | null;
  /** Hata yerine gösterilecek yardımcı/başarı satırı */
  hint?: string | null;
  style?: StyleProp<ViewStyle>;
};

export function TextField({ label, error, hint, style, onFocus, onBlur, ...input }: TextFieldProps) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, style]}>
      {label && <Text style={[ct.inputLabel, { color: colors.text }]}>{label}</Text>}
      <TextInput
        {...input}
        accessibilityLabel={input.accessibilityLabel ?? label}
        placeholderTextColor={c.placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          focused ? ct.inputFocused : ct.input,
          {
            color: colors.text,
            backgroundColor: c.inputBg,
            borderColor: error ? colors.danger : focused ? colors.action : c.inputBorder,
            boxShadow: focused && !error ? `0 0 0 ${cm.inputFocusRing}px ${c.inputFocusRing}` : undefined,
          },
          input.multiline && styles.multiline,
        ]}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[ct.inputError, { color: colors.danger }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[ct.inputError, { color: colors.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

// Avatar -----------------------------------------------------------------------------------------

/** Türkçe büyük harf (i → İ, ı → I) */
export const upperTr = (ch: string) => (ch === 'i' ? 'İ' : ch === 'ı' ? 'I' : ch.toUpperCase());

type AvatarProps = {
  name: string;
  tint: AvatarTintKey;
  url?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Baş harfli (ya da fotoğraflı) yuvarlak avatar; renk veriye bağlı (avatarTints) */
export function Avatar({ name, tint, url, size = cm.avatarSm, style }: AvatarProps) {
  const { scheme } = useTheme();
  const t = avatarTints[tint][scheme];
  return (
    <View
      accessible
      accessibilityLabel={name}
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg }, styles.avatar, style]}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={{ fontFamily: fonts.extraBold, fontSize: Math.round(size * 0.36), color: t.ink }}>
          {upperTr(name.charAt(0))}
        </Text>
      )}
    </View>
  );
}

// Tost ve rozet ------------------------------------------------------------------------------------

type ToastProps = {
  message: string;
  /** Geri al tostu: yeşil zemin ve sağda buton */
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

export function Toast({ message, action, style }: ToastProps) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  if (action) {
    return (
      <View accessibilityLiveRegion="polite" style={[styles.toast, styles.undoToast, { backgroundColor: c.undoToastBg }, style]}>
        <Text style={[ct.toastStrong, styles.toastText, { color: c.undoToastText }]}>{message}</Text>
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          style={[styles.undoButton, { backgroundColor: c.undoButtonBg }]}>
          <Text style={[ct.toastStrong, { color: colors.actionText }]}>{action.label}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View accessibilityLiveRegion="polite" style={[styles.toast, { backgroundColor: c.toastBg }, style]}>
      <Text style={[ct.toast, styles.toastText, { color: c.toastText }]}>{message}</Text>
    </View>
  );
}

/** Turuncu sayı rozeti */
export function CountBadge({ count }: { count: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.accent }]}>
      <Text style={[typography.micro, { color: colors.onAccent }]}>{count}</Text>
    </View>
  );
}

// Durumlar ---------------------------------------------------------------------------------------

/** Ekran yükleniyor */
export function LoadingState() {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.action} />
    </View>
  );
}

/** Yükleme hatası: mesaj ve "Tekrar dene" */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.center, styles.errorBox]}>
      <Text style={[typography.body, styles.centerText, { color: colors.textBody }]}>
        {message ?? 'Şu an yüklenemedi. Bağlantını kontrol edip tekrar dene.'}
      </Text>
      {onRetry && <Button title="Tekrar dene" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs - 2,
  },
  input: {
    // Web: tarayıcının odak çerçevesi kenar rengini örtmesin
    outlineWidth: 0,
    height: cm.inputHeight,
    paddingHorizontal: cm.inputPaddingX,
    borderRadius: cm.inputRadius,
    borderWidth: borderWidth.thick,
  },
  multiline: {
    height: undefined,
    minHeight: 104,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: 'top',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: 14,
    borderRadius: cm.toastRadius,
  },
  undoToast: {
    paddingVertical: 10,
    paddingRight: 10,
  },
  toastText: {
    flex: 1,
  },
  undoButton: {
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: cm.countBadge,
    height: cm.countBadge,
    paddingHorizontal: 6,
    borderRadius: cm.countBadge / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.screenPadding,
  },
  errorBox: {
    gap: spacing.md,
  },
  centerText: {
    textAlign: 'center',
  },
});
