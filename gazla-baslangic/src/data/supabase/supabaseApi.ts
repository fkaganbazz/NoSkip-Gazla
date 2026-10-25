/**
 * Supabase uygulaması: `GazlaApi`'yi RPC'ler, tablo sorguları, Storage ve Auth ile karşılar.
 * Satırlar snake_case gelir, burada camelCase tiplere çevrilir. Kurallar sunucuda (RLS ve RPC);
 * burada iş kuralı yok.
 *
 * Tipler `src/types/database.ts`'ten (`npm run gen:types`, supabase/README.md "Tipler"): istemci
 * `createClient<Database>`, RPC adları/parametreleri/dönüşleri ve tablo sorguları derleyicide denetlenir.
 * jsonb dönen RPC'lerin içi şemada görünmez; şekilleri aşağıda (`*Json`), migration'daki
 * `jsonb_build_object` alanlarıyla aynı.
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createClient,
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
  type PostgrestError,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { pokeText } from '../../content/pokes';
import type { Database, Json, Tables, TablesUpdate } from '../../types/database';
import { ApiError, ApiErrorCode, isNetworkError, NetworkError, type GazlaApi, type OAuthProvider } from '../api';
import { AUTH_NOT_COMPLETED, authError } from '../authRedirect';
import { authRedirectUrl, completeAuthRedirect, signInWithProvider, signOutNativeProviders } from './nativeAuth';
import type {
  ActivityItem,
  AvatarTintKey,
  Badge,
  BadgeIconKey,
  BadgeKey,
  BadgeTintKey,
  BoardMember,
  Challenge,
  ChallengeIconKey,
  ChallengeMembership,
  ChallengeStatus,
  ChallengeTintKey,
  Checkin,
  DayEndGraceHours,
  FinishedChallenge,
  FriendRequest,
  FriendToday,
  GardenItem,
  InvitePreview,
  JoinableChallenge,
  Locale,
  NumberSettings,
  NumberStats,
  PendingRescue,
  PersonLite,
  PokeMessage,
  PokeStatus,
  Profile,
  RecentDay,
  Session,
  StreakSummary,
  Template,
  TemplateDuration,
  TemplateStats,
  TodayTask,
  UserSettings,
} from '../types';

// Şema tipleri -------------------------------------------------------------------------------------

type PublicFunctions = Database['public']['Functions'];
type RpcName = keyof PublicFunctions;
type RpcArgs<F extends RpcName> = PublicFunctions[F]['Args'];
type RpcReturns<F extends RpcName> = PublicFunctions[F]['Returns'];
/**
 * SQL fonksiyon parametreleri NULL alabilir; üretilen tipler bunu yazmaz. null gönderilen parametre
 * NULL olur (varsayılanı varsa da varsayılan değil NULL kullanılır), verilmeyen parametre varsayılanını alır.
 */
type NullableArgs<A> = { [K in keyof A]: A[K] | null };
/** Parametresiz ya da tüm parametreleri varsayılanlı fonksiyonda argüman nesnesi verilmeyebilir */
type RpcParams<F extends RpcName> = {} extends RpcArgs<F>
  ? [args?: NullableArgs<RpcArgs<F>>]
  : [args: NullableArgs<RpcArgs<F>>];

/** `profiles` satırının istemcinin okuduğu sütunları (PROFILE_COLUMNS) */
type ProfileRow = Pick<
  Tables<'profiles'>,
  'id' | 'username' | 'display_name' | 'avatar_path' | 'avatar_tint' | 'harsh_mode'
>;
/** Kişi satırı: profil alanları; kimlik sütunu RPC'ye göre `id` ya da `user_id` (toLite'a ayrıca verilir) */
type PersonRow = Pick<ProfileRow, 'username' | 'display_name' | 'avatar_path' | 'avatar_tint'>;
type FacePile = Pick<ProfileRow, 'display_name' | 'avatar_path' | 'avatar_tint'>;
type NumberColumns = Pick<
  Tables<'challenges'>,
  'number_unit' | 'number_base_target' | 'number_daily_increment' | 'number_step' | 'number_max'
>;
/** `challenges.end_date` üretilmiş sütun (start_date + süre − 1): şemada null olabilir görünür, olmaz */
type ChallengeJson = Omit<Tables<'challenges'>, 'end_date'> & { end_date: string };

/** challenge_detail: to_jsonb(challenges) + kullanıcıya göre durum, gün no, aktif üye sayısı */
type ChallengeDetailJson = ChallengeJson & { status: ChallengeStatus; day_index: number; member_count: number };

/** my_membership / set_my_reminder: app.membership_json (reminder_time etkin saat) */
type MembershipJson = Pick<
  Tables<'challenge_members'>,
  | 'challenge_id'
  | 'user_id'
  | 'role'
  | 'status'
  | 'invited_by'
  | 'joined_on'
  | 'left_on'
  | 'finished_at'
  | 'final_days_done'
  | 'final_required_days'
  | 'final_rescues'
  | 'final_rank'
  | 'finish_seen_at'
> & { personal_reminder_time: string | null; reminder_time: string | null };

