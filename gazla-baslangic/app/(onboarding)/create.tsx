import { useRouter } from 'expo-router';

import CreateScreen from '@/features/create/CreateScreen';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';

// "Kendim oluşturacağım" — profil adımından sonra Create (design/Create.dc.html). Challenge oluşunca
// onboarding durumuna yazılır; (onboarding)/_layout davet adımına geçirir. Kapatınca challenge seçimine dönülür.
export default function OnboardingCreateScreen() {
  const router = useRouter();
  const { setCreatedChallenge } = useOnboarding();

  return (
    <CreateScreen
      onCreated={(challengeId) => setCreatedChallenge(challengeId)}
      onClose={() => router.dismissTo('/(onboarding)/pick-challenge')}
    />
  );
}
