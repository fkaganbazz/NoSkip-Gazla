/**
 * Ekranların veri kancaları (TanStack Query), adları ve biçimi docs/EKRANLAR.md "Veri hook'ları".
 *
 * - Okuma kancaları (`useTodayTasks`, `useStreak` …) TanStack sorgu sonucunu döner: `data`, `isLoading`,
 *   `isError`, `refetch` (ve `isPending`, `isRefetching` …).
 * - Eylem kancaları (`useCheckin`, `usePoke` …) nesne döner: `{ data, isLoading, isError, error, reset, …eylemler }`.
 *   `isLoading` herhangi bir eylem sürerken true; `data`/`error` son başlatılan eylemin sonucu; `reset` hepsini
 *   sıfırlar. Bir sorguyu da okuyanlarda (`useProfile`, `useInvite(code)`, `useRescueStreak`) `data`, `isLoading`,
 *   `isError`, `error`, `refetch` o sorgunundur.
 * - Her eylem (`checkin.mark`, `poke.send` …) `mutateAsync` gibi çağrılır: `(girdi, { onSuccess, onError, onSettled })`,
 *   Promise döner (hata fırlatır) ama beklemeden de çağrılabilir. Kendi durumu üstünde: `isPending`, `isError`,
 *   `error`, `data`, `variables`, `reset()` (ör. `checkin.undo.isPending`).
 * - Her yazma, etkilediği okumaları yeniler; işaretleme iyimser güncellenir (dokunur dokunmaz değişir, sunucu
 *   reddederse geri alınır). Çevrimdışıyken işaretleme ve geri alma kuyruğa girer (`offlineQueue.ts`), bağlantı
 *   gelince gönderilir.
 */
