/**
 * Ekranların veri kancaları (TanStack Query). Okumalar `useX`, yazmalar `useXMutation`.
 * Her yazma, etkilediği okumaları yeniler; Bugün'deki işaretleme iyimser güncellenir
 * (dokunur dokunmaz değişir, sunucu reddederse geri alınır). Çevrimdışıyken işaretleme ve geri
 * alma kuyruğa girer (`offlineQueue.ts`), bağlantı gelince gönderilir.
 */
import {
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';

import { POKE_MESSAGES } from '../content/pokes';
import { AD_RESCUE_RETRY_DELAYS_MS } from './adRescue';
import { isAdRewardPendingError, isCancelledError, isNetworkError, type OAuthProvider } from './api';
import { api } from './client';
import { forgetSession } from './lastSession';
import { forgetPushToken, rememberPushToken, savedPushToken } from './pushToken';
import { isOnline } from './network';
import {
  adjustRecentDays,
  adjustStreak,
  deviceLocalDate,
  enqueueCheckinOp,
  isCheckinQueued,
  patchCalendarCheckins,
  patchTask,
  queuedCheckin,
  reflectCalendar,
  reflectRecentDays,
  reflectStreak,
  reflectToday,
  type CheckinOp,
} from './offlineQueue';
import { DAILY_KEYS, queryKeys } from './queryKeys';
import type {
  ChallengeCalendar,
  CheckinInput,
  CompleteProfileInput,
  CreateChallengeInput,
  FinishedChallenge,
  LocalDate,
  PokeMessage,
  ProfileUpdate,
  RecentDay,
  ReportInput,
  SendPokeInput,
  SettingsUpdate,
  StreakSummary,
  Template,
  TodayTask,
} from './types';

export { queryKeys } from './queryKeys';

/** Bir yazmadan sonra yenilenecek ortak gruplar */
const DAILY = DAILY_KEYS;
const SOCIAL: QueryKey[] = [['friends'], ['activity'], ['blocked']];

function useWrite<TInput, TResult>(fn: (input: TInput) => Promise<TResult>, invalidate: QueryKey[]) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => Promise.all(invalidate.map((queryKey) => client.invalidateQueries({ queryKey }))),
  });
}

// Profil ve ayarlar ------------------------------------------------------------------------------

export const useMySettings = () => useQuery({ queryKey: queryKeys.settings, queryFn: () => api.getMySettings() });

export const useUsernameAvailable = (username: string) =>
  useQuery({
    queryKey: ['usernameAvailable', username],
    queryFn: () => api.isUsernameAvailable(username),
    enabled: username.trim().length >= 3,
  });

export const useCompleteProfileMutation = () =>
  useWrite((input: CompleteProfileInput) => api.completeProfile(input), [['me']]);

export const useUpdateProfileMutation = () => useWrite((update: ProfileUpdate) => api.updateProfile(update), [['me'], ['friends']]);

/**
 * Bildirim izni verildikten sonra Expo push token'ını kaydet: `mutate({ token, platform })`.
 * Token bu cihazda saklanır; çıkışta sunucudan silinir (`useSignOutMutation`).
 */
export const useRegisterPushTokenMutation = () =>
  useMutation({
    mutationFn: async ({ token, platform }: { token: string; platform: 'ios' | 'android' }) => {
      await api.registerPushToken(token, platform);
      rememberPushToken({ token, platform });
    },
  });

export const useUpdateSettingsMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (update: SettingsUpdate) => api.updateSettings(update),
    onSuccess: (settings) => client.setQueryData(queryKeys.settings, settings),
  });
};

// Oturum -------------------------------------------------------------------------------------------

/**
 * Apple / Google ile giriş. Kullanıcı pencereyi kapatırsa hata değil: sonuç `'cancelled'`
 * (oturum açılınca route korumaları ilerletir, sonuç `'signedIn'`).
 */
export const useSignInWithProviderMutation = () =>
  useMutation({
    mutationFn: async (provider: OAuthProvider): Promise<'signedIn' | 'cancelled'> => {
      try {
        await api.signInWithProvider(provider);
        return 'signedIn';
      } catch (error) {
        if (isCancelledError(error)) return 'cancelled';
        throw error;
      }
    },
  });

export const useSignInWithEmailMutation = () => useMutation({ mutationFn: (email: string) => api.signInWithEmail(email) });

