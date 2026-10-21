import { useFonts } from 'expo-font';
import { NavigationBar } from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAdsBootstrap } from '@/ads';
import { DataProvider, useAuth } from '@/data';
import { OnboardingProvider, useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { restoreThemePreference } from '@/features/settings/themePreference';
import { useNotificationsBootstrap } from '@/notifications';
import { fontAssets, useTheme } from '@/theme';

// Fontlar ve oturum bilgisi gelene kadar açılış ekranı açık kalsın.
SplashScreen.preventAutoHideAsync();

// Derin bağlantıyla doğrudan bir alt ekran açılsa da altında sekmeler olsun.
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    // Alt sayfalar (@gorhom/bottom-sheet) için jest kökü
    <GestureHandlerRootView style={styles.root}>
      <DataProvider>
        <OnboardingProvider>
          <RootNavigator />
        </OnboardingProvider>
      </DataProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

/**
 * Alt sayfa route'ları (NumberEntry, Poke): ekran şeffaf modal olarak açılır, karartmayı ve sayfayı
 * `src/components/Sheet` (@gorhom/bottom-sheet) kendisi çizer ve canlandırır; altta önceki ekran görünür.
 */
const SHEET = {
  presentation: 'transparentModal',
  animation: 'none',
  contentStyle: { backgroundColor: 'transparent' },
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

  // Reklam izni/SDK (AdMob + UMP + ATT) ve bildirim dinleyicileri (dokununca ilgili ekran)
  useAdsBootstrap();
  useNotificationsBootstrap({ canNavigate: fontsReady && authReady && appOpen });

  // Ayarlar'da seçilen görünüm (Açık / Koyu / Sistem) cihazda saklanır
  useEffect(() => {
    restoreThemePreference();
  }, []);

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
          {/* Detay `challenge/[id].tsx`, bitti `challenge/[id]/finished.tsx` (klasörde _layout yok: ikisi de bu Stack'te) */}
          <Stack.Screen name="challenge/[id]" />
          <Stack.Screen name="challenge/[id]/finished" options={{ presentation: 'fullScreenModal' }} />
          {/* Statik `preview` segmenti `challenge/[id]`'den önce eşleşir */}
          <Stack.Screen name="challenge/preview/[templateId]" />
          {/* İşaretleme: /checkin/number?challengeId=…&date=YYYY-AA-GG (yerel gün; gece toleransında dün) */}
          <Stack.Screen name="checkin/number" options={SHEET} />
          <Stack.Screen name="checkin/photo" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="completion" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="streak-lost/[challengeId]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="ad-consent" options={{ presentation: 'modal' }} />
          <Stack.Screen name="poke/[userId]" options={SHEET} />
          <Stack.Screen name="activity" />
          <Stack.Screen name="user/[id]" />
          {/* /report/<kişi>?target=user|photo|challenge (&contentId=<check-in> | &challengeId=<challenge>) */}
          <Stack.Screen name="report/[userId]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="invite-friends" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings/index" />
          <Stack.Screen name="settings/notifications" />
          <Stack.Screen name="settings/blocked" />
          <Stack.Screen name="settings/delete-account" />
          <Stack.Screen name="dev" />
        </Stack.Protected>

        {/* Uygulama kapalıyken açılış "/" (Bugün) korumalı: Stack ilk açık ekrana, (onboarding)'e düşer; onun ilk
            ekranı karşılama (`(onboarding)/welcome`, unstable_settings.initialRouteName). Çıkışta da aynısı. */}
        <Stack.Protected guard={!appOpen}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>

        {/* Davet linki oturumsuz da açılır (gazla://invite/KOD) */}
        <Stack.Screen name="invite/[code]" />
      </Stack>
    </>
  );
}
