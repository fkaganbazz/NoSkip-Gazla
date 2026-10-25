/**
 * Uygulamanın veri sözleşmesi. Her metot bir Supabase RPC'sine, tablo sorgusuna ya da Auth/Storage
 * çağrısına karşılık gelir (yorumda adı yazılı). İki uygulaması var: `mock/mockApi.ts` (örnek veri,
 * bellekte) ve `supabase/supabaseApi.ts`. Hangisinin kullanılacağına `client.ts` karar verir.
 *
 * Hatalar `ApiError` olarak fırlatılır; `message` kullanıcıya gösterilebilir Türkçe metindir
 * (Supabase'te RPC'lerin `raise exception` mesajı).
 */
import type { AuthRedirectParams } from './authRedirect';
import type {
  ActivityItem,
  ActivityPage,
  ActivityPageParams,
  Badge,
  BlockedUser,
  BoardMember,
  Challenge,
  ChallengeCalendar,
  ChallengeMembership,
  Checkin,
  CheckinInput,
  CompleteProfileInput,
  CreateChallengeInput,
  FinishedChallenge,
  FriendProfile,
  FriendRequest,
  FriendToday,
  GardenItem,
  InvitePreview,
  LocalDate,
  NumberStats,
  PendingRescue,
  Poke,
  PokeMessage,
  PokeStatus,
  Profile,
  ProfileUpdate,
  RecentDay,
  ReportInput,
  SearchResult,
  SendPokeInput,
  Session,
  SettingsUpdate,
  StreakSummary,
  Template,
  TemplateStats,
  TodayTask,
  UserSettings,
} from './types';

export class ApiError extends Error {
  /** Postgres SQLSTATE (ör. P0001 iş kuralı, P0002 bulunamadı, 42501 yetki) */
  code: string | null;

  constructor(message: string, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * İstek sunucuya ulaşmadı (çevrimdışı, bağlantı koptu, zaman aşımı). İş kuralı hatası değildir:
 * çevrimdışı kuyruk bu hatada işlemi saklar ve bağlantı gelince yeniden dener. `ApiError`'dan
 * türer ki ekranlar `message`'ı yine Türkçe gösterebilsin; ayırt etmek için `isNetworkError`.
 */
export class NetworkError extends ApiError {
  constructor(message = 'İnternet bağlantısı yok. Bağlanınca tekrar dene.') {
    super(message, 'NETWORK');
    this.name = 'NetworkError';
  }
}

/** fetch'in ağ hatası metinleri: RN, Chrome, Safari, Firefox */
const FETCH_FAILURE = /network request failed|failed to fetch|load failed|networkerror|network error|timed? ?out/i;

/** Hata ağdan mı (yeniden denenebilir), yoksa sunucunun cevabı mı (ApiError) */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof ApiError) return false;
  if (!(error instanceof Error)) return false;
  if (error.name === 'AbortError' || error.name === 'TimeoutError') return true;
  return error instanceof TypeError && FETCH_FAILURE.test(error.message);
}

export type OAuthProvider = 'apple' | 'google';

/** Özel `ApiError.code` değerleri (SQLSTATE dışı) */
export const ApiErrorCode = {
  /** Kullanıcı Apple/Google giriş penceresini kapattı: gösterilecek hata değil */
  cancelled: 'CANCELLED',
  /** Reklam ödülü henüz sunucuda doğrulanmadı (AdMob SSV gelmedi): kısa aralıklarla yeniden dene */
  adRewardPending: 'AD_REWARD_PENDING',
} as const;

/** Kullanıcı girişi iptal etti (`ApiError` kodu 'CANCELLED') */
export const isCancelledError = (error: unknown): boolean =>
  error instanceof ApiError && error.code === ApiErrorCode.cancelled;

/** Reklam ödülü doğrulaması bekleniyor (`ApiError` kodu 'AD_REWARD_PENDING') */
export const isAdRewardPendingError = (error: unknown): boolean =>
  error instanceof ApiError && error.code === ApiErrorCode.adRewardPending;

export interface GazlaApi {
  /** 'mock' ya da 'supabase' — geliştirme ekranında gösterilir */
  readonly kind: 'mock' | 'supabase';