/** Çıkışta bu cihazın push token'ını sunucudan sil; ağ yoksa ya da yavaşsa çıkışı bekletme */
const UNREGISTER_TIMEOUT_MS = 4000;

async function unregisterDevicePushToken() {
  const saved = savedPushToken();
  if (!saved) return;
  try {
    await Promise.race([
      api.unregisterPushToken(saved.token),
      new Promise((resolve) => setTimeout(resolve, UNREGISTER_TIMEOUT_MS)),
    ]);
  } catch {
    // Silinemezse sunucu bir sonraki register_push_token'da token'ı yeni hesaba taşır
  } finally {
    forgetPushToken();
  }
}

// Bilerek çıkış: kayıtlı oturum önce unutulur (yoksa çevrimdışı çıkış yok sayılırdı, lastSession.ts)
export const useSignOutMutation = () =>
  useMutation({
    mutationFn: async () => {
      forgetSession();
      await unregisterDevicePushToken();
      return api.signOut();
    },
  });

/** Hesap silme (Edge Function `delete-account`); push token satırı zincirleme silinir */
export const useDeleteAccountMutation = () =>
  useMutation({
    mutationFn: async () => {
      forgetSession();
      await api.deleteAccount();
      forgetPushToken();
    },
  });

// Bugün ve seri -------------------------------------------------------------------------------------

/** Bugün: sunucudaki liste + çevrimdışı kuyruktaki bekleyen işaretlemeler */
export const useToday = () =>
  useQuery({ queryKey: queryKeys.today, queryFn: async () => reflectToday(await api.getToday()) });

/** Seri özeti: bugünün bekleyen işaretlemeleri tamam sayısına (ve hepsi bittiyse seriye) yansır */
export const useStreak = () =>
  useQuery({ queryKey: queryKeys.streak, queryFn: async () => reflectStreak(await api.getStreak()) });

/** Son günler sorgusu (Completion haftası); DataProvider açılışta önden çeker ki çevrimdışı da açılsın */
export const recentDaysQuery = (days = 7) =>
  queryOptions({
    queryKey: queryKeys.recentDays(days),
    queryFn: async () => reflectRecentDays(await api.getRecentDays(days)),
  });

export const useRecentDays = (days = 7) => useQuery(recentDaysQuery(days));

export const usePendingRescues = () =>
  useQuery({ queryKey: queryKeys.pendingRescues, queryFn: () => api.getPendingRescues() });

const RECENT_DAYS = ['me', 'recentDays'];

type UndoCheckinInput = { challengeId: string; localDate?: LocalDate };

type CheckinSnapshot = {
  today: TodayTask[] | undefined;
  streak: StreakSummary | undefined;
  calendar: ChallengeCalendar | undefined;
  recentDays: [QueryKey, RecentDay[] | undefined][];
};

/** onMutate → mutationFn: sabitlenen gün ve işlemden önceki durum (değişken nesnesine bağlı) */
const prepared = new WeakMap<object, { localDate: LocalDate; wasDone: boolean }>();

/** Gün verilmezse Bugün'deki satırının günü (toleransta en yenisi), yoksa cihazın bugünü */
function resolveLocalDate(client: QueryClient, challengeId: string, localDate?: LocalDate): LocalDate {
  if (localDate) return localDate;
  const days = (client.getQueryData<TodayTask[]>(queryKeys.today) ?? [])
    .filter((t) => t.challengeId === challengeId)
    .map((t) => t.localDate)
    .sort();
  return days[days.length - 1] ?? deviceLocalDate();
}

