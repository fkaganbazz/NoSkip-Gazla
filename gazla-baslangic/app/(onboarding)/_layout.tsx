import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/data';
import { onboardingRedirect, type OnboardingScreen } from '@/features/onboarding/logic';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { useTheme } from '@/theme';

// Onboarding: Main → PickChallenge → SignIn → Profile → InviteFriends → NotifPermission.
// Oturum durumu değişince (giriş, profil tamamlandı, çıkış) kullanıcı doğru adıma taşınır:
// oturum var ama profil yoksa hangi ekrandaysa Profil'e.
export default function OnboardingLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { status } = useAuth();
  const { pickedTemplateId, createdChallengeId } = useOnboarding();

  const screen = ((segments as string[])[1] ?? 'index') as OnboardingScreen;
  const target = onboardingRedirect({ status, screen, pickedTemplateId, createdChallengeId });

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pick-challenge" />
      <Stack.Screen name="sign-in" />
      {/* Profil tamamlandıktan sonra geri kaydırma yok; Profil'de geri = oturumu kapat */}
      <Stack.Screen name="profile" options={{ gestureEnabled: false }} />
      <Stack.Screen name="invite" options={{ gestureEnabled: false }} />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