  // Oturum (Supabase Auth) ---------------------------------------------------------------------
  getSession(): Promise<Session | null>;
  onSessionChange(listener: (session: Session | null) => void): () => void;
  /**
   * iOS'ta Apple: expo-apple-authentication + `auth.signInWithIdToken` (nonce); Google: google-signin
   * idToken + `auth.signInWithIdToken`. Native modül yoksa (web, Android'de Apple) `auth.signInWithOAuth`
   * tarayıcı akışı. Kullanıcı pencereyi kapatırsa `ApiError` kodu 'CANCELLED' (`isCancelledError`).
   */
  signInWithProvider(provider: OAuthProvider): Promise<void>;
  /** auth.signInWithOtp (e-posta bağlantısı; `gazla://auth/callback`'e döner) */
  signInWithEmail(email: string): Promise<void>;
  /**
   * Giriş dönüşü (`app/auth/callback.tsx`): adresteki PKCE kodunu `auth.exchangeCodeForSession` ile oturuma
   * çevirir. Adreste hata varsa Türkçe `ApiError` (`access_denied`: 'CANCELLED'); kod yoksa ve oturum da
   * açık değilse hata.
   */
  completeAuthRedirect(params: AuthRedirectParams): Promise<void>;
  signOut(): Promise<void>;
  /** Edge Function `delete-account` (Storage dosyaları + auth.admin.deleteUser) */
  deleteAccount(): Promise<void>;

  // Profil ve ayarlar ---------------------------------------------------------------------------
  /** profiles (kendi satırı); profil tamamlanmadıysa null */
  getMyProfile(): Promise<Profile | null>;
  /** is_username_available */
  isUsernameAvailable(username: string): Promise<boolean>;
  /** complete_profile */
  completeProfile(input: CompleteProfileInput): Promise<Profile>;
  /** profiles update (+ avatars yükleme) */
  updateProfile(update: ProfileUpdate): Promise<Profile>;
  /** user_settings (kendi satırı) */
  getMySettings(): Promise<UserSettings>;
  updateSettings(update: SettingsUpdate): Promise<UserSettings>;
  /** register_push_token (Expo push token; aynı token başka hesaptaysa bu hesaba geçer) */
  registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void>;
  /** push_tokens delete (kendi satırı) — çıkışta bu cihazın token'ı silinir */
  unregisterPushToken(token: string): Promise<void>;

  // Bugün ve seri -------------------------------------------------------------------------------
  /** my_today */
  getToday(): Promise<TodayTask[]>;
  /** my_streak */
  getStreak(): Promise<StreakSummary>;
  /** my_recent_days */
  getRecentDays(days?: number): Promise<RecentDay[]>;
  /** my_pending_rescues */
  getPendingRescues(): Promise<PendingRescue[]>;
  /** checkin (fotoğraf görevinde önce proofs kovasına yükler) */
  checkin(input: CheckinInput): Promise<Checkin>;
  /** undo_checkin */
  undoCheckin(challengeId: string, localDate?: LocalDate): Promise<void>;
  /** rescue_streak (ücretsiz hak) */
  rescueWithFreeRight(challengeId: string, missedDate: LocalDate): Promise<void>;
  /**
   * Reklamla kurtarma. Ödül AdMob SSV ile sunucuda doğrulanır (Edge Function `admob-ssv` →
   * `grant_ad_rescue`); bu çağrı yalnızca sonucu okur: gün 'ad' yöntemiyle kurtarıldıysa başarı,
   * doğrulama henüz gelmediyse `ApiError` kodu 'AD_REWARD_PENDING' (`isAdRewardPendingError`),
   * sunucu ödülü reddettiyse (süre geçti …) o hata. Mock'ta hemen kurtarır.
   */
  rescueWithAd(challengeId: string, missedDate: LocalDate): Promise<void>;
  /** decline_rescue — StreakLost "Baştan başla": bekleyen kurtarma kapanır, seri sıfırdan devam */
  declineRescue(challengeId: string, missedDate: LocalDate): Promise<void>;
  /** my_unseen_finished — Bugün açılışında bir kez gösterilecek bitmiş challenge'lar */
  getUnseenFinished(): Promise<FinishedChallenge[]>;
  /** mark_finish_seen — "Challenge bitti" gösterildi (cihaz değişse de tekrar gösterilmez) */
  markFinishSeen(challengeId: string): Promise<void>;