import {
  noop,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type MutateFunction,
  type QueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { inviteLink } from '../config/links';
import { POKE_MESSAGES } from '../content/pokes';
import { AD_RESCUE_RETRY_DELAYS_MS } from './adRescue';
import { isAdRewardPendingError, isCancelledError, isNetworkError, type OAuthProvider } from './api';
import { api } from './client';
import { useAuth } from './DataProvider';
import { forgetSession } from './lastSession';
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
  reflectStreak,
  reflectToday,
  type CheckinOp,
} from './offlineQueue';
import { profileQuery, recentDaysQuery } from './queries';
import { DAILY_KEYS, queryKeys } from './queryKeys';
import { forgetPushToken, rememberPushToken, savedPushToken } from './pushToken';
import type {
  ChallengeCalendar,
  ChallengeCategory,
  Checkin,
  CheckinInput,
  CompleteProfileInput,
  CreateChallengeInput,
  FinishedChallenge,
  LocalDate,
  PokeMessage,
  ProfileUpdate,
  RecentDay,
  ReportInput,
  ReportTarget,
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

// Eylem kancalarının yapı taşları -------------------------------------------------------------------

/** Birleşimin her üyesine ayrı uygulanan Pick/Omit: `isError` true iken `error` Error olarak daralır */
type DistributivePick<T, K extends keyof T> = T extends unknown ? Pick<T, K> : never;
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type ActionStatus<TResult, TInput> = DistributivePick<
  UseMutationResult<TResult, Error, TInput>,
  'data' | 'error' | 'isError' | 'isPending' | 'isSuccess' | 'variables' | 'submittedAt' | 'reset'
>;

/**
 * Bir eylem: `mutateAsync` gibi çağrılır (`(girdi, { onSuccess, onError, onSettled })` → Promise), beklemeden
 * çağrılınca da yakalanmamış hata olmaz. Kendi istek durumu üstünde (`isPending`, `error`, `variables` …).
 */
export type Action<TInput, TResult> = MutateFunction<TResult, Error, TInput, unknown> & ActionStatus<TResult, TInput>;

type AnyAction = Action<any, any>;

/** TanStack mutation → eylem; durum değişmedikçe aynı fonksiyon (useCallback/useEffect bağımlılığında güvenli) */
function useAction<TResult, TInput>(mutation: UseMutationResult<TResult, Error, TInput, unknown>): Action<TInput, TResult> {
  const { mutateAsync, reset, data, error, isError, isPending, isSuccess, variables, submittedAt } = mutation;
  return useMemo(() => {
    const run = ((...args: Parameters<typeof mutateAsync>) => {
      const promise = mutateAsync(...args);
      promise.catch(noop);
      return promise;
    }) as MutateFunction<TResult, Error, TInput, unknown>;
    return Object.assign(run, { data, error, isError, isPending, isSuccess, variables, submittedAt, reset }) as Action<
      TInput,
      TResult
    >;
  }, [mutateAsync, reset, data, error, isError, isPending, isSuccess, variables, submittedAt]);
}

/** Eylem kancasının ortak alanları; `data`/`error` son başlatılan eylemin */
export type ActionState<A extends Record<string, AnyAction>> = {
  data: A[keyof A]['data'];
  /** Herhangi bir eylem sürüyor */
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  /** Tüm eylemlerin durumunu sıfırla */
  reset: () => void;
};

function actionHook<A extends Record<string, AnyAction>>(actions: A): A & ActionState<A> {
  const list: AnyAction[] = Object.values(actions);
  const latest = list.reduce((a, b) => (b.submittedAt > a.submittedAt ? b : a));
  return {
    ...actions,
    data: latest.data,
    isLoading: list.some((a) => a.isPending),
    isError: latest.isError,
    error: latest.error,
    reset: () => list.forEach((a) => a.reset()),
  };
}

/**
 * Sorgu + eylemler (useProfile, useInvite(code), useRescueStreak): sorgunun alanları (`data`, `isLoading`,
 * `isError`, `refetch` …) okundukça sorgudan gelir (TanStack yalnızca okunan alanlar değişince yeniden çizer).
 */
function withQuery<Q extends object, A extends Record<string, AnyAction>>(
  query: Q,
  actions: A,
): DistributiveOmit<Q, keyof A | 'reset'> & A & { reset: () => void } {
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(query)) {
    Object.defineProperty(out, key, { enumerable: true, get: () => query[key as keyof Q] });
  }
  const list: AnyAction[] = Object.values(actions);
  return Object.assign(out, actions, { reset: () => list.forEach((a) => a.reset()) }) as DistributiveOmit<
    Q,
    keyof A | 'reset'
  > &
    A & { reset: () => void };
}

// Profil ve ayarlar ------------------------------------------------------------------------------

/**
 * Kendi profilin (DataProvider'ın okuduğu sorgu; profil tamamlanmadıysa `data` null) ve eylemleri:
 * `create(input)` profili tamamlar (Onboarding Profil), `update(patch)` günceller (avatar dahil).
 */
export function useProfile() {
  const { session } = useAuth();
  const profile = useQuery({ ...profileQuery(session?.userId ?? null), enabled: !!session });
  const create = useAction(useWrite((input: CompleteProfileInput) => api.completeProfile(input), [['me']]));
  const update = useAction(useWrite((patch: ProfileUpdate) => api.updateProfile(patch), [['me'], ['friends']]));
  return withQuery(profile, { create, update });
}

/** Kullanıcı adı boşta mı (`data` true/false); 3 karakterden kısayken sorgu yapılmaz */
export const useUsernameCheck = (username: string) =>
  useQuery({
    queryKey: ['usernameAvailable', username],
    queryFn: () => api.isUsernameAvailable(username),
    enabled: username.trim().length >= 3,
  });

export const useMySettings = () => useQuery({ queryKey: queryKeys.settings, queryFn: () => api.getMySettings() });

/** Ayar kaydet: `update(patch)`; sonuç ayarlar önbelleğine yazılır (iyimser görünüm ekranda, `useOptimisticPatch`) */
export function useUpdateSettings() {
  const client = useQueryClient();
  const update = useAction(
    useMutation({
      mutationFn: (patch: SettingsUpdate) => api.updateSettings(patch),
      onSuccess: (settings) => client.setQueryData(queryKeys.settings, settings),
    }),
  );
  return actionHook({ update });
}