/** İyimser güncelleme: Bugün satırı, seri özeti ve takvim ağ beklemeden değişir */
async function applyCheckinOptimistic(client: QueryClient, op: CheckinOp) {
  const calendarKey = queryKeys.calendar(op.challengeId);
  await Promise.all([
    client.cancelQueries({ queryKey: queryKeys.today }),
    client.cancelQueries({ queryKey: queryKeys.streak }),
    client.cancelQueries({ queryKey: calendarKey, exact: true }),
    client.cancelQueries({ queryKey: RECENT_DAYS }),
  ]);
  const previous: CheckinSnapshot = {
    today: client.getQueryData<TodayTask[]>(queryKeys.today),
    streak: client.getQueryData<StreakSummary>(queryKeys.streak),
    calendar: client.getQueryData<ChallengeCalendar>(calendarKey),
    recentDays: client.getQueriesData<RecentDay[]>({ queryKey: RECENT_DAYS }),
  };
  const isDay = (t: TodayTask) => t.challengeId === op.challengeId && t.localDate === op.localDate;
  const task = previous.today?.find(isDay);
  const wasDone = task ? task.done : op.kind === 'undo';
  const delta = Number(op.kind === 'checkin') - Number(wasDone);
  client.setQueryData<TodayTask[]>(queryKeys.today, (tasks) => tasks?.map((t) => (isDay(t) ? patchTask(t, op) : t)));
  if (op.localDate === deviceLocalDate()) {
    client.setQueryData<StreakSummary>(queryKeys.streak, (s) => s && adjustStreak(s, delta));
  }
  client.setQueriesData<RecentDay[]>({ queryKey: RECENT_DAYS }, (days) => days && adjustRecentDays(days, op.localDate, delta));
  client.setQueryData<ChallengeCalendar>(calendarKey, (c) => c && { ...c, checkins: patchCalendarCheckins(c.checkins, op) });
  return { previous, wasDone };
}

function rollback(client: QueryClient, challengeId: string, previous: CheckinSnapshot | undefined) {
  if (!previous) return;
  client.setQueryData(queryKeys.today, previous.today);
  client.setQueryData(queryKeys.streak, previous.streak);
  client.setQueryData(queryKeys.calendar(challengeId), previous.calendar);
  previous.recentDays.forEach(([key, days]) => client.setQueryData(key, days));
}

/**
 * Sunucuya gönder; çevrimdışıysa, bu gün kuyrukta bekliyorsa (sıra bozulmasın) ya da istek ağ
 * hatasıyla düşerse kuyruğa yaz ve başarılı say. Sunucu reddederse (ApiError) hata döner.
 */
async function sendOrQueue<T>(op: CheckinOp, wasDone: boolean, send: () => Promise<T>, queued: () => T): Promise<T> {
  if (!isOnline() || isCheckinQueued(op.challengeId, op.localDate)) {
    enqueueCheckinOp(op, wasDone);
    return queued();
  }
  try {
    return await send();
  } catch (error) {
    if (!isNetworkError(error) && isOnline()) throw error;
    enqueueCheckinOp(op, wasDone, isOnline() ? 'network' : 'offline');
    return queued();
  }
}

/** Kuyrukta bekleyen gün sunucuya gitmedi: yenileme kuyruk boşalınca yapılır */
function invalidateUnlessQueued(client: QueryClient, challengeId: string, localDate: LocalDate | undefined) {
  if (localDate && isCheckinQueued(challengeId, localDate)) return undefined;
  return Promise.all(DAILY.map((queryKey) => client.invalidateQueries({ queryKey })));
}

/**
 * İşaretleme: Bugün listesi, seri özeti ve takvim hemen tamam görünür. Çevrimdışıyken (ya da ağ
 * hatasında) işlem kuyruğa girer, hata gösterilmez; sonuç kuyruktaki satırdır (`id` "queued-…").
 * Sunucu reddederse geri alınır ve `error` döner.
 */
export function useCheckinMutation() {
  const client = useQueryClient();
  return useMutation({
    // Çevrimdışıyken de çalışsın (duraklamasın): kuyruğa yazmak mutationFn'in işi
    networkMode: 'always',
    mutationFn: (input: CheckinInput) => {
      const prep = prepared.get(input);
      const op: CheckinOp = {
        kind: 'checkin',
        challengeId: input.challengeId,
        localDate: prep?.localDate ?? resolveLocalDate(client, input.challengeId, input.localDate),
        value: input.value,
        photoFileUri: input.photoFileUri,
        note: input.note,
      };
      return sendOrQueue(op, prep?.wasDone ?? false, () => api.checkin(input), () => queuedCheckin(op));
    },
    onMutate: async (input) => {
      const localDate = resolveLocalDate(client, input.challengeId, input.localDate);
      const { previous, wasDone } = await applyCheckinOptimistic(client, {
        kind: 'checkin',
        challengeId: input.challengeId,
        localDate,
        value: input.value,
        photoFileUri: input.photoFileUri,
        note: input.note,
      });
      prepared.set(input, { localDate, wasDone });
      return { previous };
    },
    onError: (_error, input, context) => rollback(client, input.challengeId, context?.previous),
    onSettled: (_r, _e, input) => invalidateUnlessQueued(client, input.challengeId, prepared.get(input)?.localDate),
  });
}

