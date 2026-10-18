import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

// Onboarding: Main → PickChallenge → SignIn → Profile → InviteFriends → NotifPermission
export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
  );
}