/**
 * Bildirim izni verildikten sonra Expo push token'ını kaydet: `mutate({ token, platform })`.
 * Token bu cihazda saklanır; çıkışta sunucudan silinir (`useSignOut`).
 */
export const useRegisterPushToken = () =>
  useMutation({
    mutationFn: async ({ token, platform }: { token: string; platform: 'ios' | 'android' }) => {
      await api.registerPushToken(token, platform);
      rememberPushToken({ token, platform });
    },
  });

// Oturum -------------------------------------------------------------------------------------------

/**
 * Apple / Google ile giriş. Kullanıcı pencereyi kapatırsa hata değil: sonuç `'cancelled'`
 * (oturum açılınca route korumaları ilerletir, sonuç `'signedIn'`).
 */
export const useSignInWithProvider = () =>
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

export const useSignInWithEmail = () => useMutation({ mutationFn: (email: string) => api.signInWithEmail(email) });

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
export const useSignOut = () =>
  useMutation({
    mutationFn: async () => {
      forgetSession();
      await unregisterDevicePushToken();
      return api.signOut();
    },
  });

/** Hesap silme (Edge Function `delete-account`): `deleteAccount()`; push token satırı zincirleme silinir */
export function useDeleteAccount() {
  const deleteAccount = useAction(
    useMutation({
      mutationFn: async () => {
        forgetSession();
        await api.deleteAccount();
        forgetPushToken();
      },
    }),
  );
  return actionHook({ deleteAccount });
}

// Bugün ve seri -------------------------------------------------------------------------------------

/** Bugün: sunucudaki liste + çevrimdışı kuyruktaki bekleyen işaretlemeler */
export const useTodayTasks = () =>
  useQuery({ queryKey: queryKeys.today, queryFn: async () => reflectToday(await api.getToday()) });

/** Seri özeti: bugünün bekleyen işaretlemeleri tamam sayısına (ve hepsi bittiyse seriye) yansır */
export const useStreak = () =>
  useQuery({ queryKey: queryKeys.streak, queryFn: async () => reflectStreak(await api.getStreak()) });

/** Completion haftası (DataProvider açılışta önden çeker) */
export const useRecentDays = (days = 7) => useQuery(recentDaysQuery(days));

const RECENT_DAYS = ['me', 'recentDays'];

/** İşaretlenecek gün; `localDate` verilmezse Bugün'deki satırının günü (toleransta en yenisi), yoksa cihazın bugünü */
export type CheckinTarget = { challengeId: string; localDate?: LocalDate };
export type NumberCheckinInput = CheckinTarget & { value: number };
export type PhotoCheckinInput = CheckinTarget & { photoFileUri: string; note?: string };

type CheckinSnapshot = {
  today: TodayTask[] | undefined;
  streak: StreakSummary | undefined;
  calendar: ChallengeCalendar | undefined;
  recentDays: [QueryKey, RecentDay[] | undefined][];
};

