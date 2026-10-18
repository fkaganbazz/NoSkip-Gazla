import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { componentTypography as ct, radius, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m } from '@/theme/onboarding';

type Props = {
  provider: 'apple' | 'google';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

const TITLES = { apple: 'Apple ile devam et', google: 'Google ile devam et' } as const;

// "Apple ile devam et" (siyah) ve "Google ile devam et" (beyaz, kenarlı) — SignIn.dc.html.
// Tok butonlardan farklı olarak altta gölge yok.
export default function ProviderButton({ provider, onPress, loading = false, disabled = false }: Props) {
  const { scheme } = useTheme();
  const c = onboardingColors[scheme];
  const apple = provider === 'apple';
  const text = apple ? c.appleText : c.googleText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={TITLES[provider]}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        apple
          ? { backgroundColor: c.appleBg }
          : { backgroundColor: c.googleBg, borderColor: c.googleBorder, borderWidth: m.providerBorder },
        { opacity: pressed ? 0.85 : disabled && !loading ? 0.6 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <Text style={[ct.button, { color: text }]}>{TITLES[provider]}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: m.providerHeight,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
