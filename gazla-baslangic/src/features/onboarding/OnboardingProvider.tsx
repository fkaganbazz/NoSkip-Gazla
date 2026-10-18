/**
 * Onboarding akışının durumu: Main → PickChallenge → SignIn → Profile → InviteFriends → NotifPermission.
 *
 * - Girişten önce seçilen challenge (`pickedTemplateId`) giriş ve profil adımlarından sonra
 *   oluşturulur; o zamana kadar burada tutulur.
 * - Profil tamamlanınca oturum "hazır" olur ama kullanıcı davet ve bildirim adımlarını da görsün diye
 *   `inProgress` açık kalır; NotifPermission `finish()` çağırınca uygulama açılır.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type OnboardingState = {
  /** Onboarding sürüyor (profil tamamlansa bile son adımlar bitmedi) */
  inProgress: boolean;
  /** PickChallenge'da seçilen şablon; null = "Kendim oluşturacağım" ya da seçim yok */
  pickedTemplateId: string | null;
  /** Profil adımından sonra oluşturulan challenge (InviteFriends bu challenge'a davet eder) */
  createdChallengeId: string | null;
  start: () => void;
  pickTemplate: (templateId: string | null) => void;
  setCreatedChallenge: (challengeId: string | null) => void;
  finish: () => void;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [inProgress, setInProgress] = useState(false);
  const [pickedTemplateId, setPickedTemplateId] = useState<string | null>(null);
  const [createdChallengeId, setCreatedChallengeId] = useState<string | null>(null);

  const value = useMemo<OnboardingState>(
    () => ({
      inProgress,
      pickedTemplateId,
      createdChallengeId,
      start: () => setInProgress(true),
      pickTemplate: setPickedTemplateId,
      setCreatedChallenge: setCreatedChallengeId,
      finish: () => {
        setInProgress(false);
        setPickedTemplateId(null);
        setCreatedChallengeId(null);
      },
    }),
    [inProgress, pickedTemplateId, createdChallengeId],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error('useOnboarding, OnboardingProvider içinde kullanılmalı');
  return value;
}
