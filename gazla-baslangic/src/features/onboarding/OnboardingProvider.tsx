/**
 * Onboarding akışının durumu: Main → PickChallenge → SignIn → Profile → (Create) → InviteFriends → NotifPermission.
 *
 * - Girişten önce seçilen challenge (`pickedTemplateId`) ya da "Kendim oluşturacağım" (`customChallenge`) giriş ve
 *   profil adımlarından sonra oluşturulur; o zamana kadar burada tutulur.
 * - Profil tamamlanınca oturum "hazır" olur ama kullanıcı davet ve bildirim adımlarını da görsün diye
 *   `inProgress` açık kalır; NotifPermission `finish()` çağırınca uygulama açılır.
 * - Oturum hazır olunca bekleyen davet kodu (`takePendingInvite`, InviteLanding "Katıl ve başla") varsa
 *   challenge'a katılınır: katılınan challenge `createdChallengeId` olur, şablon/özel oluşturma ve davet adımı
 *   atlanır. Kontrol bitene kadar (`inviteChecked`) yönlendirme bekler. Onboarding'i görmeyen mevcut hesaplarda da
 *   (giriş yapınca uygulama açılır) katılım arka planda tamamlanır.
 * - Davet adımından geri dönüp challenge seçimi değiştirilirse önceki onboarding challenge'ından ayrılınır.
 * - Oturum kapanınca (ör. Profil'den geri) yarım kalan onboarding sıfırlanır; seçilen şablon korunur.
 *
 * Durum gezinmenin üstünde tutulur: mock'ta profil tamamlanınca oturum yenilenir ve gezinme ağacı yeniden kurulur;
 * ekranlar kapanıp açılsa da akış kaybolmaz.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { takePendingInvite, useAuth, useInvite, useLeaveChallenge } from '@/data';
import { getT } from '@/i18n';

import { errorMessage, type OnboardingFlow } from './logic';

type InviteCheck = 'idle' | 'checking' | 'done';

type OnboardingState = OnboardingFlow & {
  /** Onboarding sürüyor (profil tamamlansa bile son adımlar bitmedi) */
  inProgress: boolean;
  /** Bekleyen davete katılılamadıysa kullanıcıya gösterilecek metin (gösterilince `clearInviteError`) */
  inviteError: string | null;
  start: () => void;
  /** PickChallenge "Devam": şablon seçimi (null = seçim yok) */
  pickTemplate: (templateId: string | null) => void;
  /** PickChallenge "Kendim oluşturacağım" */
  chooseCustom: () => void;
  /** Onboarding challenge'ı oluşturuldu (şablondan ya da Create'te) */
  setCreatedChallenge: (challengeId: string | null) => void;
  clearInviteError: () => void;
  finish: () => void;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [inProgress, setInProgress] = useState(false);
  const [pickedTemplateId, setPickedTemplateId] = useState<string | null>(null);
  const [customChallenge, setCustomChallenge] = useState(false);
  const [createdChallengeId, setCreatedChallengeId] = useState<string | null>(null);
  /** Oluşturulan challenge'ın kaynağı: şablon id'si ya da 'custom' (seçim değişince eskisi bırakılır) */
  const createdFor = useRef<string | null>(null);
  const [joinedViaInvite, setJoinedViaInvite] = useState(false);
  const [inviteCheck, setInviteCheck] = useState<InviteCheck>('idle');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const { status } = useAuth();
  const { join: joinByInvite } = useInvite();
  const { mutate: leaveChallenge } = useLeaveChallenge();

  // Oturum kapandığında (yükleniyor ara durumu sayılmaz) onboarding'in oturumlu adımları sıfırlanır
  const lastStatus = useRef(status);
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'signedOut' && lastStatus.current !== 'signedOut' && lastStatus.current !== 'loading') {
      setInProgress(false);
      setCreatedChallengeId(null);
      createdFor.current = null;
      setJoinedViaInvite(false);
      setInviteError(null);
    }
    lastStatus.current = status;
  }, [status]);

  // Bekleyen davet: oturum her hazır olduğunda bir kez bakılır (oturum kapanınca ya da profil beklerken sıfırlanır).
  // Kod yalnızca oturumsuz açılan davette saklanır; varsa bu kişi az önce giriş yaptı ya da hesabını açtı.
  useEffect(() => {
    if (status === 'signedOut' || status === 'needsProfile') {
      setInviteCheck('idle');
      return;
    }
    if (status !== 'ready' || inviteCheck !== 'idle') return;
    setInviteCheck('checking');
    (async () => {
      const code = await takePendingInvite();
      if (code) {
        try {
          const challengeId = await joinByInvite(code);
          setCreatedChallengeId(challengeId);
          createdFor.current = null;
          setJoinedViaInvite(true);
        } catch (e) {
          const t = getT();
          setInviteError(t.onboarding.inviteJoinFailed(errorMessage(e, t)));
        }
      }
      setInviteCheck('done');
    })();
  }, [status, inviteCheck, joinByInvite]);

  /** Seçim değişti: önceki onboarding challenge'ından ayrıl (davetle katılınan challenge'a dokunulmaz) */
  const abandonCreated = useCallback(
    (nextSource: string) => {
      if (!createdChallengeId || joinedViaInvite || createdFor.current === nextSource) return;
      leaveChallenge(createdChallengeId);
      setCreatedChallengeId(null);
      createdFor.current = null;
    },
    [createdChallengeId, joinedViaInvite, leaveChallenge],
  );

  const value = useMemo<OnboardingState>(
    () => ({
      inProgress,
      pickedTemplateId,
      customChallenge,
      createdChallengeId,
      joinedViaInvite,
      inviteChecked: inviteCheck === 'done',
      inviteError,
      start: () => setInProgress(true),
      pickTemplate: (templateId) => {
        if (templateId) abandonCreated(templateId);
        setPickedTemplateId(templateId);
        setCustomChallenge(false);
      },
      chooseCustom: () => {
        // Her "Kendim oluşturacağım" yeni bir challenge oluşturur
        abandonCreated('custom:new');
        setPickedTemplateId(null);
        setCustomChallenge(true);
      },
      setCreatedChallenge: (challengeId) => {
        createdFor.current = challengeId ? (customChallenge ? 'custom' : pickedTemplateId) : null;
        setCreatedChallengeId(challengeId);
      },
      clearInviteError: () => setInviteError(null),
      finish: () => {
        setInProgress(false);
        setPickedTemplateId(null);
        setCustomChallenge(false);
        setCreatedChallengeId(null);
        createdFor.current = null;
        setJoinedViaInvite(false);
        setInviteError(null);
      },
    }),
    [
      inProgress,
      pickedTemplateId,
      customChallenge,
      createdChallengeId,
      joinedViaInvite,
      inviteCheck,
      inviteError,
      abandonCreated,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error('useOnboarding, OnboardingProvider içinde kullanılmalı');
  return value;
}
