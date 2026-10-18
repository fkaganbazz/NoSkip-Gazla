/**
 * Uygulamanın veri sözleşmesi. Her metot bir Supabase RPC'sine, tablo sorgusuna ya da Auth/Storage
 * çağrısına karşılık gelir (yorumda adı yazılı). İki uygulaması var: `mock/mockApi.ts` (örnek veri,
 * bellekte) ve `supabase/supabaseApi.ts`. Hangisinin kullanılacağına `client.ts` karar verir.
 *
 * Hatalar `ApiError` olarak fırlatılır; `message` kullanıcıya gösterilebilir Türkçe metindir
 * (Supabase'te RPC'lerin `raise exception` mesajı).
 */
import type {
  ActivityItem,
  BlockedUser,
  BoardMember,
  Challenge,
  ChallengeCalendar,
  ChallengeMembership,
  Checkin,
  CheckinInput,
  CompleteProfileInput,
  CreateChallengeInput,
  FriendProfile,
  FriendRequest,
  FriendToday,
  GardenItem,
  InvitePreview,
  LocalDate,
  PendingRescue,
  Poke,
  PokeMessage,
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

export type OAuthProvider = 'apple' | 'google';

export interface GazlaApi {
  /** 'mock' ya da 'supabase' — geliştirme ekranında gösterilir */
  readonly kind: 'mock' | 'supabase';

  // Oturum (Supabase Auth) ---------------------------------------------------------------------
  getSession(): Promise<Session | null>;
  onSessionChange(listener: (session: Session | null) => void): () => void;
  /** auth.signInWithOAuth / signInWithIdToken */
  signInWithProvider(provider: OAuthProvider): Promise<void>;
  /** auth.signInWithOtp (e-posta bağlantısı) */
  signInWithEmail(email: string): Promise<void>;
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
  /** register_push_token */
  registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void>;

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

  // Challenge -----------------------------------------------------------------------------------
  /** challenge_templates (etkin olanlar) */
  getTemplates(): Promise<Template[]>;
  /** template_stats */
  getTemplateStats(templateId: string): Promise<TemplateStats>;
  /** challenges (üye olunanlar) */
  getChallenge(challengeId: string): Promise<Challenge>;
  /** challenge_members (kendi satırı) */
  getMyMembership(challengeId: string): Promise<ChallengeMembership | null>;
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
  /** my_garden */
  getGarden(): Promise<GardenItem[]>;

  // Arkadaşlar ve sosyal ------------------------------------------------------------------------
  /** friends_today */
  getFriendsToday(): Promise<FriendToday[]>;
  /** friendships (bekleyen) + profiles */
  getFriendRequests(): Promise<FriendRequest[]>;
  /** search_profiles */
  searchProfiles(query: string): Promise<SearchResult[]>;
  /** send_friend_request */
  sendFriendRequest(userId: string): Promise<void>;
  /** accept_friend_request */
  acceptFriendRequest(friendshipId: string): Promise<void>;
  /** friendships delete (reddet, geri çek, arkadaşlıktan çıkar) */
  removeFriendship(userId: string): Promise<void>;
  /** friend_profile */
  getFriendProfile(userId: string): Promise<FriendProfile | null>;
  /** poke_messages */
  getPokeMessages(): Promise<PokeMessage[]>;
  /** send_poke */
  sendPoke(input: SendPokeInput): Promise<Poke>;
  /** pokes delete (30 sn içinde geri al) */
  undoPoke(pokeId: string): Promise<void>;
  /** notifications (+ aktör profili, dürtme metni) */
  getActivity(): Promise<ActivityItem[]>;
  /** mark_notifications_read */
  markActivityRead(ids?: string[]): Promise<void>;
  /** blocks */
  getBlockedUsers(): Promise<BlockedUser[]>;
  blockUser(userId: string): Promise<void>;
  unblockUser(userId: string): Promise<void>;
  /** submit_report */
  submitReport(input: ReportInput): Promise<void>;
}
