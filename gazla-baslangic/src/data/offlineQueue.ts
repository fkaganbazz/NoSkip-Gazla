/**
 * Çevrimdışı işaretleme kuyruğu (MMKV, `storage.ts`). `useCheckinMutation` ve
 * `useUndoCheckinMutation` çevrimdışıyken ya da istek ağ hatasıyla düşerse işlemi buraya yazar;
 * ekran iyimser durumu hemen gösterir ve kullanıcıya hata gösterilmez.
 *
 * Kurallar:
 * - Her işlem bir güne bağlıdır (challengeId + localDate). Tarih kuyruğa girerken sabitlenir; gece
 *   yarısını geçse de doğru gün gönderilir (sunucu toleransı içindeyse kabul eder).
 * - Aynı gün için checkin + undo birbirini iptal eder: gün başına en fazla bir bekleyen işlem
 *   kalır ve sunucudaki duruma (`baseDone`) göre gereksizse hiç gönderilmez. Gönderilmekte olan
 *   işlem iptal edilemez; yeni işlem onun arkasına eklenir.
 * - Fotoğraflı işaretleme dosya URI'siyle saklanır; yükleme gönderim sırasında yapılır.
 * - Bağlantı gelince, uygulama açılınca ve ön plana dönünce kuyruk sırayla boşaltılır. Ağ hatasında
 *   durur, bekleyip yeniden dener. Sunucu iş kuralıyla reddederse (ApiError: gün kapandı,
 *   challenge'dan çıkıldı…) işlem atılır ve ilgili sorgular yenilenir (ekran sunucudaki duruma
 *   döner). Bitince günlük sorgular yenilenir.
 * - Sunucudan gelen Bugün, seri özeti ve takvim verisine kuyruk yansıtılır (`reflect*`):
 *   uygulama yeniden açılınca da bekleyen işaretlemeler ekranda kalır.
 * - Öğeler oturumdaki kullanıcıya aittir; başka hesapla girilince gönderilmez, sayılmaz.
 */
