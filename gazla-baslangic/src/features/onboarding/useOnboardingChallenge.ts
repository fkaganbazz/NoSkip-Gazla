import { useCallback, useEffect, useRef, useState } from 'react';

import { useCreateChallenge } from '@/data';

import { errorMessage } from './logic';
import { useOnboarding } from './OnboardingProvider';

/**
 * Profil tamamlandıktan sonra PickChallenge'da seçilen şablondan challenge oluşturur (şablon başına bir kez) ve
 * `setCreatedChallenge` ile saklar. Davet adımı bu challenge'a davet eder. "Kendim oluşturacağım"da ya da
 * davetle katılınca challenge zaten hazırdır (`createdChallengeId`).
 *
 * Oluşturma Profil ekranında değil burada: mock'ta profil tamamlanınca oturum yenilenip gezinme
 * yeniden kuruluyor, Profil ekranı yarıda kapanabiliyor. Davet ekranı açılınca başlar, hatada
 * "Tekrar dene" ile yinelenir.
 */
export function useOnboardingChallenge() {
  const { pickedTemplateId, createdChallengeId, setCreatedChallenge } = useOnboarding();
  const { create: createChallenge } = useCreateChallenge();
  const [error, setError] = useState<string | null>(null);
  /** Oluşturması başlatılan şablon (seçim davet adımından geri dönülüp değişirse yenisi oluşturulur) */
  const started = useRef<string | null>(null);

  const create = useCallback(() => {
    if (!pickedTemplateId) return;
    started.current = pickedTemplateId;
    setError(null);
    createChallenge({ templateId: pickedTemplateId })
      .then((challenge) => setCreatedChallenge(challenge.id))
      .catch((e: unknown) => setError(errorMessage(e)));
  }, [pickedTemplateId, createChallenge, setCreatedChallenge]);

  useEffect(() => {
    if (pickedTemplateId && !createdChallengeId && started.current !== pickedTemplateId) create();
  }, [pickedTemplateId, createdChallengeId, create]);

  return { challengeId: createdChallengeId, error, retry: create };
}
