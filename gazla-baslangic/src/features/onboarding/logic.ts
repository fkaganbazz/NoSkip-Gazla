import { ApiError, type AuthStatus, type ChallengeCategory, type Template } from '@/data';

/** (onboarding) grubundaki ekranlar (dosya adları) */
export type OnboardingScreen =
  | 'index'
  | 'pick-challenge'
  | 'sign-in'
  | 'profile'
  | 'create'
  | 'invite'
  | 'notifications';

export type OnboardingTarget =
  | '/(onboarding)'
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
      if (screen === 'create' || screen === 'invite' || screen === 'notifications') return '/(onboarding)';
      return null;
    case 'needsProfile':
      return screen === 'profile' ? null : '/(onboarding)/profile';
    case 'ready': {
      if (!flow.inviteChecked) return null;
      const next = nextStepAfterProfile(flow);
      switch (screen) {
        case 'index':
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

/** Kategori adları (Explore.dc.html çip listesi) */
export const categoryLabels: Record<ChallengeCategory, string> = {
  detox: 'Detoks',
  social_courage: 'Sosyal cesaret',
  sport: 'Spor',
  food_drink: 'Yeme-içme',
  reading: 'Okuma',
  money: 'Para',
  quirky: 'Tuhaf',
};

/** PickChallenge şablonları: yalnızca onboarding sırası olanlar, sırasıyla */
export const onboardingTemplates = (templates: Template[]) =>
  templates
    .filter((t) => t.onboardingOrder !== null)
    .sort((a, b) => (a.onboardingOrder ?? 0) - (b.onboardingOrder ?? 0));

/** "Yeme-içme · 7 gün" */
export const templateMeta = (t: Template) => `${categoryLabels[t.category]} · ${t.defaultDurationDays} gün`;

/** Kullanıcı adı sunucuya bu haliyle gider (baştaki @ ve büyük harf atılır) */
export const normalizeUsername = (value: string) => value.trim().replace(/^@/, '').toLowerCase();

/** Doğum yılı seçenekleri: bu yıldan geriye 100 yıl (yaş sınırı sunucuda denetlenir) */
export function birthYearOptions(now = new Date()) {
  const current = now.getFullYear();
  return Array.from({ length: 101 }, (_, i) => current - i);
}

/** Hata metni: ApiError zaten Türkçe kullanıcı metni */
export const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Bir şeyler ters gitti. Bağlantını kontrol edip tekrar dene.';

/** Cihazın saat dilimi (yerel gün hesabı sunucuda bu dilime göre yapılır) */
export function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul';
  } catch {
    return 'Europe/Istanbul';
  }
}
