import { useCallback, useEffect, useRef, useState } from 'react';

import { useCreateChallengeMutation } from '@/data';

import { errorMessage } from './logic';
import { useOnboarding } from './OnboardingProvider';

/**
 * Profil tamamlandıktan sonra PickChallenge'da seçilen şablondan challenge oluşturur (bir kez) ve
 * `setCreatedChallenge` ile saklar. Davet adımı bu challenge'a davet eder.
 *
 * Oluşturma Profil ekranında değil burada: mock'ta profil tamamlanınca oturum yenilenip gezinme
 * yeniden kuruluyor, Profil ekranı yarıda kapanabiliyor. Davet ekranı açılınca başlar, hatada
 * "Tekrar dene" ile yinelenir.
 */
export function useOnboardingChallenge() {
  const { pickedTemplateId, createdChallengeId, setCreatedChallenge } = useOnboarding();
  const { mutateAsync } = useCreateChallengeMutation();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const create = useCallback(() => {
    if (!pickedTemplateId) return;
    started.current = true;
    setError(null);
    mutateAsync({ templateId: pickedTemplateId })
      .then((challenge) => setCreatedChallenge(challenge.id))
      .catch((e: unknown) => setError(errorMessage(e)));
  }, [pickedTemplateId, mutateAsync, setCreatedChallenge]);

  useEffect(() => {
    if (pickedTemplateId && !createdChallengeId && !started.current) create();
  }, [pickedTemplateId, createdChallengeId, create]);

  return { challengeId: createdChallengeId, error, retry: create };
}
