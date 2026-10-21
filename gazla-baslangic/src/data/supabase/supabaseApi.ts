/**
 * Supabase uygulaması: `GazlaApi`'yi RPC'ler, tablo sorguları, Storage ve Auth ile karşılar.
 * Satırlar snake_case gelir, burada camelCase tiplere çevrilir. Kurallar sunucuda (RLS ve RPC);
 * burada iş kuralı yok.
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { AppState, Platform } from 'react-native';

import { pokeText } from '../../content/pokes';
import { ApiError, type GazlaApi, type OAuthProvider } from '../api';
import type {
  ActivityItem,
  AvatarTintKey,
  Badge,
  BoardMember,
  Challenge,
  ChallengeIconKey,
  ChallengeMembership,
  ChallengeTintKey,
  Checkin,
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
  TemplateStats,
  TodayTask,
  UserSettings,
} from '../types';

type Row = Record<string, any>;

const PROFILE_COLUMNS = 'id, username, display_name, avatar_path, avatar_tint, harsh_mode';
const PROOF_URL_TTL_SECONDS = 60 * 60;
const ACTIVITY_COLUMNS = `id, kind, challenge_id, friendship_id, payload, created_at, read_at,
  actor:profiles!notifications_actor_id_fkey(${PROFILE_COLUMNS}),
  challenge:challenges!notifications_challenge_fk(title),
  poke:pokes(message_key, tone)`;
const ACTIVITY_PAGE_SIZE = 30;

export function createSupabaseApi(url: string, anonKey: string): GazlaApi {
  const supabase: SupabaseClient = createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
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
    throw new ApiError(error?.message ?? 'Bir şeyler ters gitti', (error as PostgrestError | null)?.code ?? null);
  };

  async function rpc<T = any>(fn: string, args?: Row): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) fail(error);
    return data as T;
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

  const toProfile = (r: Row): Profile => ({
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    avatarUrl: avatarUrl(r.avatar_path),
    avatarTint: r.avatar_tint as AvatarTintKey,
    harshMode: r.harsh_mode,
  });

  const toLite = (r: Row): PersonLite => ({
    id: r.id ?? r.user_id,
    username: r.username,
    displayName: r.display_name,
    avatarUrl: avatarUrl(r.avatar_path),
    avatarTint: r.avatar_tint as AvatarTintKey,
  });

  const toNumber = (r: Row): NumberSettings | null =>
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
  const toChallenge = (r: Row): Challenge => ({
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

  const toActivity = (r: Row, messages: PokeMessage[]): ActivityItem => ({
    id: r.id,
    kind: r.kind,
    actor: r.actor ? toLite(r.actor) : null,
    challengeId: r.challenge_id,
    challengeTitle: r.challenge?.title ?? (r.payload?.title as string | undefined) ?? null,
    // Metin sabit listeden (src/content/pokes.ts); kaldırılmış mesaj için sunucudaki metin
    pokeText: r.poke
      ? (pokeText(r.poke.message_key, r.poke.tone) ??
        messages.find((m) => m.key === r.poke.message_key && m.tone === r.poke.tone)?.text ??
        null)
      : null,
    friendshipId: r.friendship_id,
    payload: r.payload ?? {},
    createdAt: r.created_at,
    readAt: r.read_at,
  });

  const toSession = (s: { user: { id: string; email?: string | null } } | null): Session | null =>
    s ? { userId: s.user.id, email: s.user.email ?? null } : null;

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
      const redirectTo = Linking.createURL('auth/callback');
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
        if (error) fail(error);
        return;
      }
      // Native: tarayıcıda oturum aç, dönüş adresindeki kodu oturuma çevir (PKCE).
      // Not: App Store için Apple girişi ileride expo-apple-authentication + signInWithIdToken'a taşınmalı.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) fail(error);
      const result = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
      if (result.type !== 'success') throw new ApiError('Giriş tamamlanmadı');
      const code = Linking.parse(result.url).queryParams?.code;
      if (typeof code !== 'string') throw new ApiError('Giriş tamamlanmadı');
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) fail(exchangeError);
    },
    async signInWithEmail(email) {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: Linking.createURL('auth/callback') },
      });
      if (error) fail(error);
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) fail(error);
    },
    async deleteAccount() {
      // Edge Function: Storage dosyalarını siler, auth.admin.deleteUser çağırır (supabase/README.md)
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error) fail(error);
      await supabase.auth.signOut();
    },

    // Profil ve ayarlar -------------------------------------------------------------------------
    async getMyProfile() {
      const id = await uid();
      const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', id).maybeSingle();
      if (error) fail(error);
      return data ? toProfile(data) : null;
    },
    isUsernameAvailable: (username) => rpc<boolean>('is_username_available', { p_username: username }),
    async completeProfile(input) {
      const row = await rpc<Row>('complete_profile', {
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
      const patch: Row = {};
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
      const patch: Row = {};
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

    // Bugün ve seri -----------------------------------------------------------------------------
    async getToday() {
      const rows = await rpc<Row[]>('my_today');
      return Promise.all(
        rows.map(async (r): Promise<TodayTask> => ({
          challengeId: r.challenge_id,
          title: r.title,
          shortTitle: r.short_title,
          taskType: r.task_type,
          icon: r.icon,
          tint: r.tint,
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
      const [r] = await rpc<Row[]>('my_streak');
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
      const rows = await rpc<Row[]>('my_recent_days', { p_days: days });
      return rows.map((r): RecentDay => ({ day: r.day, required: r.required, covered: r.covered, rescued: r.rescued, isOpen: r.is_open }));
    },
    async getPendingRescues() {
      const rows = await rpc<Row[]>('my_pending_rescues');
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
      const r = await rpc<Row>('checkin', {
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
    async declineRescue(challengeId, missedDate) {
      await rpc('decline_rescue', { p_challenge: challengeId, p_missed_date: missedDate });
    },
    async getUnseenFinished() {
      const rows = await rpc<Row[]>('my_unseen_finished');
      return rows.map((r): FinishedChallenge => ({
        challengeId: r.challenge_id,
        title: r.title,
        shortTitle: r.short_title,
        icon: r.icon,
        tint: r.tint,
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
        rpc<Row[]>('template_popularity'),
      ]);
      if (error) fail(error);
      const pick = (r: Row, field: string) => (lang === 'en' ? (r[`${field}_en`] ?? r[`${field}_tr`]) : r[`${field}_tr`]);
      const rank = new Map(popularity.map((p) => [p.template_id as string, p]));
      return (data ?? []).map((r): Template => ({
        id: r.id,
        slug: r.slug,
        title: pick(r, 'title'),
        shortTitle: pick(r, 'short_title'),
        description: pick(r, 'description'),
        category: r.category,
        difficulty: r.difficulty,
        taskType: r.task_type,
        defaultDurationDays: r.default_duration_days,
        icon: r.icon,
        tint: r.tint,
        number: toNumber(r),
        onboardingOrder: r.onboarding_order,
        featuredWeek: r.featured_week,
        activeCount: rank.get(r.id)?.active_count ?? 0,
        popularity: rank.get(r.id)?.popularity ?? (data ?? []).length,
      }));
    },
    async getTemplateStats(templateId) {
      const j = await rpc<Row>('template_stats', { p_template: templateId });
      return {
        activeCount: j.active_count,
        friendsCount: j.friends_count,
        friends: (j.friends ?? []).map((f: Row) => ({
          displayName: f.display_name,
          avatarUrl: avatarUrl(f.avatar_path),
          avatarTint: f.avatar_tint,
        })),
      } satisfies TemplateStats;
    },
    async getChallenge(challengeId) {
      const r = await rpc<Row | null>('challenge_detail', { p_challenge: challengeId });
      if (!r) throw new ApiError('Challenge bulunamadı', 'P0002');
      return toChallenge(r);
    },
    async getMyMembership(challengeId) {
      const r = await rpc<Row | null>('my_membership', { p_challenge: challengeId });
      return r ? toMembership(r) : null;
    },
    async setMyReminder(challengeId, time) {
      return toMembership(await rpc<Row>('set_my_reminder', { p_challenge: challengeId, p_time: time }));
    },
    async getNumberStats(challengeId, localDate) {
      const j = await rpc<Row>('number_stats', { p_challenge: challengeId, p_local_date: localDate ?? null });
      const num = (v: unknown) => (v == null ? null : Number(v));
      return {
        localDate: j.local_date,
        dayIndex: j.day_index,
        target: num(j.target),
        unit: j.unit,
        myValue: num(j.my_value),
        yesterday: num(j.yesterday_value),
        best: num(j.best_value),
        groupBest: j.group_best ? { value: Number(j.group_best.value), person: toLite(j.group_best) } : null,
      } satisfies NumberStats;
    },
    async getChallengeBoard(challengeId) {
      const rows = await rpc<Row[]>('challenge_board', { p_challenge: challengeId });
      return rows.map((r): BoardMember => ({
        ...toLite(r),
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
      const r = await rpc<Row>('create_challenge', {
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
    inviteToChallenge: (challengeId, userIds) => rpc<number>('invite_to_challenge', { p_challenge: challengeId, p_users: userIds }),
    async respondToInvite(challengeId, accept) {
      await rpc('respond_to_invite', { p_challenge: challengeId, p_accept: accept });
    },
    async leaveChallenge(challengeId) {
      await rpc('leave_challenge', { p_challenge: challengeId });
    },
    createInviteCode: (challengeId) => rpc<string>('create_invite', { p_challenge: challengeId }),
    async getInvitePreview(code) {
      const j = await rpc<Row | null>('get_invite_preview', { p_code: code });
      if (!j) return null;
      return {
        challengeId: j.challenge_id ?? null,
        inviter: { displayName: j.inviter.display_name, avatarUrl: avatarUrl(j.inviter.avatar_path), avatarTint: j.inviter.avatar_tint },
        challenge: {
          title: j.challenge.title,
          durationDays: j.challenge.duration_days,
          taskType: j.challenge.task_type,
          startDate: j.challenge.start_date,
          endDate: j.challenge.end_date,
          icon: j.challenge.icon,
          tint: j.challenge.tint,
          inviteMessage: j.challenge.invite_message,
        },
        memberCount: j.member_count,
        members: (j.members ?? []).map((m: Row) => ({ initial: m.initial, avatarTint: m.avatar_tint })),
        alreadyMember: j.already_member,
      } satisfies InvitePreview;
    },
    async joinByInvite(code) {
      const r = await rpc<Row>('join_challenge_by_invite', { p_code: code });
      return r.challenge_id as string;
    },
    async joinFriendChallenge(challengeId) {
      await rpc('join_friend_challenge', { p_challenge: challengeId });
      // Etkin hatırlatma saati grubun saatiyle birlikte my_membership'ten
      return (await api.getMyMembership(challengeId))!;
    },
    async getGarden() {
      const rows = await rpc<Row[]>('my_garden');
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
      }));
    },
    async getBadges() {
      const rows = await rpc<Row[]>('my_badges');
      return rows.map((r): Badge => ({
        key: r.key,
        sortOrder: r.sort_order,
        title: r.title,
        description: r.description,
        icon: r.icon,
        tint: r.tint,
        earnedAt: r.earned_at,
      }));
    },

    // Arkadaşlar ve sosyal ----------------------------------------------------------------------
    async getFriendsToday() {
      const rows = await rpc<Row[]>('friends_today');
      return rows.map((r): FriendToday => ({
        ...toLite(r),
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
      const rows = await rpc<Row[]>('friend_requests');
      return rows.map((r): FriendRequest => ({
        id: r.id,
        // r.id arkadaşlık satırının id'si; kişi user_id
        person: toLite({ ...r, id: r.user_id }),
        direction: r.direction,
        createdAt: r.created_at,
        mutualCount: r.mutual_count,
      }));
    },
    async searchProfiles(query) {
      const rows = await rpc<Row[]>('search_profiles', { p_query: query, p_limit: 20 });
      return rows.map((r) => ({
        ...toLite(r),
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
      const j = await rpc<Row | null>('friend_profile', { p_user: userId });
      if (!j) return null;
      return {
        ...toProfile({ ...j, id: j.user_id }),
        isFriend: j.is_friend,
        streak: j.streak,
        completedCount: j.completed_count,
        sharedChallenges: (j.shared_challenges ?? []).map((c: Row) => ({
          challengeId: c.challenge_id,
          title: c.title,
          icon: c.icon,
          tint: c.tint,
          durationDays: c.duration_days,
          dayIndex: c.day_index,
          daysDone: c.days_done,
        })),
        joinableChallenges: (j.joinable_challenges ?? []).map((c: Row): JoinableChallenge => ({
          challengeId: c.challenge_id,
          title: c.title,
          shortTitle: c.short_title,
          icon: c.icon,
          tint: c.tint,
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
      const [r] = await rpc<Row[]>('poke_status', { p_recipient: userId });
      return {
        harshMode: r.harsh_mode,
        sentToday: r.sent_today,
        dailyLimit: r.daily_limit,
        remaining: r.remaining,
      } satisfies PokeStatus;
    },
    async sendPoke(input) {
      const r = await rpc<Row>('send_poke', {
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
      const { data, error } = await supabase
        .from('notifications')
        .select(ACTIVITY_COLUMNS)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(100);
      if (error) fail(error);
      return (data ?? []).map((r: Row) => toActivity(r, messages));
    },
    async getActivityPage(params = {}) {
      const limit = Math.min(Math.max(params.limit ?? ACTIVITY_PAGE_SIZE, 1), 100);
      const messages = await api.getPokeMessages();
      let query = supabase
        .from('notifications')
        .select(ACTIVITY_COLUMNS)
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
      const rows = (data ?? []) as Row[];
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
        .select(`created_at, blocked:profiles!blocks_blocked_id_fkey(${PROFILE_COLUMNS})`)
        .order('created_at', { ascending: false });
      if (error) fail(error);
      // Engellerken görünmeyen kişinin profili gelmez (RLS); listede gösterilmez
      return (data ?? []).filter((r: Row) => r.blocked).map((r: Row) => ({ ...toLite(r.blocked), blockedAt: r.created_at }));
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

const toSettings = (r: Row): UserSettings => ({
  birthYear: r.birth_year,
  timezone: r.timezone,
  locale: r.locale,
  pokePushEnabled: r.poke_push_enabled,
  dailyReminderTime: hhmm(r.daily_reminder_time),
  discoverability: r.discoverability,
  dayEndGraceHours: r.day_end_grace_hours ?? 2,
});

const toCheckin = (r: Row, photoUrl: string | null): Checkin => ({
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
const toMembership = (r: Row): ChallengeMembership => ({
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
