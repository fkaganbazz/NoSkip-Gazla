import { useRouter } from 'expo-router';

import InviteFriends from '@/features/invite-friends/InviteFriends';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { useOnboardingChallenge } from '@/features/onboarding/useOnboardingChallenge';

// Arkadaşlarını çağır — design/InviteFriends.dc.html (onboarding adım 3/4). Seçilen şablonun
// challenge'ı burada oluşturulur ("Kendim oluşturacağım"da Create'te oluşturuldu), davet linki ona verilir.
// "Devam" / "Şimdilik atla" → bildirim izni. Geri: challenge seçimine (giriş ve profil tamamlandı); seçim
// değişirse önceki onboarding challenge'ı bırakılır (OnboardingProvider).
export default function OnboardingInviteScreen() {
  const router = useRouter();
  const { challengeId, error, retry } = useOnboardingChallenge();
  const { inviteError, clearInviteError } = useOnboarding();

  return (
    <InviteFriends
      variant="onboarding"
      challengeId={challengeId}
      challengeError={error}
      onRetryChallenge={retry}
      onContinue={() => router.push('/(onboarding)/notifications')}
      onBack={() => router.dismissTo('/(onboarding)/pick-challenge')}
      notice={inviteError}
      onNoticeShown={clearInviteError}
    />
  );
}
