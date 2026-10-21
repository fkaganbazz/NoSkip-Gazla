import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import {
  borderWidth,
  componentColors,
  componentMetrics as cm,
  componentTypography as ct,
  typography,
  useTheme,
} from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

/** Sunucunun cevabına göre kullanıcı adı durumu */
export type UsernameState = 'empty' | 'short' | 'checking' | 'available' | 'unavailable' | 'error';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  state: UsernameState;
};

const MESSAGES: Partial<Record<UsernameState, string>> = {
  short: 'En az 3 karakter olmalı',
  available: 'Bu kullanıcı adı boşta',
  unavailable: 'Bu kullanıcı adı alınmış ya da kullanılamıyor',
};

// "Kullanıcı adın" alanı (Profile.dc.html): solda @, sağda boşta tiki, altında durum satırı.
export default function UsernameField({ value, onChangeText, state }: Props) {
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const cc = componentColors[scheme];
  const [focused, setFocused] = useState(false);

  const borderColor =
    state === 'available'
      ? colors.action
      : state === 'unavailable'
        ? colors.dangerText
        : focused
          ? colors.action
          : c.fieldBorder;
  const message = MESSAGES[state];
  const messageColor =
    state === 'available' ? c.availableText : state === 'unavailable' ? colors.dangerText : colors.textSecondary;

  return (
    <View style={styles.field}>
      <Text style={[ct.inputLabel, { color: colors.text }]}>Kullanıcı adın</Text>
      <View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          textContentType="username"
          maxLength={21}
          accessibilityLabel="Kullanıcı adın"
          placeholderTextColor={cc.placeholder}
          style={[
            styles.input,
            t.fieldValue,
            {
              color: colors.text,
              backgroundColor: c.fieldBg,
              borderColor,
              boxShadow:
                focused && state !== 'unavailable' ? `0 0 0 ${cm.inputFocusRing}px ${cc.inputFocusRing}` : undefined,
            },
          ]}
        />
        <Text style={[t.fieldPrefix, styles.prefix, { color: c.fieldPrefix }]} pointerEvents="none">
          @
        </Text>
        {state === 'available' && (
          <View style={[styles.badge, { backgroundColor: colors.action }]} pointerEvents="none">
            <CheckIcon color={colors.onAction} size={m.usernameBadgeIconSize} strokeWidth={m.usernameBadgeIconStroke} />
          </View>
        )}
        {state === 'checking' && (
          <View style={styles.badge} pointerEvents="none">
            <ActivityIndicator size="small" color={colors.textSecondary} />
          </View>
        )}
      </View>
      {message && (
        <Text accessibilityLiveRegion="polite" style={[typography.meta, { color: messageColor }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: m.fieldGap,
  },
  input: {
    height: m.fieldHeight,
    paddingLeft: m.usernamePaddingLeft,
    paddingRight: m.usernamePaddingRight,
    borderRadius: m.fieldRadius,
    borderWidth: borderWidth.thick,
    // Web: tarayıcının odak çerçevesi kenar rengini (boşta / alınmış) örtmesin
    outlineWidth: 0,
  },
  prefix: {
    position: 'absolute',
    left: m.usernamePrefixLeft,
    top: 0,
    bottom: 0,
    textAlignVertical: 'center',
    lineHeight: m.fieldHeight,
  },
  badge: {
    position: 'absolute',
    right: m.usernameBadgeRight,
    top: (m.fieldHeight - m.usernameBadgeSize) / 2,
    width: m.usernameBadgeSize,
    height: m.usernameBadgeSize,
    borderRadius: m.usernameBadgeSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
