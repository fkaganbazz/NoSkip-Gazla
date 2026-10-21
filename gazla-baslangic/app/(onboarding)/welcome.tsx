import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StreakIcon } from '@/components/icons';
import { Button } from '@/components/ui';
import WelcomeArt from '@/features/onboarding/WelcomeArt';
import { useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

/** Güvenli alanın üstünden sanat alanına kadar logo satırı için ayrılan yer (tasarımda 100 − 47) */
const LOGO_RESERVE = m.welcomeArtTop - m.designStatusBar;

// Karşılama — design/Main.dc.html. "Başlayalım" → PickChallenge, "Zaten hesabım var" → SignIn.
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme } = useTheme();
  const c = onboardingColors[scheme];
  const sheetPaddingBottom = Math.max(insets.bottom, m.sheetPaddingBottom);

  return (
    <View style={[styles.screen, { backgroundColor: c.welcomeBg }]}>
      <StatusBar style="light" />
      <View style={[styles.logo, { top: insets.top + m.welcomeLogoTop }]}>
        <StreakIcon color={c.welcomeLogo} size={m.welcomeLogoIconSize} strokeWidth={m.welcomeLogoIconStroke} />
        <Text accessibilityRole="header" style={[t.welcomeLogo, { color: c.welcomeLogo }]}>
          Gazla
        </Text>
      </View>

      <WelcomeArt reservedTop={insets.top + LOGO_RESERVE} />

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: c.sheetBg,
            paddingBottom: sheetPaddingBottom,
            minHeight: m.sheetHeight - m.sheetPaddingBottom + sheetPaddingBottom,
          },
        ]}>
        <Text accessibilityRole="header" style={[t.welcomeTitle, { color: c.sheetTitle }]}>
          Seri senden, laf Diken'den.
        </Text>
        <Text style={[t.lead, { color: c.sheetBody }]}>
          Arkadaşlarınla 7, 10 ya da 30 günlük challenge'lara gir. Birbirinizi gazlayın, günü kaçıranı Diken dürtsün.
        </Text>
        <View style={styles.buttons}>
          <Button title="Başlayalım" onPress={() => router.push('/(onboarding)/pick-challenge')} />
          <Button title="Zaten hesabım var" variant="text" onPress={() => router.push('/(onboarding)/sign-in')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  logo: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.welcomeLogoGap,
  },
  sheet: {
    paddingTop: m.sheetPaddingTop,
    paddingHorizontal: m.sheetPaddingX,
    borderTopLeftRadius: m.sheetRadius,
    borderTopRightRadius: m.sheetRadius,
    gap: m.sheetGap,
  },
  buttons: {
    marginTop: 'auto',
    gap: m.sheetButtonsGap,
  },
});