type CheckinContext = { previous: CheckinSnapshot };

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
function checkinOptions<TInput extends CheckinInput>(
  client: QueryClient,
): UseMutationOptions<Checkin, Error, TInput, CheckinContext> {
  return {
    // Çevrimdışıyken de çalışsın (duraklamasın): kuyruğa yazmak mutationFn'in işi
    networkMode: 'always',
    mutationFn: (input) => {
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
  };
}

/** İşaretlemeyi geri al (yalnızca açık günler); çevrimdışıyken kuyruğa girer (bekleyen işaretlemeyi iptal eder) */
function undoCheckinOptions(client: QueryClient): UseMutationOptions<void, Error, CheckinTarget, CheckinContext> {
  return {
    networkMode: 'always',
    mutationFn: (input) => {
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
  };
}

/**
 * Günü işaretle (iyimser + çevrimdışı kuyruk): `mark({ challengeId, localDate })` işaretle tipi,
 * `submitNumber({ challengeId, localDate, value })` sayı, `submitPhoto({ challengeId, localDate, photoFileUri, note })`
 * fotoğraf (önce Storage'a yüklenir), `undo({ challengeId, localDate })` geri al. Her eylemin kendi durumu var
 * (ör. NumberEntry'de `submitNumber.isPending` ve `undo.isPending` ayrı).
 */
export function useCheckin() {
  const client = useQueryClient();
  const mark = useAction(useMutation(checkinOptions<CheckinTarget>(client)));
  const submitNumber = useAction(useMutation(checkinOptions<NumberCheckinInput>(client)));
  const submitPhoto = useAction(useMutation(checkinOptions<PhotoCheckinInput>(client)));
  const undo = useAction(useMutation(undoCheckinOptions(client)));
  return actionHook({ mark, submitNumber, submitPhoto, undo });
}

export type RescueInput = { via: 'ad' | 'free'; challengeId: string; missedDate: LocalDate };

/**
 * Seri koptu: bekleyen kurtarmalar (my_pending_rescues; `data`) ve eylemleri.
 * - `rescue({ via: 'free', challengeId, missedDate })` ayda 1 ücretsiz hak.
 * - `rescue({ via: 'ad', … })` reklam ödülü kazanıldıktan sonra. Sunucu ödülü AdMob SSV ile doğrulayana kadar
 *   ('AD_REWARD_PENDING') artan aralıklarla yeniden dener (`AD_RESCUE_RETRY_DELAYS_MS`, toplam ~30 sn); sonra hâlâ
 *   gelmediyse `error` o koddur (`isAdRewardPendingError`). Reklam yüklenirken SSV seçenekleri:
 *   `adRescueSsvOptions(userId, challengeId, missedDate)`.
 * - `decline({ challengeId, missedDate })` "Baştan başla": kurtarmadan vazgeç (artık listede dönmez).
 */
export function useRescueStreak() {
  const client = useQueryClient();
  const pending = useQuery({ queryKey: queryKeys.pendingRescues, queryFn: () => api.getPendingRescues() });
  const rescue = useAction(
    useMutation({
      mutationFn: ({ via, challengeId, missedDate }: RescueInput) =>
        via === 'ad' ? api.rescueWithAd(challengeId, missedDate) : api.rescueWithFreeRight(challengeId, missedDate),
      // Yalnızca reklam ödülü doğrulaması beklenirken; failureCount ilk hatada 0: en çok
      // AD_RESCUE_RETRY_DELAYS_MS.length yeniden deneme
      retry: (failureCount, error) => isAdRewardPendingError(error) && failureCount < AD_RESCUE_RETRY_DELAYS_MS.length,
      retryDelay: (attempt) => AD_RESCUE_RETRY_DELAYS_MS[Math.min(attempt, AD_RESCUE_RETRY_DELAYS_MS.length - 1)],
      onSettled: (_r, _e, { via, challengeId }) =>
        Promise.all(
          (via === 'ad' ? [...DAILY, queryKeys.calendar(challengeId), queryKeys.badges] : DAILY).map((queryKey) =>
            client.invalidateQueries({ queryKey }),
          ),
        ),
    }),
  );
  const decline = useAction(
    useWrite(({ challengeId, missedDate }: { challengeId: string; missedDate: LocalDate }) =>
      api.declineRescue(challengeId, missedDate), DAILY),
  );
  return withQuery(pending, { rescue, decline });
}

/**
 * Bugün açılışında bir kez gösterilecek "Challenge bitti" ekranları (sunucu bitenleri de kapatır).
 * Gösterince `useMarkFinishSeen` — cihaz değişse de tekrar gelmez.
 */
export const useUnseenFinished = () =>
  useQuery({ queryKey: queryKeys.unseenFinished, queryFn: () => api.getUnseenFinished() });

export function useMarkFinishSeen() {
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

const templatesQuery = queryOptions({ queryKey: queryKeys.templates, queryFn: () => api.getTemplates(), staleTime: 10 * 60_000 });

export type TemplateFilter = {
  /** PickChallenge: onboarding şablonları (6), onboarding sırasıyla */
  featured?: boolean;
  category?: ChallengeCategory | null;
  /** Başlıkta ya da kısa başlıkta geçen metin (büyük/küçük harf duyarsız) */
  q?: string;
  /** 'popular': şu an yapan kişi sayısına göre (1 en popüler); verilmezse onboarding sırası */
  sort?: 'popular';
};

const normalizeSearch = (s: string) => s.trim().toLocaleLowerCase('tr');

const byPopularity = (templates: Template[]) => [...templates].sort((a, b) => a.popularity - b.popularity);

function filterTemplates(templates: Template[], { featured, category, q, sort }: TemplateFilter): Template[] {
  const term = normalizeSearch(q ?? '');
  let list = templates.filter(
    (t) =>
      (!featured || t.onboardingOrder !== null) &&
      (!category || t.category === category) &&
      (!term || normalizeSearch(t.title).includes(term) || (!!t.shortTitle && normalizeSearch(t.shortTitle).includes(term))),
  );
  if (featured) list = list.sort((a, b) => (a.onboardingOrder ?? 0) - (b.onboardingOrder ?? 0));
  if (sort === 'popular') list = byPopularity(list);
  return list;
}

/**
 * Challenge şablonları (tek önbellek, süzme `select` ile): `useChallengeTemplates()` hepsi,
 * `{ featured: true }` PickChallenge'ın 6'sı, `{ category, q, sort: 'popular' }` Keşfet listesi.
 */
export function useChallengeTemplates(filter: TemplateFilter = {}) {
  const { featured = false, category = null, q = '', sort } = filter;
  const select = useCallback(
    (templates: Template[]) => filterTemplates(templates, { featured, category, q, sort }),
    [featured, category, q, sort],
  );
  return useQuery({ ...templatesQuery, select });
}

/** En son haftanın öne çıkan şablonu (`featuredWeek`; aynı haftada birden çoksa en popüleri) */
function pickFeatured(templates: Template[]): Template | null {
  return (
    byPopularity(templates)
      .filter((t) => t.featuredWeek)
      .sort((a, b) => (b.featuredWeek ?? '').localeCompare(a.featuredWeek ?? ''))[0] ?? null
  );
}

/** Keşfet "Haftanın challenge'ı": tek şablon (yoksa null), şu an yapan sayısı `activeCount` */
export const useFeaturedTemplate = () => useQuery({ ...templatesQuery, select: pickFeatured });

export const useTemplateStats = (templateId: string | undefined) =>
  useQuery({ queryKey: queryKeys.templateStats(templateId ?? ''), queryFn: () => api.getTemplateStats(templateId!), enabled: !!templateId });

export const useChallenge = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.challenge(id ?? ''), queryFn: () => api.getChallenge(id!), enabled: !!id });

export const useMyMembership = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.membership(id ?? ''), queryFn: () => api.getMyMembership(id!), enabled: !!id });