import { onlineManager, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { ApiError, isNetworkError, type GazlaApi } from './api';
import { DAILY_KEYS, queryKeys } from './queryKeys';
import { readJson, writeJson } from './storage';
import type { ChallengeCalendar, Checkin, LocalDate, StreakSummary, TodayTask } from './types';

const STORAGE_KEY = 'offlineQueue.checkins.v1';
/** Ağ dışı, tanınmayan hatada (ör. oturum belirteci) en fazla deneme; sonra atılır */
const MAX_ATTEMPTS = 5;
const RETRY_MIN_MS = 5_000;
const RETRY_MAX_MS = 5 * 60_000;

export type CheckinOpKind = 'checkin' | 'undo';

/** Kuyruğa girecek işlem (tarih sabitlenmiş) */
export type CheckinOp = {
  kind: CheckinOpKind;
  challengeId: string;
  localDate: LocalDate;
  value?: number;
  /** Fotoğraf görevinde cihazdaki dosya; Storage'a gönderimde yüklenir */
  photoFileUri?: string;
  note?: string;
};

export type QueuedCheckinOp = CheckinOp & {
  id: string;
  userId: string | null;
  /** Bu gün için kuyruktaki ilk işlemden önce sunucuda tamam mıydı (seri özetini yansıtmak için) */
  baseDone: boolean;
  queuedAt: string;
  attempts: number;
};

// Depo ----------------------------------------------------------------------------------------------

let items: QueuedCheckinOp[] | null = null;
let inFlightId: string | null = null;
let currentUserId: string | null = null;
const listeners = new Set<() => void>();

const isOp = (x: unknown): x is QueuedCheckinOp => {
  const o = x as Partial<QueuedCheckinOp> | null;
  return (
    !!o &&
    typeof o.id === 'string' &&
    (o.kind === 'checkin' || o.kind === 'undo') &&
    typeof o.challengeId === 'string' &&
    typeof o.localDate === 'string'
  );
};

function all(): QueuedCheckinOp[] {
  if (items === null) {
    const stored = readJson<unknown>(STORAGE_KEY);
    items = Array.isArray(stored)
      ? stored.filter(isOp).map((o) => ({ ...o, userId: o.userId ?? null, baseDone: !!o.baseDone, attempts: o.attempts ?? 0 }))
      : [];
  }
  return items;
}

function commit(next: QueuedCheckinOp[]) {
  items = next;
  writeJson(STORAGE_KEY, next);
  listeners.forEach((l) => l());
}

const mine = (op: QueuedCheckinOp) => op.userId === null || op.userId === currentUserId;
const sameDay = (op: { challengeId: string; localDate: LocalDate }, challengeId: string, localDate: LocalDate) =>
  op.challengeId === challengeId && op.localDate === localDate;
const hasPayload = (op: CheckinOp) => op.value !== undefined || !!op.photoFileUri || !!op.note;

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Oturumdaki kullanıcının bekleyen işlemleri, sırayla */
export function getCheckinQueue(): QueuedCheckinOp[] {
  return all().filter(mine);
}

export function subscribeCheckinQueue(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Bu gün için kuyrukta (gönderilmekte olan dahil) işlem var mı */
export function isCheckinQueued(challengeId: string, localDate: LocalDate): boolean {
  return getCheckinQueue().some((op) => sameDay(op, challengeId, localDate));
}

/** Kuyruğu boşalt (geliştirme menüsü "sıfırla"; gönderilmeden atılır) */
export function clearCheckinQueue(): void {
  commit([]);
}

const pendingCount = () => getCheckinQueue().length;

/** Gönderilmeyi bekleyen işaretleme sayısı (çevrimdışı tostu, geliştirme menüsü) */
export function usePendingCheckins(): number {
  return useSyncExternalStore(subscribeCheckinQueue, pendingCount, pendingCount);
}

/**
 * İşlemi kuyruğa yaz. `wasDone`: işlemden hemen önce ekranda (iyimser durum dahil) tamam mıydı;
 * bu gün için kuyrukta işlem yoksa sunucudaki durum budur.
 * `reason`: 'network' istek ağ hatasıyla düştüyse (hemen değil, bekleyip dener).
 */
export function enqueueCheckinOp(op: CheckinOp, wasDone: boolean, reason: 'offline' | 'network' = 'offline'): void {
  const list = all();
  const forDay = (o: QueuedCheckinOp) => mine(o) && sameDay(o, op.challengeId, op.localDate);
  const inFlight = list.find((o) => o.id === inFlightId && forDay(o));
  const pending = list.find((o) => o.id !== inFlightId && forDay(o));
  const baseDone = pending ? pending.baseDone : inFlight ? inFlight.kind === 'checkin' : wasDone;
  const rest = pending ? list.filter((o) => o !== pending) : list;

  // Net etki yoksa gönderme: geri alınan işaretleme sunucuya hiç gitmez; tekrar işaretlenen
  // (değersiz) gün sunucuda zaten tamam
  const cancels = op.kind === 'undo' ? !baseDone : baseDone && pending?.kind === 'undo' && !hasPayload(op);
  const next = cancels
    ? rest
    : [...rest, { ...op, id: newId(), userId: currentUserId, baseDone, queuedAt: new Date().toISOString(), attempts: 0 }];
  commit(next);

  if (reason === 'network') scheduleRetry();
  else flushCheckinQueue();
}

// Yansıtma (sunucu verisi + kuyruk) ---------------------------------------------------------------

/** Cihazın yerel günü (YYYY-MM-DD); kullanıcı saat dilimi cihazdan alınır */
export function deviceLocalDate(d: Date = new Date()): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Bir işlemin Bugün satırına etkisi (iyimser güncelleme ve yansıtma aynı kuralı kullanır) */
export function patchTask(task: TodayTask, op: CheckinOp): TodayTask {
  return op.kind === 'checkin'
    ? {
        ...task,
        done: true,
        value: op.value ?? task.value,
        note: op.note ?? task.note,
        photoUrl: op.photoFileUri ?? task.photoUrl,
      }
    : { ...task, done: false, value: null, photoUrl: null, note: null };
}

/**
 * Seri özetine bugünkü tamam sayısı değişimini uygula. Sunucu serisi bugünü de sayar (bugün
 * tamamsa +1); iyimser gösterimde aynı kural: hepsi tamama geçince +1, çıkınca −1.
 */
export function adjustStreak(summary: StreakSummary, delta: number): StreakSummary {
  if (!delta) return summary;
  const total = summary.totalToday;
  const doneToday = Math.max(0, Math.min(total, summary.doneToday + delta));
  const before = total > 0 && summary.doneToday >= total;
  const after = total > 0 && doneToday >= total;
  const currentStreak = Math.max(0, summary.currentStreak + Number(after) - Number(before));
  return { ...summary, doneToday, currentStreak, longestStreak: Math.max(summary.longestStreak, currentStreak) };
}

/** Takvimdeki işaretlemelere bir işlemin etkisi */
export function patchCalendarCheckins(checkins: Checkin[], op: CheckinOp & { userId?: string | null }): Checkin[] {
  const index = checkins.findIndex((c) => c.localDate === op.localDate);
  if (op.kind === 'undo') return index < 0 ? checkins : checkins.filter((_, i) => i !== index);
  const row = queuedCheckin(op, checkins[index]);
  return index < 0 ? [...checkins, row] : checkins.map((c, i) => (i === index ? row : c));
}

/** Kuyruktaki işaretlemenin sunucu cevabı yerine geçen satırı */
export function queuedCheckin(op: CheckinOp & { userId?: string | null }, previous?: Checkin): Checkin {
  return {
    id: previous?.id ?? `queued-${op.challengeId}-${op.localDate}`,
    challengeId: op.challengeId,
    userId: previous?.userId ?? op.userId ?? currentUserId ?? '',
    localDate: op.localDate,
    value: op.value ?? previous?.value ?? null,
    photoUrl: op.photoFileUri ?? previous?.photoUrl ?? null,
    note: op.note ?? previous?.note ?? null,
    createdAt: previous?.createdAt ?? new Date().toISOString(),
  };
}

/** Sunucudan gelen Bugün listesine bekleyen işlemleri uygula */
export function reflectToday(tasks: TodayTask[]): TodayTask[] {
  const ops = getCheckinQueue();
  if (!ops.length) return tasks;
  return tasks.map((task) =>
    ops.reduce((t, op) => (sameDay(op, task.challengeId, task.localDate) ? patchTask(t, op) : t), task),
  );
}

/** Sunucudan gelen seri özetine bugünün bekleyen işlemlerini uygula */
export function reflectStreak(summary: StreakSummary, today: LocalDate = deviceLocalDate()): StreakSummary {
  const days = new Map<string, { base: boolean; final: boolean }>();
  for (const op of getCheckinQueue()) {
    if (op.localDate !== today) continue;
    const day = days.get(op.challengeId);
    days.set(op.challengeId, { base: day ? day.base : op.baseDone, final: op.kind === 'checkin' });
  }
  let delta = 0;
  days.forEach(({ base, final }) => {
    delta += Number(final) - Number(base);
  });
  return adjustStreak(summary, delta);
}

/** Sunucudan gelen challenge takvimine bekleyen işlemleri uygula */
export function reflectCalendar(challengeId: string, calendar: ChallengeCalendar): ChallengeCalendar {
  const ops = getCheckinQueue().filter((op) => op.challengeId === challengeId);
  if (!ops.length) return calendar;
  return { ...calendar, checkins: ops.reduce(patchCalendarCheckins, calendar.checkins) };
}

// Boşaltma ------------------------------------------------------------------------------------------

let sync: { api: GazlaApi; client: QueryClient } | null = null;
let draining = false;
let again = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelay = 0;

function scheduleRetry() {
  if (retryTimer) return;
  retryDelay = Math.min(retryDelay ? retryDelay * 2 : RETRY_MIN_MS, RETRY_MAX_MS);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    flushCheckinQueue();
  }, retryDelay);
}

