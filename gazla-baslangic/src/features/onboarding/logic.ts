import { ApiError, type AuthStatus, type Template } from '@/data';
import type { Messages } from '@/i18n';

/** (onboarding) grubundaki ekranlar (dosya adları) */
export type OnboardingScreen =
  | 'welcome'
  | 'pick-challenge'
  | 'sign-in'
  | 'profile'
  | 'create'
  | 'invite'
  | 'notifications';

export type OnboardingTarget =
  | '/(onboarding)/welcome'
  | '/(onboarding)/sign-in'
  | '/(onboarding)/profile'
  | '/(onboarding)/create'
  | '/(onboarding)/invite'
  | '/(onboarding)/notifications';

/** Yönlendirmenin baktığı onboarding durumu (OnboardingProvider) */
export type OnboardingFlow = {
  pickedTemplateId: string | null;
  /** "Kendim oluşturacağım": profilden sonra Create adımı */
  customChallenge: boolean;
  createdChallengeId: string | null;
  /** createdChallengeId bekleyen davetle katılınan challenge: davet adımı atlanır */
  joinedViaInvite: boolean;
  /** Profil tamamlandıktan sonra bekleyen davet kodu kontrol edildi (ve varsa katılım bitti) */
  inviteChecked: boolean;
};

/**
 * Profil hazır olduktan sonraki adım: davetle katıldıysa doğrudan bildirim izni; challenge (seçilen şablon ya da
 * oluşturulan) varsa davet; "Kendim oluşturacağım" seçildiyse Create; hiçbiri yoksa bildirim izni.
 */
export function nextStepAfterProfile(flow: OnboardingFlow): OnboardingTarget {
  if (flow.joinedViaInvite) return '/(onboarding)/notifications';
  if (flow.createdChallengeId || flow.pickedTemplateId) return '/(onboarding)/invite';
  if (flow.customChallenge) return '/(onboarding)/create';
  return '/(onboarding)/notifications';
}

/**
 * Oturum durumuna göre kullanıcının olması gereken adım; zaten doğru yerdeyse null.
 * - Oturum yok: profil ve sonrası açılmaz.
 * - Oturum var, profil yok: her zaman Profil.
 * - Profil hazır (onboarding sürüyor): bekleyen davet kontrolü bitene kadar yerinde kalır; sonra
 *   `nextStepAfterProfile`. Giriş ve profil adımlarına dönülmez; challenge seçimi (davet adımından geri)
 *   değiştirilebilir.
 */
export function onboardingRedirect({
  status,
  screen,
  ...flow
}: OnboardingFlow & { status: AuthStatus; screen: OnboardingScreen }): OnboardingTarget | null {
  switch (status) {
    case 'loading':
      return null;
    case 'signedOut':
      if (screen === 'profile') return '/(onboarding)/sign-in';
      if (screen === 'create' || screen === 'invite' || screen === 'notifications') return '/(onboarding)/welcome';
      return null;
    case 'needsProfile':
      return screen === 'profile' ? null : '/(onboarding)/profile';
    case 'ready': {
      if (!flow.inviteChecked) return null;
      const next = nextStepAfterProfile(flow);
      switch (screen) {
        case 'welcome':
        case 'sign-in':
        case 'profile':
          return next;
        case 'pick-challenge':
          // Davetle katılan kişi challenge seçmez
          return flow.joinedViaInvite ? next : null;
        case 'create':
          // Oluşturulunca (ya da seçim değiştiyse) sıradaki adıma
          return next === '/(onboarding)/create' ? null : next;
        case 'invite':
          return next === '/(onboarding)/invite' ? null : next;
        case 'notifications':
          return null;
      }
    }
  }
}

/** "Yeme-içme · 7 gün" (kategori adları Explore.dc.html çip listesiyle aynı; sözlükte `onboarding.categories`) */
export const templateMeta = (t: Messages, template: Template) =>
  `${t.onboarding.categories[template.category]} · ${t.common.days(template.defaultDurationDays)}`;

/** Kullanıcı adı sunucuya bu haliyle gider (baştaki @ ve büyük harf atılır) */
export const normalizeUsername = (value: string) => value.trim().replace(/^@/, '').toLowerCase();

/** Doğum yılı seçenekleri: bu yıldan geriye 100 yıl (yaş sınırı sunucuda denetlenir) */
export function birthYearOptions(now = new Date()) {
  const current = now.getFullYear();
  return Array.from({ length: 101 }, (_, i) => current - i);
}

/** Hata metni: ApiError zaten kullanıcı metni; değilse genel hata */
export const errorMessage = (error: unknown, t: Messages) =>
  error instanceof ApiError ? error.message : t.onboarding.genericError;

/** Cihazın saat dilimi (yerel gün hesabı sunucuda bu dilime göre yapılır) */
export function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul';
  } catch {
    return 'Europe/Istanbul';
  }
}