/** Grup: üyeler seriye göre sıralı, bugünkü durumlarıyla (challenge_board) */
export const useChallengeMembers = (id: string | undefined) =>
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
export function useSetMyReminder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, time }: { challengeId: string; time: string | null }) => api.setMyReminder(challengeId, time),
    onSuccess: (membership) => client.setQueryData(queryKeys.membership(membership.challengeId), membership),
    onSettled: (_r, _e, { challengeId }) => client.invalidateQueries({ queryKey: queryKeys.challenge(challengeId) }),
  });
}

/**
 * Davet. `code` verilirse önizleme sorgusu (get_invite_preview, oturumsuz da; geçersiz kodda `data` null) ve
 * `join()` o koda katılır (→ challenge id; başka kod için `join(code)`). `createLink(challengeId)` davet linki
 * üretir: `https://<alan>/d/<kod>` (create_invite; aynı kişiye aynı kod).
 */
export function useInvite(code?: string) {
  const preview = useQuery({ queryKey: queryKeys.invitePreview(code ?? ''), queryFn: () => api.getInvitePreview(code!), enabled: !!code });
  const createLink = useAction(
    useMutation({ mutationFn: async (challengeId: string) => inviteLink(await api.createInviteCode(challengeId)) }),
  );
  const join = useAction(useWrite((inviteCode?: string) => api.joinByInvite(inviteCode ?? code ?? ''), [...DAILY, ['invite']]));
  return withQuery(preview, { createLink, join });
}

