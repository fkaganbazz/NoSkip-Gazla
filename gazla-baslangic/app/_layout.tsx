import { useFonts } from 'expo-font';
import { NavigationBar } from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { DataProvider, useAuth } from '@/data';
import { OnboardingProvider, useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { fontAssets, radius, useTheme } from '@/theme';

// Fontlar ve oturum bilgisi gelene kadar açılış ekranı açık kalsın.
SplashScreen.preventAutoHideAsync();

// Derin bağlantıyla doğrudan bir alt ekran açılsa da altında sekmeler olsun.
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <DataProvider>
      <OnboardingProvider>
        <RootNavigator />
      </OnboardingProvider>
    </DataProvider>
  );
}

/** Alt sayfa (sheet) sunumu: NumberEntry, Poke */
const SHEET = {
  presentation: 'formSheet',
  sheetAllowedDetents: 'fitToContents',
  sheetCornerRadius: radius.sheet,
  sheetGrabberVisible: true,
} as const;

function RootNavigator() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const { colors } = useTheme();
  const { status } = useAuth();
  const onboarding = useOnboarding();

  const fontsReady = fontsLoaded || !!fontError;
  const authReady = status !== 'loading';
  // Uygulama: oturum ve profil hazır, onboarding'in son adımları da bitti
  const appOpen = status === 'ready' && !onboarding.inProgress;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  useEffect(() => {
    if (fontsReady && authReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady, authReady]);

  if (!fontsReady || !authReady) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />
      {/* Android: gezinme çubuğu tuşları açık/koyu temayla birlikte değişsin (menü çubuğun altına uzanıyor). */}
      <NavigationBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Protected guard={appOpen}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="create"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="challenge/[id]/index" />
          <Stack.Screen name="challenge/[id]/finished" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="challenge/[id]/share" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="checkin/number/[id]" options={SHEET} />
          <Stack.Screen name="checkin/photo/[id]" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="completion" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="streak-lost" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="ad-consent" options={{ presentation: 'modal' }} />
          <Stack.Screen name="poke/[userId]" options={SHEET} />
          <Stack.Screen name="activity" />
          <Stack.Screen name="friend/[id]" />
          <Stack.Screen name="report" options={{ presentation: 'modal' }} />
          <Stack.Screen name="template/[id]" />
          <Stack.Screen name="invite-friends" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings/index" />
          <Stack.Screen name="settings/notifications" />
          <Stack.Screen name="settings/blocked" />
          <Stack.Screen name="settings/delete-account" />
          <Stack.Screen name="dev" />
        </Stack.Protected>

        <Stack.Protected guard={!appOpen}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>

        {/* Davet linki oturumsuz da açılır (gazla://invite/KOD) */}
        <Stack.Screen name="invite/[code]" />
      </Stack>
    </>
  );
}