/** İşaretlemeyi geri al (yalnızca açık günler); çevrimdışıyken kuyruğa girer (bekleyen işaretlemeyi iptal eder) */
export function useUndoCheckinMutation() {
  const client = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: (input: UndoCheckinInput) => {
      const prep = prepared.get(input);
      const op: CheckinOp = {
        kind: 'undo',
        challengeId: input.challengeId,
        localDate: prep?.localDate ?? resolveLocalDate(client, input.challengeId, input.localDate),
      };
      return sendOrQueue(
        op,
        prep?.wasDone ?? true,
        () => api.undoCheckin(input.challengeId, input.localDate),
        () => undefined,
      );
    },
    onMutate: async (input) => {
      const localDate = resolveLocalDate(client, input.challengeId, input.localDate);
      const { previous, wasDone } = await applyCheckinOptimistic(client, {
        kind: 'undo',
        challengeId: input.challengeId,
        localDate,
      });
      prepared.set(input, { localDate, wasDone });
      return { previous };
    },
    onError: (_error, input, context) => rollback(client, input.challengeId, context?.previous),
    onSettled: (_r, _e, input) => invalidateUnlessQueued(client, input.challengeId, prepared.get(input)?.localDate),
  });
}

export const useRescueWithFreeRightMutation = () =>
  useWrite(({ challengeId, missedDate }: { challengeId: string; missedDate: LocalDate }) =>
    api.rescueWithFreeRight(challengeId, missedDate), DAILY);

/**
 * StreakLost reklamla kurtarma: reklam ödülü kazanıldıktan sonra `mutate({ challengeId, missedDate })`.
 * Sunucu ödülü AdMob SSV ile doğrulayana kadar ('AD_REWARD_PENDING') artan aralıklarla yeniden dener
 * (`AD_RESCUE_RETRY_DELAYS_MS`, toplam ~30 sn); sonra hâlâ gelmediyse `error` o koddur
 * (`isAdRewardPendingError`; ekran "Ödül doğrulanıyor…" ya da yeniden dene gösterebilir).
 * Reklam yüklenirken SSV seçenekleri: `adRescueSsvOptions(userId, challengeId, missedDate)`.
 */
export function useRescueWithAdMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, missedDate }: { challengeId: string; missedDate: LocalDate }) =>
      api.rescueWithAd(challengeId, missedDate),
    // failureCount ilk hatada 0: en çok AD_RESCUE_RETRY_DELAYS_MS.length yeniden deneme
    retry: (failureCount, error) => isAdRewardPendingError(error) && failureCount < AD_RESCUE_RETRY_DELAYS_MS.length,
    retryDelay: (attempt) => AD_RESCUE_RETRY_DELAYS_MS[Math.min(attempt, AD_RESCUE_RETRY_DELAYS_MS.length - 1)],
    onSettled: (_r, _e, { challengeId }) =>
      Promise.all(
        [...DAILY, queryKeys.calendar(challengeId), queryKeys.badges].map((queryKey) => client.invalidateQueries({ queryKey })),
      ),
  });
}

/** StreakLost "Baştan başla": bekleyen kurtarmadan vazgeç (usePendingRescues artık onu döndürmez) */
export const useDeclineRescueMutation = () =>
  useWrite(({ challengeId, missedDate }: { challengeId: string; missedDate: LocalDate }) =>
    api.declineRescue(challengeId, missedDate), DAILY);

/**
 * Bugün açılışında bir kez gösterilecek "Challenge bitti" ekranları (sunucu bitenleri de kapatır).
 * Gösterince `useMarkFinishSeenMutation` — cihaz değişse de tekrar gelmez.
 */
export const useUnseenFinished = () =>
  useQuery({ queryKey: queryKeys.unseenFinished, queryFn: () => api.getUnseenFinished() });

export function useMarkFinishSeenMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => api.markFinishSeen(challengeId),
    // Aynı açılışta ikinci kez gösterilmesin: listeden hemen çıkar
    onMutate: (challengeId) =>
      client.setQueryData<FinishedChallenge[]>(queryKeys.unseenFinished, (list) =>
        list?.filter((f) => f.challengeId !== challengeId),
      ),
    onSettled: (_r, _e, challengeId) =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.unseenFinished }),
        client.invalidateQueries({ queryKey: queryKeys.membership(challengeId) }),
      ]),
  });
}