export const useGarden = () => useQuery({ queryKey: queryKeys.garden, queryFn: () => api.getGarden() });

/** Bahçem "Rozetler n / 12": tüm rozetler katalog sırasıyla, kazanılanlarda earnedAt */
export const useBadges = () => useQuery({ queryKey: queryKeys.badges, queryFn: () => api.getBadges() });

/** Challenge oluştur: `create(input)` → oluşturulan challenge */
export function useCreateChallenge() {
  const create = useAction(useWrite((input: CreateChallengeInput) => api.createChallenge(input), DAILY));
  return actionHook({ create });
}

export const useInviteToChallenge = () =>
  useWrite(({ challengeId, userIds }: { challengeId: string; userIds: string[] }) => api.inviteToChallenge(challengeId, userIds), [['challenge']]);

export const useRespondToInvite = () =>
  useWrite(({ challengeId, accept }: { challengeId: string; accept: boolean }) => api.respondToInvite(challengeId, accept), [...DAILY, ['activity']]);

export const useLeaveChallenge = () => useWrite((challengeId: string) => api.leaveChallenge(challengeId), DAILY);

/** FriendProfile: arkadaşın "Arkadaşlarım" görünürlüklü challenge'ına davetsiz katıl */
export const useJoinFriendChallenge = () =>
  useWrite((challengeId: string) => api.joinFriendChallenge(challengeId), DAILY);

// Arkadaşlar ve sosyal --------------------------------------------------------------------------------

export const useFriendsToday = () => useQuery({ queryKey: queryKeys.friendsToday, queryFn: () => api.getFriendsToday() });

export const useFriendRequests = () => useQuery({ queryKey: queryKeys.friendRequests, queryFn: () => api.getFriendRequests() });

/** Kullanıcı adıyla ara (search_profiles); 2 karakterden kısayken (baştaki @ hariç) sorgu yapılmaz */
export const useUserSearch = (q: string) =>
  useQuery({
    queryKey: queryKeys.search(q.trim().toLowerCase()),
    queryFn: () => api.searchProfiles(q),
    enabled: q.trim().replace(/^@/, '').length >= 2,
  });

/**
 * Rehberden bul: `mutate(await hashContactEmails(emails))` → keşfedilebilir eşleşen kullanıcılar
 * (`SearchResult[]`, arkadaşlık durumu ve ortak arkadaş sayısıyla).
 */
export const useFindContacts = () =>
  useMutation({ mutationFn: (emailHashes: string[]) => api.findContacts(emailHashes) });

export const useFriendProfile = (userId: string | undefined) =>
  useQuery({ queryKey: queryKeys.friendProfile(userId ?? ''), queryFn: () => api.getFriendProfile(userId!), enabled: !!userId });

/** Hazır dürtme mesajları, sabit listeden (src/content/pokes.ts; id ile gönderilir, sunucu doğrular) */
const POKE_MESSAGE_LIST: readonly PokeMessage[] = POKE_MESSAGES.map((m) => ({
  key: m.id,
  tone: m.tone,
  sortOrder: POKE_MESSAGES.filter((x) => x.tone === m.tone).indexOf(m),
  text: m.text,
  isActive: true,
}));

/** `usePoke().send` girdisi: alıcı ve hazır mesajın id'si (ton mesajdan) */
export type PokeSendInput = { toUserId: string; messageId: string; challengeId?: string };

