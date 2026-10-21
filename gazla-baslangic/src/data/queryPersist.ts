/**
 * Sorgu önbelleğinin kalıcılığı (MMKV, `storage.ts`): uygulama çevrimdışı açılınca son bilinen
 * profil, Bugün, seri, son günler, arkadaşlar ve challenge ekranları önbellekten gelir.
 * Çevrimiçiyse eskimiş sorgular her zamanki gibi sunucudan yenilenir.
 *
 * - Yalnızca açılış ve işaretleme için gereken, hassas olmayan ve küçük sorgular (`PERSISTED`).
 *   Aktivite, arama, arkadaş profili, dürtme durumu ve tek seferlik akışlar (bitti, kurtarma)
 *   saklanmaz. Mutation'lar saklanmaz (işaretlemeler kendi kuyruğunda: `offlineQueue.ts`).
 * - Önbellek kullanıcıya bağlıdır: sahibi (`cacheOwner`) önbellekle birlikte yazılır; geri yüklerken
 *   oturumdaki kullanıcı başkaysa atılır. Kullanıcı değişince DataProvider önbelleği temizler.
 * - `BUSTER` sürüm anahtarı (veri biçimi değişince artır) ve veri kaynağı (mock/supabase);
 *   `MAX_AGE` 7 gün. Saklanan sorgular bellekte de o kadar kalır (`gcTime`).
 * - Mock: örnek veri her açılışta (sayfa yenilenince) baştan kurulur. Kalıcı önbellek mock'la
 *   çelişmesin diye mock'ta yalnızca çevrimdışı açılışta geri yüklenir (sunucuya ulaşılamazken
 *   son bilinen durum); çevrimiçi açılışta atılır ve veri yeni örnek veriden gelir.
 */
import { defaultShouldDehydrateQuery, type Query, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { PersistQueryClientOptions, PersistedClient, Persister } from '@tanstack/react-query-persist-client';

import type { GazlaApi } from './api';
import { lastSession } from './lastSession';
import { connectivityKnown } from './network';
import { storage } from './storage';

const STORAGE_KEY = 'queryCache';
/** Önbellek biçimi değişince (sorgu verisinin şekli) artır: eski önbellek atılır */
const BUSTER = '1';
export const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/** Saklanan sorgular (anahtar önekleri) */
const PERSISTED: QueryKey[] = [
  ['me', 'profile'],
  ['me', 'settings'],
  ['me', 'today'],
  ['me', 'streak'],
  ['me', 'recentDays'],
  ['me', 'garden'],
  ['me', 'badges'],
  ['friends', 'today'],
];
/** challenge/{id} ve altındakilerden saklananlar (Detay, sayı girişi) */
const PERSISTED_CHALLENGE_PARTS = new Set(['membership', 'calendar', 'board']);

const startsWith = (key: QueryKey, prefix: QueryKey) => prefix.every((part, i) => key[i] === part);

export function isPersistedKey(key: QueryKey): boolean {
  if (key[0] === 'challenge' && typeof key[1] === 'string' && key[1]) {
    return key.length === 2 || (key.length === 3 && PERSISTED_CHALLENGE_PARTS.has(String(key[2])));
  }
  return PERSISTED.some((prefix) => startsWith(key, prefix));
}

const shouldDehydrateQuery = (query: Query) => defaultShouldDehydrateQuery(query) && isPersistedKey(query.queryKey);

/** Saklanan sorgular bellekte de `MAX_AGE` kadar kalsın (gözlemcisiz geri yüklenenler silinmesin) */
export function configurePersistedQueries(client: QueryClient): void {
  for (const prefix of [...PERSISTED, ['challenge'] as QueryKey]) client.setQueryDefaults(prefix, { gcTime: MAX_AGE });
}

// Sahip ---------------------------------------------------------------------------------------------

let cacheOwner: string | null = null;

/** Önbelleğin sahibi (oturumdaki kullanıcı); DataProvider oturum değişince günceller */
export function setCacheOwner(userId: string | null): void {
  cacheOwner = userId;
}

export const getCacheOwner = () => cacheOwner;

type StoredClient = PersistedClient & { owner?: string | null };

const mmkvStorage = {
  getItem: (key: string) => {
    try {
      return storage.getString(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => {
    try {
      storage.remove(key);
    } catch {
      // yok say
    }
  },
};

function createPersister(api: GazlaApi): Persister {
  const base = createSyncStoragePersister({
    storage: mmkvStorage,
    key: STORAGE_KEY,
    throttleTime: 500,
    serialize: (client) => JSON.stringify({ ...client, owner: cacheOwner } satisfies StoredClient),
  });
  return {
    persistClient: base.persistClient,
    removeClient: base.removeClient,
    async restoreClient() {
      const stored = (await base.restoreClient()) as StoredClient | undefined;
      if (!stored) return undefined;
      const online = await connectivityKnown();
      if (api.kind === 'mock' && online) return discard(base);
      // Çevrimdışı açılışta Supabase süresi dolan oturumu yenileyemez: son bilinen oturum
      const session = (await api.getSession()) ?? (online ? null : lastSession());
      if (session) setCacheOwner(session.userId);
      if (!session || stored.owner !== session.userId) return discard(base);
      return stored;
    },
  };
}

async function discard(persister: Persister) {
  await persister.removeClient();
  return undefined;
}

/** `PersistQueryClientProvider` seçenekleri */
export function persistOptions(api: GazlaApi): Omit<PersistQueryClientOptions, 'queryClient'> {
  return {
    persister: createPersister(api),
    maxAge: MAX_AGE,
    buster: `${BUSTER}:${api.kind}`,
    dehydrateOptions: {
      shouldDehydrateQuery,
      shouldDehydrateMutation: () => false,
    },
  };
}