/** number_stats */
type NumberStatsJson = {
  local_date: string;
  day_index: number;
  target: number | null;
  unit: string | null;
  my_value: number | null;
  yesterday_value: number | null;
  best_value: number | null;
  group_best: (PersonRow & { value: number; user_id: string }) | null;
};

/** template_stats */
type TemplateStatsJson = { active_count: number; friends_count: number; friends: FacePile[] };

/** get_invite_preview */
type InvitePreviewJson = {
  challenge_id: string | null;
  inviter: FacePile;
  challenge: Pick<
    ChallengeJson,
    'title' | 'duration_days' | 'task_type' | 'start_date' | 'end_date' | 'icon' | 'tint' | 'invite_message'
  >;
  member_count: number;
  members: { initial: string; avatar_tint: string }[];
  already_member: boolean;
};

/** friend_profile */
type FriendProfileJson = Omit<ProfileRow, 'id'> & {
  user_id: string;
  is_friend: boolean;
  streak: number;
  completed_count: number;
  shared_challenges: (Pick<ChallengeJson, 'title' | 'icon' | 'tint' | 'duration_days'> & {
    challenge_id: string;
    day_index: number;
    days_done: number;
  })[];
  joinable_challenges: (Pick<
    ChallengeJson,
    'title' | 'short_title' | 'icon' | 'tint' | 'task_type' | 'duration_days' | 'start_date' | 'end_date'
  > & { challenge_id: string; day_index: number; member_count: number })[];
};

const PROFILE_COLUMNS = 'id, username, display_name, avatar_path, avatar_tint, harsh_mode';
const PROOF_URL_TTL_SECONDS = 60 * 60;
const ACTIVITY_COLUMNS = `id, kind, challenge_id, friendship_id, payload, created_at, read_at,
  actor:profiles!notifications_actor_id_fkey(${PROFILE_COLUMNS}),
  challenge:challenges!notifications_challenge_fk(title),
  poke:pokes(message_key, tone)` as const;
const ACTIVITY_PAGE_SIZE = 30;