/**
 * Dürt: `send({ toUserId, messageId, challengeId? })` → gönderilen dürtme (`id` geri almak için),
 * `undo(pokeId)` 30 sn içinde geri al, `messages` hazır mesajlar. `userId` verilirse `status`: alıcıya bugün
 * gönderilen ve kalan hak (remaining 0 → gönder pasif), sert mod. Gönderince ve geri alınca kalan hak
 * (`['friends']` altında) yenilenir (geri alınan dürtme yine sayılır); gönderince rozetler de.
 */
export function usePoke(userId?: string) {
  const send = useAction(
    useWrite(
      ({ toUserId, messageId, challengeId }: PokeSendInput) =>
        api.sendPoke({
          recipientId: toUserId,
          // Bilinmeyen id'yi sunucu reddeder
          tone: POKE_MESSAGES.find((m) => m.id === messageId)?.tone ?? 'hype',
          messageKey: messageId,
          challengeId,
        }),
      [['friends'], queryKeys.badges],
    ),
  );
  const undo = useAction(useWrite((pokeId: string) => api.undoPoke(pokeId), [['friends']]));
  const status = useQuery({ queryKey: queryKeys.pokeStatus(userId ?? ''), queryFn: () => api.getPokeStatus(userId!), enabled: !!userId });
  return { ...actionHook({ send, undo }), messages: POKE_MESSAGE_LIST, status };
}

/**
 * Aktivite, 30'ar sayfa (en yeniden eskiye): `data.pages.flatMap((p) => p.items)`, sonraki sayfa
 * `fetchNextPage()` (`hasNextPage`).
 */
export const useActivity = (limit = 30) =>
  useInfiniteQuery({
    queryKey: [...queryKeys.activityPages, limit],
    queryFn: ({ pageParam }) => api.getActivityPage({ before: pageParam, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

/** Bugün zil rozeti: okunmamış aktivite sayısı */
export const useUnreadCount = () => useQuery({ queryKey: queryKeys.unreadCount, queryFn: () => api.getUnreadCount() });

/** Aktivite "Tümü okundu": `markAll()` */
export function useMarkAllRead() {
  const markAll = useAction(useWrite((_: void) => api.markActivityRead(undefined), [['activity']]));
  return actionHook({ markAll });
}

export const useSendFriendRequest = () => useWrite((userId: string) => api.sendFriendRequest(userId), SOCIAL);

export const useAcceptFriendRequest = () =>
  useWrite((friendshipId: string) => api.acceptFriendRequest(friendshipId), [...SOCIAL, queryKeys.badges]);

export const useRemoveFriendship = () => useWrite((userId: string) => api.removeFriendship(userId), SOCIAL);

/**
 * Engelle: `block(userId)` (arkadaşlık silinir, birbirlerini göremezler), `unblock(userId)`.
 * `{ list: true }` ile engellenenler listesi de okunur (`blocked`, Ayarlar); yoksa `blocked` sorgusu çalışmaz.
 */
export function useBlock({ list = false }: { list?: boolean } = {}) {
  const block = useAction(useWrite((userId: string) => api.blockUser(userId), [...SOCIAL, ['challenge']]));
  const unblock = useAction(useWrite((userId: string) => api.unblockUser(userId), SOCIAL));
  const blocked = useQuery({ queryKey: queryKeys.blocked, queryFn: () => api.getBlockedUsers(), enabled: list });
  return { ...actionHook({ block, unblock }), blocked };
}

/** Şikayet girdisi; `target` verilmezse kişi ('user') */
export type ReportSubmitInput = Omit<ReportInput, 'target'> & { target?: ReportTarget };

/** Şikayet et: `submit({ userId, reason, details, alsoBlock })` (fotoğraf: `target: 'photo'`, `checkinId`) */
export function useReport() {
  const submit = useAction(
    useWrite(({ target = 'user', ...input }: ReportSubmitInput) => api.submitReport({ target, ...input }), SOCIAL),
  );
  return actionHook({ submit });
}
