import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/data';
import { onboardingRedirect, type OnboardingScreen } from '@/features/onboarding/logic';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { useTheme } from '@/theme';

// Onboarding: Main → PickChallenge → SignIn → Profile → (Create) → InviteFriends → NotifPermission.
// Oturum durumu değişince (giriş, profil tamamlandı, çıkış) kullanıcı doğru adıma taşınır:
// oturum var ama profil yoksa hangi ekrandaysa Profil'e; profil hazırsa bekleyen davet, seçilen şablon
// ya da "Kendim oluşturacağım" seçimine göre sıradaki adıma.
export default function OnboardingLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { status } = useAuth();
  const { pickedTemplateId, customChallenge, createdChallengeId, joinedViaInvite, inviteChecked } = useOnboarding();

  const screen = ((segments as string[])[1] ?? 'index') as OnboardingScreen;
  const target = onboardingRedirect({
    status,
    screen,
    pickedTemplateId,
    customChallenge,
    createdChallengeId,
    joinedViaInvite,
    inviteChecked,
  });

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
      {/* "Kendim oluşturacağım": Create (kapatınca challenge seçimine dönülür) */}
      <Stack.Screen name="create" options={{ gestureEnabled: false }} />
      {/* Geri butonu challenge seçimine döner; kaydırma kapalı (altında profil adımı olabilir) */}
      <Stack.Screen name="invite" options={{ gestureEnabled: false }} />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