/** Oturum belirteci (PostgREST PGRST3xx) geçici olabilir: atmadan önce birkaç kez dene */
const isAuthError = (error: ApiError) => !!error.code?.startsWith('PGRST3');

function update(id: string, patch: Partial<QueuedCheckinOp>) {
  commit(all().map((o) => (o.id === id ? { ...o, ...patch } : o)));
}

function remove(id: string) {
  if (all().some((o) => o.id === id)) commit(all().filter((o) => o.id !== id));
}

const invalidate = (client: QueryClient, keys: readonly (readonly unknown[])[]) =>
  Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));

async function drain(api: GazlaApi, client: QueryClient) {
  let changed = false;
  try {
    while (onlineManager.isOnline()) {
      const op = getCheckinQueue()[0];
      if (!op) break;
      inFlightId = op.id;
      try {
        if (op.kind === 'checkin') {
          await api.checkin({
            challengeId: op.challengeId,
            localDate: op.localDate,
            value: op.value,
            photoFileUri: op.photoFileUri,
            note: op.note,
          });
        } else {
          await api.undoCheckin(op.challengeId, op.localDate);
        }
        inFlightId = null;
        remove(op.id);
        changed = true;
        retryDelay = 0;
      } catch (error) {
        inFlightId = null;
        if (isNetworkError(error) || !onlineManager.isOnline()) {
          scheduleRetry();
          break;
        }
        const rejected = error instanceof ApiError && !isAuthError(error);
        if (!rejected && op.attempts + 1 < MAX_ATTEMPTS) {
          update(op.id, { attempts: op.attempts + 1 });
          scheduleRetry();
          break;
        }
        // Sunucu kabul etmedi: işlem atılır, ekran sunucudaki duruma döner
        remove(op.id);
        changed = true;
        await invalidate(client, [queryKeys.today, queryKeys.streak, queryKeys.challenge(op.challengeId)]);
      }
    }
  } finally {
    inFlightId = null;
    if (changed) await invalidate(client, DAILY_KEYS);
  }
}

