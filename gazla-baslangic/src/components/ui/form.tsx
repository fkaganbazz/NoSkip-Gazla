/**
 * Form ve geri bildirim — design/Components.dc.html: metin alanı (varsayılan, odakta, hata),
 * bilgi tostu (çevrimdışı), geri al tostu, sayı rozeti, yükleniyor / hata durumları.
 */
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import {
  borderWidth,
  componentColors,
  componentMetrics as cm,
  componentTypography as ct,
  layout,
  spacing,
  typography,
  useTheme,
} from '@/theme';

import { CheckIcon, WifiOffIcon } from '@/components/icons';

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

// Avatar ve upperTr: src/components/Avatar.tsx

// Tost ve rozet ------------------------------------------------------------------------------------

/** info: koyu, ikonsuz; offline: koyu + çevrimdışı ikonu; success: yeşil + tik (Components.dc.html GERİ BİLDİRİM) */
export type ToastKind = 'info' | 'success' | 'offline';

export type ToastAction = { label: string; onPress: () => void };

type ToastProps = {
  message: string;
  /** Verilmezse: `action` varsa success (geri al tostu), yoksa info */
  kind?: ToastKind;
  /** Sağda beyaz buton ("Geri al") */
  action?: ToastAction;
  style?: StyleProp<ViewStyle>;
};

/** Tost kutusu (yalnızca görünüm). Zamanlama ve ekran altına yerleşim: `useToast` + `ToastHost` (toast.tsx). */
export function Toast({ message, kind, action, style }: ToastProps) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  const k = kind ?? (action ? 'success' : 'info');
  const success = k === 'success';
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        action && styles.toastWithAction,
        { backgroundColor: success ? c.undoToastBg : c.toastBg },
        style,
      ]}>
      {k === 'offline' && (
        <WifiOffIcon color={c.toastOfflineIcon} size={cm.toastIconSize} strokeWidth={cm.toastOfflineIconStroke} />
      )}
      {success && <CheckIcon color={colors.actionText} size={cm.toastIconSize} strokeWidth={cm.toastSuccessIconStroke} />}
      <Text style={[success ? ct.toastStrong : ct.toast, styles.toastText, { color: success ? c.undoToastText : c.toastText }]}>
        {message}
      </Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          hitSlop={(layout.minTouchTarget - cm.toastButtonHeight) / 2}
          style={({ pressed }) => [styles.toastButton, { backgroundColor: c.undoButtonBg }, pressed && styles.toastButtonPressed]}>
          <Text style={[ct.toastStrong, { color: colors.actionText }]}>{action.label}</Text>
        </Pressable>
      )}
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
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.toastGap,
    paddingVertical: cm.toastPaddingY,
    paddingHorizontal: cm.toastPaddingX,
    borderRadius: cm.toastRadius,
  },
  toastWithAction: {
    paddingVertical: cm.toastActionPadding,
    paddingRight: cm.toastActionPadding,
  },
  toastText: {
    flex: 1,
  },
  toastButton: {
    height: cm.toastButtonHeight,
    paddingHorizontal: cm.toastButtonPaddingX,
    borderRadius: cm.toastButtonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastButtonPressed: {
    opacity: 0.8,
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
