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
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import {
  borderWidth,
  colorsFor,
  componentColors,
  componentMetrics as cm,
  componentTypography as ct,
  layout,
  spacing,
  typography,
  useTheme,
  type ColorScheme,
} from '@/theme';

import { CheckIcon, WifiOffIcon } from '@/components/icons';
import { useT } from '@/i18n';

import Button from './Button';

// Metin alanı ------------------------------------------------------------------------------------

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  /** Doluysa kırmızı kenar ve alt satırda mesaj */
  error?: string | null;
  /** Hata yerine gösterilecek yardımcı/başarı satırı */
  hint?: string | null;
  /**
   * md: 52 (Components; çok satırda en az 104). sm: kompakt — tek satır 50 (PhotoProof not alanı), çok satır 84,
   * 12 14 iç boşluk, yazı 15 (Report.dc.html)
   */
  size?: 'md' | 'sm';
  /** Temadan bağımsız sabit ekran (PhotoProof iki modda koyu: `scheme="dark"`) */
  scheme?: ColorScheme;
  /**
   * Giriş metninin yazı stili (yer tutucu dahil); varsayılan yazının üstüne eklenir. Ör. DeleteAccount "SİL"
   * alanı 16 / 800, harf aralığı 1 (`settingsTypography.deleteConfirmInput`). Renk ve kutu ölçüsü için değil.
   */
  inputStyle?: StyleProp<TextStyle>;
  /** Dış kap (etiket + alan): kenar boşluğu, konum */
  style?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  error,
  hint,
  size = 'md',
  scheme: schemeOverride,
  inputStyle,
  style,
  onFocus,
  onBlur,
  ...input
}: TextFieldProps) {
  const theme = useTheme();
  const scheme = schemeOverride ?? theme.scheme;
  const colors = schemeOverride ? colorsFor(schemeOverride) : theme.colors;
  const c = componentColors[scheme];
  const [focused, setFocused] = useState(false);
  const sm = size === 'sm';
  const multiline = !!input.multiline;
  // Components.dc.html: boş alan 600, dolu ya da odaktaki alan 700
  const strong = focused || (typeof input.value === 'string' && input.value.length > 0);
  const font = sm && multiline ? (strong ? ct.inputSmFocused : ct.inputSm) : strong ? ct.inputFocused : ct.input;

  return (
    <View style={[styles.field, style]}>
      {label && <Text style={[ct.inputLabel, { color: c.inputLabel }]}>{label}</Text>}
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
          font,
          {
            color: colors.text,
            backgroundColor: c.inputBg,
            borderColor: error ? colors.dangerText : focused ? colors.action : c.inputBorder,
            boxShadow: focused && !error ? `0 0 0 ${cm.inputFocusRing}px ${c.inputFocusRing}` : undefined,
          },
          sm && styles.inputSm,
          multiline && (sm ? styles.multilineSm : styles.multiline),
          inputStyle,
        ]}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[ct.inputError, { color: colors.dangerText }]}>
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

type CountBadgeProps = {
  count: number;
  /** Zemin renginde 2 px kenar (Today.dc.html zil rozeti: ekran zemini); iç boşluk 0 5, dış ölçü 22 */
  outlineColor?: string;
  /** Konum (ör. zilin sağ üstü) */
  style?: StyleProp<ViewStyle>;
};

/** Turuncu sayı rozeti */
export function CountBadge({ count, outlineColor, style }: CountBadgeProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.accent },
        outlineColor && {
          borderWidth: cm.countBadgeOutline,
          borderColor: outlineColor,
          paddingHorizontal: cm.countBadgeOutlinedPaddingX,
        },
        style,
      ]}>
      <Text style={[typography.micro, { color: colors.onAccent }]}>{count}</Text>
    </View>
  );
}

// Durumlar ---------------------------------------------------------------------------------------

/** Ekran yükleniyor. `scheme`: temadan bağımsız sabit ekran (PhotoProof: `"dark"`) */
export function LoadingState({ scheme }: { scheme?: ColorScheme }) {
  const theme = useTheme();
  const colors = scheme ? colorsFor(scheme) : theme.colors;
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.action} />
    </View>
  );
}

type ErrorStateProps = {
  message?: string;
  /** Verilirse altta ikincil buton */
  onRetry?: () => void;
  /** Buton metni · varsayılan "Tekrar dene" (`common.retry`; ör. "Kapat") */
  actionLabel?: string;
  /** Temadan bağımsız sabit ekran (PhotoProof: `"dark"`) */
  scheme?: ColorScheme;
};

/** Yükleme hatası: mesaj ve "Tekrar dene" */
export function ErrorState({ message, onRetry, actionLabel, scheme }: ErrorStateProps) {
  const theme = useTheme();
  const t = useT();
  const colors = scheme ? colorsFor(scheme) : theme.colors;
  return (
    <View style={[styles.center, styles.errorBox]}>
      <Text style={[typography.body, styles.centerText, { color: colors.textBody }]}>
        {message ?? t.common.loadFailed}
      </Text>
      {onRetry && <Button title={actionLabel ?? t.common.retry} variant="secondary" scheme={scheme} onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: cm.fieldGap,
  },
  input: {
    // Web: tarayıcının odak çerçevesi kenar rengini örtmesin
    outlineWidth: 0,
    height: cm.inputHeight,
    paddingHorizontal: cm.inputPaddingX,
    borderRadius: cm.inputRadius,
    borderWidth: borderWidth.thick,
  },
  inputSm: {
    height: cm.inputHeightSm,
  },
  multiline: {
    height: undefined,
    minHeight: cm.inputMultilineMinHeight,
    paddingTop: cm.inputMultilinePaddingY,
    paddingBottom: cm.inputMultilinePaddingY,
    textAlignVertical: 'top',
  },
  multilineSm: {
    height: cm.inputMultilineHeightSm,
    paddingTop: cm.inputMultilinePaddingYSm,
    paddingBottom: cm.inputMultilinePaddingYSm,
    paddingHorizontal: cm.inputMultilinePaddingXSm,
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
    paddingHorizontal: cm.countBadgePaddingX,
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