/** Kuyruğu şimdi boşaltmayı dene (çevrimiçi ve oturum hazırsa; sürüyorsa bitince bir tur daha) */
export function flushCheckinQueue(): void {
  if (!sync || !currentUserId || !onlineManager.isOnline() || !getCheckinQueue().length) return;
  if (draining) {
    again = true;
    return;
  }
  draining = true;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  const { api, client } = sync;
  void drain(api, client).finally(() => {
    draining = false;
    if (again) {
      again = false;
      flushCheckinQueue();
    }
  });
}

/**
 * Kuyruğu oturuma bağlar (DataProvider). `userId` oturum ve profil hazırken verilir; açılışta,
 * bağlantı gelince ve uygulama ön plana dönünce kuyruk boşaltılır.
 */
export function useCheckinQueueSync(api: GazlaApi, userId: string | null): void {
  const client = useQueryClient();
  useEffect(() => {
    sync = { api, client };
    if (currentUserId !== userId) {
      currentUserId = userId;
      listeners.forEach((l) => l());
    }
    if (!userId) return undefined;
    flushCheckinQueue();
    const unsubscribeOnline = onlineManager.subscribe((online) => {
      if (online) flushCheckinQueue();
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') flushCheckinQueue();
    });
    return () => {
      unsubscribeOnline();
      appState.remove();
    };
  }, [api, client, userId]);
}
