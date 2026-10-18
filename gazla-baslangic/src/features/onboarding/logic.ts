import { ApiError, type AuthStatus, type ChallengeCategory, type Template } from '@/data';

/** (onboarding) grubundaki ekranlar (dosya adları) */
export type OnboardingScreen = 'index' | 'pick-challenge' | 'sign-in' | 'profile' | 'invite' | 'notifications';

type RedirectTarget =
  | '/(onboarding)'
  | '/(onboarding)/sign-in'
  | '/(onboarding)/profile'
  | '/(onboarding)/invite'
  | '/(onboarding)/notifications';

/** Girişten önceki adımlar (oturum açılınca geri dönülmez) */
const BEFORE_PROFILE: OnboardingScreen[] = ['index', 'pick-challenge', 'sign-in', 'profile'];

/**
 * Oturum durumuna göre kullanıcının olması gereken adım; zaten doğru yerdeyse null.
 * - Oturum yok: profil ve sonrası açılmaz.
 * - Oturum var, profil yok: her zaman Profil.
 * - Profil hazır (onboarding sürüyor): davet (şablon seçildiyse) ya da bildirim izni.
 */
export function onboardingRedirect({
  status,
  screen,
  pickedTemplateId,
  createdChallengeId,
}: {
  status: AuthStatus;
  screen: OnboardingScreen;
  pickedTemplateId: string | null;
  createdChallengeId: string | null;
}): RedirectTarget | null {
  switch (status) {
    case 'loading':
      return null;
    case 'signedOut':
      if (screen === 'profile') return '/(onboarding)/sign-in';
      if (screen === 'invite' || screen === 'notifications') return '/(onboarding)';
      return null;
    case 'needsProfile':
      return screen === 'profile' ? null : '/(onboarding)/profile';
    case 'ready': {
      // "Kendim oluşturacağım": davet edilecek challenge yok, davet adımı atlanır
      const hasChallenge = !!pickedTemplateId || !!createdChallengeId;
      if (BEFORE_PROFILE.includes(screen)) return hasChallenge ? '/(onboarding)/invite' : '/(onboarding)/notifications';
      if (screen === 'invite' && !hasChallenge) return '/(onboarding)/notifications';
      return null;
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
