import { useRouter } from 'expo-router';

import InviteFriends from '@/features/invite-friends/InviteFriends';
import { useOnboardingChallenge } from '@/features/onboarding/useOnboardingChallenge';

// Arkadaşlarını çağır — design/InviteFriends.dc.html (onboarding adım 3/4). Seçilen şablonun
// challenge'ı burada oluşturulur, davet linki ona verilir. "Devam" / "Şimdilik atla" → bildirim izni.
export default function OnboardingInviteScreen() {
  const router = useRouter();
  const { challengeId, error, retry } = useOnboardingChallenge();

  return (
    <InviteFriends
      variant="onboarding"
      challengeId={challengeId}
      challengeError={error}
      onRetryChallenge={retry}
      onContinue={() => router.push('/(onboarding)/notifications')}
    />
  );
}