  // Challenge -----------------------------------------------------------------------------------
  /** challenge_templates (etkin olanlar, onboarding sırası) + template_popularity */
  getTemplates(): Promise<Template[]>;
  /** template_stats */
  getTemplateStats(templateId: string): Promise<TemplateStats>;
  /** challenge_detail (üye olunanlar; "Arkadaşlarım" görünürlükte arkadaşın challenge'ı) + durum, gün no */
  getChallenge(challengeId: string): Promise<Challenge>;
  /** my_membership (kendi satırı; kişisel hatırlatma saati dahil) */
  getMyMembership(challengeId: string): Promise<ChallengeMembership | null>;
  /** set_my_reminder — kişisel hatırlatma saati 'HH:MM'; null = grubun saati */
  setMyReminder(challengeId: string, time: string | null): Promise<ChallengeMembership>;
  /** number_stats — NumberEntry "Dün / En iyin / Grupta en iyi" */
  getNumberStats(challengeId: string, localDate?: LocalDate): Promise<NumberStats>;
  /** challenge_board */
  getChallengeBoard(challengeId: string): Promise<BoardMember[]>;
  /** checkins + streak_rescues (kendi satırları) */
  getChallengeCalendar(challengeId: string): Promise<ChallengeCalendar>;
  /** create_challenge */
  createChallenge(input: CreateChallengeInput): Promise<Challenge>;
  /** invite_to_challenge */
  inviteToChallenge(challengeId: string, userIds: string[]): Promise<number>;
  /** respond_to_invite */
  respondToInvite(challengeId: string, accept: boolean): Promise<void>;
  /** leave_challenge */
  leaveChallenge(challengeId: string): Promise<void>;
  /** create_invite → davet kodu */
  createInviteCode(challengeId: string): Promise<string>;
  /** get_invite_preview (oturumsuz da çalışır) */
  getInvitePreview(code: string): Promise<InvitePreview | null>;
  /** join_challenge_by_invite → challenge id */
  joinByInvite(code: string): Promise<string>;
  /** join_friend_challenge — arkadaşın "Arkadaşlarım" challenge'ına davetsiz katıl */
  joinFriendChallenge(challengeId: string): Promise<ChallengeMembership>;
  /** my_garden */
  getGarden(): Promise<GardenItem[]>;
  /** my_badges — tüm rozetler, kazanılanlarda earnedAt */
  getBadges(): Promise<Badge[]>;

  // Arkadaşlar ve sosyal ------------------------------------------------------------------------
  /** friends_today */
  getFriendsToday(): Promise<FriendToday[]>;
  /** friend_requests (bekleyen, ortak arkadaş sayısıyla) */
  getFriendRequests(): Promise<FriendRequest[]>;
  /** search_profiles */
  searchProfiles(query: string): Promise<SearchResult[]>;
  /**
   * find_contacts — rehberdeki e-postaların SHA-256 özetleri (küçük harf hex; e-posta kırpılıp
   * küçük harfe çevrilerek, `hashEmail`). Yalnızca keşfedilebilir (`discoverability`) kullanıcılar;
   * engelliler ve kendin hariç. En fazla 500 özet gönderilir, en çok 100 sonuç.
   */
  findContacts(emailHashes: string[]): Promise<SearchResult[]>;
  /** send_friend_request */
  sendFriendRequest(userId: string): Promise<void>;
  /** accept_friend_request */
  acceptFriendRequest(friendshipId: string): Promise<void>;
  /** friendships delete (reddet, geri çek, arkadaşlıktan çıkar) */
  removeFriendship(userId: string): Promise<void>;
  /** friend_profile */
  getFriendProfile(userId: string): Promise<FriendProfile | null>;
  /** poke_messages (ekranlar `usePoke().messages` ile src/content/pokes.ts listesini kullanır) */
  getPokeMessages(): Promise<PokeMessage[]>;
  /** poke_status — alıcıya bugün gönderilen ve kalan dürtme hakkı */
  getPokeStatus(userId: string): Promise<PokeStatus>;
  /** send_poke */
  sendPoke(input: SendPokeInput): Promise<Poke>;
  /** pokes delete (30 sn içinde geri al) */
  undoPoke(pokeId: string): Promise<void>;
  /** notifications (+ aktör profili, dürtme metni) — en yeni 100 */
  getActivity(): Promise<ActivityItem[]>;
  /** notifications, sayfalı (varsayılan 30'ar, en yeniden eskiye) */
  getActivityPage(params?: ActivityPageParams): Promise<ActivityPage>;
  /** notifications (okunmamış sayısı; Bugün zil rozeti) */
  getUnreadCount(): Promise<number>;
  /** mark_notifications_read */
  markActivityRead(ids?: string[]): Promise<void>;
  /** blocks */
  getBlockedUsers(): Promise<BlockedUser[]>;
  blockUser(userId: string): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  /** submit_report */
  submitReport(input: ReportInput): Promise<void>;
}