export function createSupabaseApi(url: string, anonKey: string): GazlaApi {
  const supabase: SupabaseClient<Database> = createClient<Database>(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // E-posta bağlantısı ve tarayıcı akışı kodla döner (PKCE); kodu her platformda auth/callback ekranı
      // oturuma çevirir (web'de de: istemcinin adresten kendiliğinden okuması kapalı, kod iki kez çevrilmesin)
      flowType: 'pkce',
      detectSessionInUrl: false,
    },
  });

  // Uygulama ön plandayken oturum yenilensin (Supabase RN önerisi)
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
  }

  // Yardımcılar ---------------------------------------------------------------------------------

  const fail = (error: PostgrestError | { message: string; code?: string } | null): never => {
    if (isFetchFailure(error)) throw new NetworkError();
    throw new ApiError(error?.message ?? 'Bir şeyler ters gitti', (error as PostgrestError | null)?.code ?? null);
  };

  /**
   * İstek sunucuya ulaşmadı: postgrest fetch hatasını `code: ''` ve "TypeError: …" iletisiyle
   * döndürür; Storage ise asıl hatayı `StorageUnknownError` içinde saklar.
   */
  function isFetchFailure(error: { message: string; code?: string; name?: string; originalError?: unknown } | null) {
    if (!error) return false;
    if (error.name === 'StorageUnknownError') return isNetworkError(error.originalError);
    return !error.code && /^(TypeError|FetchError|AbortError|TimeoutError)\b/.test(error.message);
  }

  /** `public` RPC'si: ad, parametreler ve dönüş `Database['public']['Functions']`'tan */
  async function rpc<F extends RpcName>(fn: F, ...[args]: RpcParams<F>): Promise<RpcReturns<F>> {
    const { data, error } = await supabase.rpc(fn, args as RpcArgs<F>);
    if (error) fail(error);
    return data as RpcReturns<F>;
  }

  async function uid(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new ApiError('Oturum açman gerekiyor', '42501');
    return id;
  }

  const avatarUrl = (path: string | null) =>
    path ? supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl : null;

  async function proofUrl(path: string | null) {
    if (!path) return null;
    const { data } = await supabase.storage.from('proofs').createSignedUrl(path, PROOF_URL_TTL_SECONDS);
    return data?.signedUrl ?? null;
  }

  /** Dosya adı: harf, rakam, tire (Storage politikaları ve CHECK kısıtları bunu ister) */
  const fileName = (uri: string) => {
    const ext = (uri.split('?')[0].split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `${id}.${ext === 'jpeg' || ext.length > 5 ? 'jpg' : ext}`;
  };

  async function upload(bucket: 'proofs' | 'avatars', path: string, uri: string) {
    const blob = await (await fetch(uri)).arrayBuffer();
    const contentType = path.endsWith('.png') ? 'image/png' : path.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
    const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType, upsert: false });
    if (error) fail(error);
    return path;
  }

  const toProfile = (r: ProfileRow): Profile => ({
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    avatarUrl: avatarUrl(r.avatar_path),
    avatarTint: r.avatar_tint as AvatarTintKey,
    harshMode: r.harsh_mode,
  });

  /** `id`: kişinin kimliği (satıra göre `id` ya da `user_id`) */
  const toLite = (r: PersonRow, id: string): PersonLite => ({
    id,
    username: r.username,
    displayName: r.display_name,
    avatarUrl: avatarUrl(r.avatar_path),
    avatarTint: r.avatar_tint as AvatarTintKey,
  });

  const toFace = (r: FacePile) => ({
    displayName: r.display_name,
    avatarUrl: avatarUrl(r.avatar_path),
    avatarTint: r.avatar_tint as AvatarTintKey,
  });

  const toNumber = (r: NumberColumns): NumberSettings | null =>
    r.number_unit
      ? {
          unit: r.number_unit,
          baseTarget: Number(r.number_base_target),
          dailyIncrement: Number(r.number_daily_increment),
          step: Number(r.number_step),
          max: r.number_max == null ? null : Number(r.number_max),
        }
      : null;

  /** challenge_detail satırı (challenges + status, day_index, member_count) */
  const toChallenge = (r: ChallengeDetailJson): Challenge => ({
    id: r.id,
    templateId: r.template_id,
    createdBy: r.created_by,
    title: r.title,
    shortTitle: r.short_title,
    taskType: r.task_type,
    durationDays: r.duration_days,
    startDate: r.start_date,
    endDate: r.end_date,
    reminderTime: hhmm(r.reminder_time),
    inviteMessage: r.invite_message,
    category: r.category,
    icon: r.icon as ChallengeIconKey,
    tint: r.tint as ChallengeTintKey,
    number: toNumber(r),
    visibility: r.visibility ?? 'invited',
    status: r.status,
    dayIndex: r.day_index,
    memberCount: r.member_count,
  });

  type ActivityRow = NonNullable<Awaited<ReturnType<typeof activityQuery>>['data']>[number];
  const activityQuery = () => supabase.from('notifications').select(ACTIVITY_COLUMNS);

  const toActivity = (r: ActivityRow, messages: PokeMessage[]): ActivityItem => {
    const payload = jsonObject(r.payload);
    const poke = r.poke;
    return {
      id: r.id,
      kind: r.kind,
      actor: r.actor ? toLite(r.actor, r.actor.id) : null,
      challengeId: r.challenge_id,
      challengeTitle: r.challenge?.title ?? (payload.title as string | undefined) ?? null,
      // Metin sabit listeden (src/content/pokes.ts); kaldırılmış mesaj için sunucudaki metin
      pokeText: poke
        ? (pokeText(poke.message_key, poke.tone) ??
          messages.find((m) => m.key === poke.message_key && m.tone === poke.tone)?.text ??
          null)
        : null,
      friendshipId: r.friendship_id,
      payload,
      createdAt: r.created_at,
      readAt: r.read_at,
    };
  };

  const nameHint = (meta: Record<string, unknown> | undefined): string | null => {
    const value = [meta?.full_name, meta?.name, meta?.given_name].find((v) => typeof v === 'string' && v.trim());
    return typeof value === 'string' ? value.trim() : null;
  };

  const toSession = (
    s: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } } | null,
  ): Session | null =>
    s ? { userId: s.user.id, email: s.user.email ?? null, displayNameHint: nameHint(s.user.user_metadata) } : null;

  let localeCache: Locale | null = null;
  async function locale(): Promise<Locale> {
    if (localeCache) return localeCache;
    const { data } = await supabase.auth.getSession();
    if (!data.session) return 'tr';
    const { data: s } = await supabase.from('user_settings').select('locale').maybeSingle();
    localeCache = (s?.locale as Locale) ?? 'tr';
    return localeCache;
  }

  let pokeMessagesCache: PokeMessage[] | null = null;

  const api: GazlaApi = {
    kind: 'supabase',

    // Oturum ----------------------------------------------------------------------------------
    async getSession() {
      const { data } = await supabase.auth.getSession();
      return toSession(data.session);
    },
    onSessionChange(listener) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        localeCache = null;
        listener(toSession(session));
      });
      return () => data.subscription.unsubscribe();
    },
    async signInWithProvider(provider: OAuthProvider) {
      // iOS'ta Apple ve Google native (signInWithIdToken); native yoksa OAuth tarayıcı akışı (nativeAuth.ts)
      await signInWithProvider(supabase, provider);
    },
    async signInWithEmail(email) {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: authRedirectUrl() },
      });
      if (error) throw authError(error, 'E-posta gönderilemedi. Biraz sonra tekrar dene.');
    },
    async completeAuthRedirect(params) {
      if (await completeAuthRedirect(supabase, params)) return;
      // Kod yok: iOS'ta tarayıcı dönüşü uygulamaya değil openAuthSessionAsync'e gider; oturum açıksa sorun yok
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new ApiError(AUTH_NOT_COMPLETED);
    },
    async signOut() {
      await signOutNativeProviders();
      const { error } = await supabase.auth.signOut();
      if (error) fail(error);
    },
    async deleteAccount() {
      // Edge Function supabase/functions/delete-account: JWT'den kullanıcı, Storage dosyaları
      // (proofs/{uid}, avatars/{uid}), auth.admin.deleteUser. Hata gövdesindeki `error` Türkçe metindir.
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error) {
        if (error instanceof FunctionsHttpError) {
          const body = await (error.context as Response).json().catch(() => null);
          throw new ApiError(
            typeof body?.error === 'string' ? body.error : 'Hesap silinemedi. Biraz sonra tekrar dene.',
            String((error.context as Response).status),
          );
        }
        if (error instanceof FunctionsFetchError) throw new NetworkError();
        if (error instanceof FunctionsRelayError) throw new ApiError('Hesap şu an silinemiyor. Biraz sonra tekrar dene.');
        fail(error);
      }
      // Kullanıcı ve oturumları sunucuda silindi: yalnızca cihazdaki oturumu kapat
      await signOutNativeProviders();
      await supabase.auth.signOut({ scope: 'local' });
    },

    // Profil ve ayarlar -------------------------------------------------------------------------
    async getMyProfile() {
      const id = await uid();
      const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', id).maybeSingle();
      if (error) fail(error);
      return data ? toProfile(data) : null;
    },
    isUsernameAvailable: (username) => rpc('is_username_available', { p_username: username }),
    async completeProfile(input) {
      const row = await rpc('complete_profile', {
        p_username: input.username,
        p_display_name: input.displayName,
        p_birth_year: input.birthYear,
        p_timezone: input.timezone,
        p_locale: input.locale ?? null,
      });
      return toProfile(row);
    },
    async updateProfile(update) {
      const id = await uid();
      const patch: TablesUpdate<'profiles'> = {};
      if (update.username !== undefined) patch.username = update.username;
      if (update.displayName !== undefined) patch.display_name = update.displayName;
      if (update.avatarTint !== undefined) patch.avatar_tint = update.avatarTint;
      if (update.harshMode !== undefined) patch.harsh_mode = update.harshMode;
      if (update.avatarFileUri !== undefined) {
        patch.avatar_path = update.avatarFileUri
          ? await upload('avatars', `${id}/${fileName(update.avatarFileUri)}`, update.avatarFileUri)
          : null;
      }
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select(PROFILE_COLUMNS).single();
      if (error) fail(error);
      return toProfile(data!);
    },
    async getMySettings() {
      await uid();
      const { data, error } = await supabase.from('user_settings').select('*').single();
      if (error) fail(error);
      return toSettings(data!);
    },
    async updateSettings(update) {
      const id = await uid();
      const patch: TablesUpdate<'user_settings'> = {};
      if (update.timezone !== undefined) patch.timezone = update.timezone;
      if (update.locale !== undefined) patch.locale = update.locale;
      if (update.pokePushEnabled !== undefined) patch.poke_push_enabled = update.pokePushEnabled;
      if (update.dailyReminderTime !== undefined) patch.daily_reminder_time = update.dailyReminderTime;
      if (update.discoverability !== undefined) patch.discoverability = update.discoverability;
      if (update.dayEndGraceHours !== undefined) patch.day_end_grace_hours = update.dayEndGraceHours;
      const { data, error } = await supabase.from('user_settings').update(patch).eq('user_id', id).select('*').single();
      if (error) fail(error);
      localeCache = null;
      return toSettings(data!);
    },
    async registerPushToken(token, platform) {
      await rpc('register_push_token', { p_token: token, p_platform: platform });
    },
    async unregisterPushToken(token) {
      const id = await uid();
      const { error } = await supabase.from('push_tokens').delete().eq('user_id', id).eq('token', token);
      if (error) fail(error);
    },

    // Bugün ve seri -----------------------------------------------------------------------------
    async getToday() {
      const rows = await rpc('my_today');
      return Promise.all(
        rows.map(async (r): Promise<TodayTask> => ({
          challengeId: r.challenge_id,
          title: r.title,
          shortTitle: r.short_title,
          taskType: r.task_type,
          icon: r.icon as ChallengeIconKey,
          tint: r.tint as ChallengeTintKey,
          localDate: r.local_date,
          dayIndex: r.day_index,
          durationDays: r.duration_days,
          done: r.done,
          value: r.value == null ? null : Number(r.value),
          photoUrl: await proofUrl(r.photo_path),
          note: r.note,
          target: r.target == null ? null : Number(r.target),
          numberUnit: r.number_unit,
          memberCount: r.member_count,
        })),
      );
    },
    async getStreak() {
      const [r] = await rpc('my_streak');
      return {
        currentStreak: r.current_streak,
        longestStreak: r.longest_streak,
        stage: r.stage,
        wilted: r.wilted,
        doneToday: r.done_today,
        totalToday: r.total_today,
        freeRescueAvailable: r.free_rescue_available,
      } satisfies StreakSummary;
    },
    async getRecentDays(days = 7) {
      const rows = await rpc('my_recent_days', { p_days: days });
      return rows.map((r): RecentDay => ({ day: r.day, required: r.required, covered: r.covered, rescued: r.rescued, isOpen: r.is_open }));
    },
    async getPendingRescues() {
      const rows = await rpc('my_pending_rescues');
      return rows.map((r): PendingRescue => ({
        challengeId: r.challenge_id,
        title: r.title,
        missedDate: r.missed_date,
        streakBefore: r.streak_before,
        expiresAt: r.expires_at,
        freeRescueAvailable: r.free_rescue_available,
      }));
    },
    async checkin(input) {
      const id = await uid();
      const photoPath = input.photoFileUri
        ? await upload('proofs', `${id}/${input.challengeId}/${fileName(input.photoFileUri)}`, input.photoFileUri)
        : null;
      const r = await rpc('checkin', {
        p_challenge: input.challengeId,
        p_value: input.value ?? null,
        p_photo_path: photoPath,
        p_note: input.note ?? null,
        p_local_date: input.localDate ?? null,
      });
      return toCheckin(r, await proofUrl(r.photo_path));
    },
    async undoCheckin(challengeId, localDate) {
      await rpc('undo_checkin', { p_challenge: challengeId, p_local_date: localDate ?? null });
    },
    async rescueWithFreeRight(challengeId, missedDate) {
      await rpc('rescue_streak', { p_challenge: challengeId, p_missed_date: missedDate });
    },
    async rescueWithAd(challengeId, missedDate) {
      // Ödülü sunucu doğrular (admob-ssv → grant_ad_rescue); burada yalnızca sonuç okunur:
      // 'granted' | 'pending' ya da reddin hatası (süre geçti …)
      const result = await rpc('ad_rescue_result', { p_challenge: challengeId, p_missed_date: missedDate });
      if (result === 'granted') return;
      throw new ApiError('Reklam ödülü henüz doğrulanmadı. Birazdan tekrar dene.', ApiErrorCode.adRewardPending);
    },
    async declineRescue(challengeId, missedDate) {
      await rpc('decline_rescue', { p_challenge: challengeId, p_missed_date: missedDate });
    },
    async getUnseenFinished() {
      const rows = await rpc('my_unseen_finished');
      return rows.map((r): FinishedChallenge => ({
        challengeId: r.challenge_id,
        title: r.title,
        shortTitle: r.short_title,
        icon: r.icon as ChallengeIconKey,
        tint: r.tint as ChallengeTintKey,
        taskType: r.task_type,
        durationDays: r.duration_days,
        requiredDays: r.required_days,
        daysDone: r.days_done,
        rescues: r.rescues,
        rank: r.rank,
        completed: r.completed,
        stage: r.stage,
        finishedAt: r.finished_at,
      }));
    },
    async markFinishSeen(challengeId) {
      await rpc('mark_finish_seen', { p_challenge: challengeId });
    },

    // Challenge ---------------------------------------------------------------------------------
    async getTemplates() {
      const lang = await locale();
      const [{ data, error }, popularity] = await Promise.all([
        supabase
          .from('challenge_templates')
          .select('*')
          .eq('is_active', true)
          .order('onboarding_order', { ascending: true, nullsFirst: false }),
        rpc('template_popularity'),
      ]);
      if (error) fail(error);
      const en = lang === 'en';
      const rank = new Map(popularity.map((p) => [p.template_id, p]));
      return (data ?? []).map((r): Template => ({
        id: r.id,
        slug: r.slug,
        title: en ? (r.title_en ?? r.title_tr) : r.title_tr,
        shortTitle: en ? (r.short_title_en ?? r.short_title_tr) : r.short_title_tr,
        description: en ? (r.description_en ?? r.description_tr) : r.description_tr,
        category: r.category,
        difficulty: r.difficulty,
        taskType: r.task_type,
        // 7/10/30 (challenge_templates CHECK kısıtları)
        defaultDurationDays: r.default_duration_days as TemplateDuration,
        allowedDurations: [...(r.allowed_durations ?? [r.default_duration_days])].sort(
          (a: number, b: number) => a - b,
        ) as TemplateDuration[],
        icon: r.icon as ChallengeIconKey,
        tint: r.tint as ChallengeTintKey,
        number: toNumber(r),
        onboardingOrder: r.onboarding_order,
        featuredWeek: r.featured_week,
        activeCount: rank.get(r.id)?.active_count ?? 0,
        popularity: rank.get(r.id)?.popularity ?? (data ?? []).length,
      }));
    },
    async getTemplateStats(templateId) {
      const j = (await rpc('template_stats', { p_template: templateId })) as TemplateStatsJson;
      return {
        activeCount: j.active_count,
        friendsCount: j.friends_count,
        friends: (j.friends ?? []).map(toFace),
      } satisfies TemplateStats;
    },
    async getChallenge(challengeId) {
      const r = (await rpc('challenge_detail', { p_challenge: challengeId })) as ChallengeDetailJson | null;
      if (!r) throw new ApiError('Challenge bulunamadı', 'P0002');
      return toChallenge(r);
    },
    async getMyMembership(challengeId) {
      const r = (await rpc('my_membership', { p_challenge: challengeId })) as MembershipJson | null;
      return r ? toMembership(r) : null;
    },
    async setMyReminder(challengeId, time) {
      return toMembership((await rpc('set_my_reminder', { p_challenge: challengeId, p_time: time })) as MembershipJson);
    },
    async getNumberStats(challengeId, localDate) {
      const j = (await rpc('number_stats', {
        p_challenge: challengeId,
        p_local_date: localDate ?? null,
      })) as NumberStatsJson;
      const num = (v: unknown) => (v == null ? null : Number(v));
      return {
        localDate: j.local_date,
        dayIndex: j.day_index,
        target: num(j.target),
        unit: j.unit,
        myValue: num(j.my_value),
        yesterday: num(j.yesterday_value),
        best: num(j.best_value),
        groupBest: j.group_best
          ? { value: Number(j.group_best.value), person: toLite(j.group_best, j.group_best.user_id) }
          : null,
      } satisfies NumberStats;
    },
    async getChallengeBoard(challengeId) {
      const rows = await rpc('challenge_board', { p_challenge: challengeId });
      return rows.map((r): BoardMember => ({
        ...toLite(r, r.user_id),
        role: r.role,
        streak: r.streak,
        daysDone: r.days_done,
        doneToday: r.done_today,
        rank: r.rank,
      }));
    },
    async getChallengeCalendar(challengeId) {
      const id = await uid();
      const [checkins, rescues] = await Promise.all([
        supabase.from('checkins').select('*').eq('challenge_id', challengeId).eq('user_id', id),
        supabase.from('streak_rescues').select('challenge_id, rescued_date, method').eq('challenge_id', challengeId).eq('user_id', id),
      ]);
      if (checkins.error) fail(checkins.error);
      if (rescues.error) fail(rescues.error);
      return {
        checkins: (checkins.data ?? []).map((r) => toCheckin(r, null)),
        rescues: (rescues.data ?? []).map((r) => ({ challengeId: r.challenge_id, rescuedDate: r.rescued_date, method: r.method })),
      };
    },
    async createChallenge(input) {
      const r = await rpc('create_challenge', {
        p_visibility: input.visibility ?? 'invited',
        p_template: input.templateId ?? null,
        p_title: input.title ?? null,
        p_task_type: input.taskType ?? null,
        p_duration_days: input.durationDays ?? null,
        p_start_date: input.startDate ?? null,
        p_reminder_time: input.reminderTime ?? null,
        p_invite_message: input.inviteMessage ?? null,
        p_number_unit: input.number?.unit ?? null,
        p_number_base_target: input.number?.baseTarget ?? null,
        p_number_daily_increment: input.number?.dailyIncrement ?? 0,
        p_number_step: input.number?.step ?? null,
        p_number_max: input.number?.max ?? null,
        p_invitees: input.inviteeIds ?? [],
      });
      // Durum, gün numarası ve üye sayısı sunucudan (challenge_detail)
      return api.getChallenge(r.id);
    },
    inviteToChallenge: (challengeId, userIds) => rpc('invite_to_challenge', { p_challenge: challengeId, p_users: userIds }),
    async respondToInvite(challengeId, accept) {
      await rpc('respond_to_invite', { p_challenge: challengeId, p_accept: accept });
    },
    async leaveChallenge(challengeId) {
      await rpc('leave_challenge', { p_challenge: challengeId });
    },
    createInviteCode: (challengeId) => rpc('create_invite', { p_challenge: challengeId }),
    async getInvitePreview(code) {
      const j = (await rpc('get_invite_preview', { p_code: code })) as InvitePreviewJson | null;
      if (!j) return null;
      return {
        challengeId: j.challenge_id ?? null,
        inviter: toFace(j.inviter),
        challenge: {
          title: j.challenge.title,
          durationDays: j.challenge.duration_days,
          taskType: j.challenge.task_type,
          startDate: j.challenge.start_date,
          endDate: j.challenge.end_date,
          icon: j.challenge.icon as ChallengeIconKey,
          tint: j.challenge.tint as ChallengeTintKey,
          inviteMessage: j.challenge.invite_message,
        },
        memberCount: j.member_count,
        members: (j.members ?? []).map((m) => ({ initial: m.initial, avatarTint: m.avatar_tint as AvatarTintKey })),
        alreadyMember: j.already_member,
      } satisfies InvitePreview;
    },
    async joinByInvite(code) {
      const r = await rpc('join_challenge_by_invite', { p_code: code });
      return r.challenge_id;
    },
    async joinFriendChallenge(challengeId) {
      await rpc('join_friend_challenge', { p_challenge: challengeId });
      // Etkin hatırlatma saati grubun saatiyle birlikte my_membership'ten
      return (await api.getMyMembership(challengeId))!;
    },
    async getGarden() {
      const rows = await rpc('my_garden');
      return rows.map((r): GardenItem => ({
        challengeId: r.challenge_id,
        title: r.title,
        shortTitle: r.short_title,
        durationDays: r.duration_days,
        requiredDays: r.required_days,
        stage: r.stage,
        finishedAt: r.finished_at,
        finalRescues: r.final_rescues,
        finalRank: r.final_rank,
        longestStreak: r.longest_streak,
        isLongest: r.is_longest,
      }));
    },
    async getBadges() {
      const rows = await rpc('my_badges');
      return rows.map((r): Badge => ({
        // Katalog anahtarları, ikon ve renk anahtarları badges CHECK kısıtlarıyla aynı
        key: r.key as BadgeKey,
        sortOrder: r.sort_order,
        title: r.title,
        description: r.description,
        icon: r.icon as BadgeIconKey,
        tint: r.tint as BadgeTintKey,
        earnedAt: r.earned_at,
      }));
    },

    // Arkadaşlar ve sosyal ----------------------------------------------------------------------
    async getFriendsToday() {
      const rows = await rpc('friends_today');
      return rows.map((r): FriendToday => ({
        ...toLite(r, r.user_id),
        harshMode: r.harsh_mode,
        streak: r.streak,
        doneToday: r.done_today,
        activeChallenges: r.active_challenges,
        sharedChallengeId: r.shared_challenge_id,
        sharedChallengeTitle: r.shared_challenge_title,
        challengeShortTitle: r.shared_challenge_short_title,
      }));
    },
    async getFriendRequests() {
      const rows = await rpc('friend_requests');
      return rows.map((r): FriendRequest => ({
        id: r.id,
        // r.id arkadaşlık satırının id'si; kişi user_id
        person: toLite(r, r.user_id),
        direction: r.direction as FriendRequest['direction'],
        createdAt: r.created_at,
        mutualCount: r.mutual_count,
      }));
    },
    async searchProfiles(query) {
      const rows = await rpc('search_profiles', { p_query: query, p_limit: 20 });
      return rows.map((r) => ({
        ...toLite(r, r.id),
        isFriend: r.is_friend,
        requestPending: r.request_pending,
        mutualCount: r.mutual_count,
      }));
    },
    async findContacts(emailHashes) {
      const hashes = [...new Set(emailHashes.map((h) => h.trim().toLowerCase()))];
      if (hashes.length === 0) return [];
      const rows = await rpc('find_contacts', { p_email_hashes: hashes });
      return rows.map((r) => ({
        ...toLite(r, r.id),
        isFriend: r.is_friend,
        requestPending: r.request_pending,
        mutualCount: r.mutual_count,
      }));
    },
    async sendFriendRequest(userId) {
      await rpc('send_friend_request', { p_user: userId });
    },
    async acceptFriendRequest(friendshipId) {
      await rpc('accept_friend_request', { p_friendship: friendshipId });
    },
    async removeFriendship(userId) {
      const id = await uid();
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${id})`);
      if (error) fail(error);
    },
    async getFriendProfile(userId) {
      const j = (await rpc('friend_profile', { p_user: userId })) as FriendProfileJson | null;
      if (!j) return null;
      return {
        ...toProfile({ ...j, id: j.user_id }),
        isFriend: j.is_friend,
        streak: j.streak,
        completedCount: j.completed_count,
        sharedChallenges: (j.shared_challenges ?? []).map((c) => ({
          challengeId: c.challenge_id,
          title: c.title,
          icon: c.icon as ChallengeIconKey,
          tint: c.tint as ChallengeTintKey,
          durationDays: c.duration_days,
          dayIndex: c.day_index,
          daysDone: c.days_done,
        })),
        joinableChallenges: (j.joinable_challenges ?? []).map((c): JoinableChallenge => ({
          challengeId: c.challenge_id,
          title: c.title,
          shortTitle: c.short_title,
          icon: c.icon as ChallengeIconKey,
          tint: c.tint as ChallengeTintKey,
          taskType: c.task_type,
          durationDays: c.duration_days,
          startDate: c.start_date,
          endDate: c.end_date,
          dayIndex: c.day_index,
          memberCount: c.member_count,
        })),
      };
    },
    async getPokeMessages() {
      if (pokeMessagesCache) return pokeMessagesCache;
      const lang = await locale();
      const { data, error } = await supabase.from('poke_messages').select('*').order('tone').order('sort_order');
      if (error) fail(error);
      pokeMessagesCache = (data ?? []).map((r) => ({
        key: r.key,
        tone: r.tone,
        sortOrder: r.sort_order,
        text: lang === 'en' ? (r.text_en ?? r.text_tr) : r.text_tr,
        isActive: r.is_active,
      }));
      return pokeMessagesCache;
    },
    async getPokeStatus(userId) {
      const [r] = await rpc('poke_status', { p_recipient: userId });
      return {
        harshMode: r.harsh_mode,
        sentToday: r.sent_today,
        dailyLimit: r.daily_limit,
        remaining: r.remaining,
      } satisfies PokeStatus;
    },
    async sendPoke(input) {
      const r = await rpc('send_poke', {
        p_recipient: input.recipientId,
        p_tone: input.tone,
        p_message_key: input.messageKey,
        p_challenge: input.challengeId ?? null,
      });
      return {
        id: r.id,
        senderId: r.sender_id,
        recipientId: r.recipient_id,
        challengeId: r.challenge_id,
        tone: r.tone,
        messageKey: r.message_key,
        createdAt: r.created_at,
      };
    },
    async undoPoke(pokeId) {
      const { error, count } = await supabase.from('pokes').delete({ count: 'exact' }).eq('id', pokeId);
      if (error) fail(error);
      if (!count) throw new ApiError('Geri alma süresi doldu', 'P0001');
    },
    async getActivity() {
      const messages = await api.getPokeMessages();
      const { data, error } = await activityQuery()
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(100);
      if (error) fail(error);
      return (data ?? []).map((r) => toActivity(r, messages));
    },
    async getActivityPage(params = {}) {
      const limit = Math.min(Math.max(params.limit ?? ACTIVITY_PAGE_SIZE, 1), 100);
      const messages = await api.getPokeMessages();
      let query = activityQuery()
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1);
      if (params.before) {
        // İmleç: "zaman|id" — aynı anda oluşan satırlar da atlanmadan sıralı gelir
        const [at, id] = params.before.split('|');
        query = query.or(`created_at.lt."${at}",and(created_at.eq."${at}",id.lt.${id})`);
      }
      const { data, error } = await query;
      if (error) fail(error);
      const rows = data ?? [];
      const items = rows.slice(0, limit).map((r) => toActivity(r, messages));
      const last = items[items.length - 1];
      return { items, nextCursor: rows.length > limit && last ? `${last.createdAt}|${last.id}` : null };
    },
    async getUnreadCount() {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null);
      if (error) fail(error);
      return count ?? 0;
    },
    async markActivityRead(ids) {
      await rpc('mark_notifications_read', { p_ids: ids ?? null });
    },
    async getBlockedUsers() {
      const { data, error } = await supabase
        .from('blocks')
        .select(`created_at, blocked:profiles!blocks_blocked_id_fkey(${PROFILE_COLUMNS})` as const)
        .order('created_at', { ascending: false });
      if (error) fail(error);
      // Engellerken görünmeyen kişinin profili gelmez (RLS); listede gösterilmez
      return (data ?? []).flatMap((r) =>
        r.blocked ? [{ ...toLite(r.blocked, r.blocked.id), blockedAt: r.created_at }] : [],
      );
    },
    async blockUser(userId) {
      const id = await uid();
      const { error } = await supabase.from('blocks').insert({ blocker_id: id, blocked_id: userId });
      if (error && error.code !== '23505') fail(error);
    },
    async unblockUser(userId) {
      const id = await uid();
      const { error } = await supabase.from('blocks').delete().eq('blocker_id', id).eq('blocked_id', userId);
      if (error) fail(error);
    },
    async submitReport(input) {
      await rpc('submit_report', {
        p_user: input.userId ?? null,
        p_reason: input.reason,
        p_details: input.details ?? null,
        p_also_block: input.alsoBlock ?? false,
        p_target: input.target,
        p_checkin: input.checkinId ?? null,
        p_challenge: input.challengeId ?? null,
        p_invite_code: input.inviteCode ?? null,
      });
    },
  };

  return api;
}

/** Postgres time ('HH:MM:SS') → 'HH:MM' */
const hhmm = (v: unknown) => (v ? String(v).slice(0, 5) : null);

/** jsonb nesnesi (notifications.payload her zaman nesne; değilse boş) */
const jsonObject = (v: Json | undefined): { [key: string]: Json | undefined } =>
  v && typeof v === 'object' && !Array.isArray(v) ? v : {};

const toSettings = (r: Tables<'user_settings'>): UserSettings => ({
  birthYear: r.birth_year,
  timezone: r.timezone,
  locale: r.locale as Locale,
  pokePushEnabled: r.poke_push_enabled,
  dailyReminderTime: hhmm(r.daily_reminder_time),
  discoverability: r.discoverability,
  // 0/1/2 (user_settings CHECK)
  dayEndGraceHours: (r.day_end_grace_hours ?? 2) as DayEndGraceHours,
});

/** checkins satırı (tablo ya da checkin RPC'si) */
const toCheckin = (r: Tables<'checkins'>, photoUrl: string | null): Checkin => ({
  id: r.id,
  challengeId: r.challenge_id,
  userId: r.user_id,
  localDate: r.local_date,
  value: r.value == null ? null : Number(r.value),
  photoUrl,
  note: r.note,
  createdAt: r.created_at,
});

/** my_membership / set_my_reminder satırı (kişisel alanlarla) */
const toMembership = (r: MembershipJson): ChallengeMembership => ({
  challengeId: r.challenge_id,
  userId: r.user_id,
  role: r.role,
  status: r.status,
  invitedBy: r.invited_by,
  joinedOn: r.joined_on,
  leftOn: r.left_on,
  finishedAt: r.finished_at,
  finalDaysDone: r.final_days_done,
  finalRequiredDays: r.final_required_days,
  finalRescues: r.final_rescues,
  finalRank: r.final_rank,
  reminderTime: hhmm(r.reminder_time),
  personalReminderTime: hhmm(r.personal_reminder_time),
  finishSeenAt: r.finish_seen_at ?? null,
});