// Challenge ---------------------------------------------------------------------------------------

export const useTemplates = () => useQuery({ queryKey: queryKeys.templates, queryFn: () => api.getTemplates(), staleTime: 10 * 60_000 });

const byPopularity = (templates: Template[]) => [...templates].sort((a, b) => a.popularity - b.popularity);

/** Keşfet "Popüler": şablonlar şu an yapan kişi sayısına göre (useTemplates ile aynı önbellek) */
export const usePopularTemplates = () =>
  useQuery({ queryKey: queryKeys.templates, queryFn: () => api.getTemplates(), staleTime: 10 * 60_000, select: byPopularity });

export const useTemplateStats = (templateId: string | undefined) =>
  useQuery({ queryKey: queryKeys.templateStats(templateId ?? ''), queryFn: () => api.getTemplateStats(templateId!), enabled: !!templateId });

export const useChallenge = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.challenge(id ?? ''), queryFn: () => api.getChallenge(id!), enabled: !!id });

export const useMyMembership = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.membership(id ?? ''), queryFn: () => api.getMyMembership(id!), enabled: !!id });

export const useChallengeBoard = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.board(id ?? ''), queryFn: () => api.getChallengeBoard(id!), enabled: !!id });

/** Takvim: sunucudaki işaretlemeler + kuyrukta bekleyenler */
export const useChallengeCalendar = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.calendar(id ?? ''),
    queryFn: async () => reflectCalendar(id!, await api.getChallengeCalendar(id!)),
    enabled: !!id,
  });

/** NumberEntry "Dün / En iyin / Grupta en iyi"; localDate verilmezse bugün (toleransta dün için ver) */
export const useNumberStats = (id: string | undefined, localDate?: LocalDate) =>
  useQuery({
    queryKey: queryKeys.numberStats(id ?? '', localDate ?? null),
    queryFn: () => api.getNumberStats(id!, localDate),
    enabled: !!id,
  });

/** Detail "…" → "Hatırlatma saatini değiştir": 'HH:MM' ya da null (grubun saatine dön) */
export function useSetMyReminderMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, time }: { challengeId: string; time: string | null }) => api.setMyReminder(challengeId, time),
    onSuccess: (membership) => client.setQueryData(queryKeys.membership(membership.challengeId), membership),
    onSettled: (_r, _e, { challengeId }) => client.invalidateQueries({ queryKey: queryKeys.challenge(challengeId) }),
  });
}

export const useInvitePreview = (code: string | undefined) =>
  useQuery({ queryKey: queryKeys.invitePreview(code ?? ''), queryFn: () => api.getInvitePreview(code!), enabled: !!code });

export const useGarden = () => useQuery({ queryKey: queryKeys.garden, queryFn: () => api.getGarden() });

/** Bahçem "Rozetler n / 12": tüm rozetler katalog sırasıyla, kazanılanlarda earnedAt */
export const useBadges = () => useQuery({ queryKey: queryKeys.badges, queryFn: () => api.getBadges() });

export const useCreateChallengeMutation = () =>
  useWrite((input: CreateChallengeInput) => api.createChallenge(input), DAILY);

export const useInviteToChallengeMutation = () =>
  useWrite(({ challengeId, userIds }: { challengeId: string; userIds: string[] }) => api.inviteToChallenge(challengeId, userIds), [['challenge']]);

export const useRespondToInviteMutation = () =>
  useWrite(({ challengeId, accept }: { challengeId: string; accept: boolean }) => api.respondToInvite(challengeId, accept), [...DAILY, ['activity']]);

export const useLeaveChallengeMutation = () => useWrite((challengeId: string) => api.leaveChallenge(challengeId), DAILY);

export const useCreateInviteCodeMutation = () => useMutation({ mutationFn: (challengeId: string) => api.createInviteCode(challengeId) });

export const useJoinByInviteMutation = () => useWrite((code: string) => api.joinByInvite(code), [...DAILY, ['invite']]);

/** FriendProfile: arkadaşın "Arkadaşlarım" görünürlüklü challenge'ına davetsiz katıl */
export const useJoinFriendChallengeMutation = () =>
  useWrite((challengeId: string) => api.joinFriendChallenge(challengeId), DAILY);

// Arkadaşlar ve sosyal --------------------------------------------------------------------------------

export const useFriendsToday = () => useQuery({ queryKey: queryKeys.friendsToday, queryFn: () => api.getFriendsToday() });

export const useFriendRequests = () => useQuery({ queryKey: queryKeys.friendRequests, queryFn: () => api.getFriendRequests() });

export const useSearchProfiles = (query: string) =>
  useQuery({
    queryKey: queryKeys.search(query.trim().toLowerCase()),
    queryFn: () => api.searchProfiles(query),
    enabled: query.trim().replace(/^@/, '').length >= 2,
  });

/**
 * Rehberden bul: `mutate(await hashContactEmails(emails))` → keşfedilebilir eşleşen kullanıcılar
 * (`SearchResult[]`, arkadaşlık durumu ve ortak arkadaş sayısıyla).
 */
export const useFindContactsMutation = () =>
  useMutation({ mutationFn: (emailHashes: string[]) => api.findContacts(emailHashes) });

export const useFriendProfile = (userId: string | undefined) =>
  useQuery({ queryKey: queryKeys.friendProfile(userId ?? ''), queryFn: () => api.getFriendProfile(userId!), enabled: !!userId });

/** Sabit listeden (src/content/pokes.ts; id ile gönderilir, sunucu doğrular) */
const contentPokeMessages = (): PokeMessage[] =>
  POKE_MESSAGES.map((m) => ({
    key: m.id,
    tone: m.tone,
    sortOrder: POKE_MESSAGES.filter((x) => x.tone === m.tone).indexOf(m),
    text: m.text,
    isActive: true,
  }));

export const usePokeMessages = () =>
  useQuery({ queryKey: queryKeys.pokeMessages, queryFn: async () => contentPokeMessages(), staleTime: Infinity });

/** Poke: alıcıya bugün gönderilen ve kalan dürtme hakkı (remaining 0 → gönder pasif), sert mod */
export const usePokeStatus = (userId: string | undefined) =>
  useQuery({ queryKey: queryKeys.pokeStatus(userId ?? ''), queryFn: () => api.getPokeStatus(userId!), enabled: !!userId });

export const useActivity = () => useQuery({ queryKey: queryKeys.activity, queryFn: () => api.getActivity() });

/**
 * Aktivite, 30'ar sayfa (en yeniden eskiye): `data.pages.flatMap((p) => p.items)`, sonraki sayfa
 * `fetchNextPage()` (`hasNextPage`).
 */
export const useActivityPages = (limit = 30) =>
  useInfiniteQuery({
    queryKey: [...queryKeys.activityPages, limit],
    queryFn: ({ pageParam }) => api.getActivityPage({ before: pageParam, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

/** Bugün zil rozeti: okunmamış aktivite sayısı */
export const useUnreadCount = () => useQuery({ queryKey: queryKeys.unreadCount, queryFn: () => api.getUnreadCount() });

export const useBlockedUsers = () => useQuery({ queryKey: queryKeys.blocked, queryFn: () => api.getBlockedUsers() });

export const useSendFriendRequestMutation = () => useWrite((userId: string) => api.sendFriendRequest(userId), SOCIAL);

export const useAcceptFriendRequestMutation = () =>
  useWrite((friendshipId: string) => api.acceptFriendRequest(friendshipId), [...SOCIAL, queryKeys.badges]);

export const useRemoveFriendshipMutation = () => useWrite((userId: string) => api.removeFriendship(userId), SOCIAL);

/** Gönderince kalan hak (usePokeStatus, ['friends'] altında) ve rozetler yenilenir */
export const useSendPokeMutation = () =>
  useWrite((input: SendPokeInput) => api.sendPoke(input), [['friends'], queryKeys.badges]);

/** Geri alınca da kalan hak yenilenir (geri alınan dürtme yine sayılır) */
export const useUndoPokeMutation = () => useWrite((pokeId: string) => api.undoPoke(pokeId), [['friends']]);

export const useMarkActivityReadMutation = () =>
  useWrite((ids: string[] | undefined) => api.markActivityRead(ids), [['activity']]);

export const useBlockUserMutation = () => useWrite((userId: string) => api.blockUser(userId), [...SOCIAL, ['challenge']]);

export const useUnblockUserMutation = () => useWrite((userId: string) => api.unblockUser(userId), SOCIAL);

export const useSubmitReportMutation = () => useWrite((input: ReportInput) => api.submitReport(input), SOCIAL);
