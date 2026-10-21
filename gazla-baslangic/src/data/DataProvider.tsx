/**
 * Veri sağlayıcı: TanStack Query istemcisi ve oturum durumu. Kök düzende (`app/_layout.tsx`)
 * tüm uygulamayı sarar.
 *
 * - Sorgu önbelleği MMKV'de kalıcıdır (`queryPersist.ts`): çevrimdışı açılışta profil, Bugün,
 *   seri, son günler, arkadaşlar önbellekten gelir ve uygulama `ready` açılır. Geri yüklenen veriye
 *   bekleyen işaretlemeler yeniden uygulanır.
 * - Kullanıcı değişince (çıkış, başka hesapla giriş) önbellek temizlenir; aynı kullanıcının oturum
 *   olayları (belirteç yenileme, ilk oturum) önbelleği silmez.
 * - Çevrimdışı açılışta oturum yenilenemezse son bilinen oturumla devam edilir (`lastSession.ts`),
 *   bağlantı gelince oturum yeniden sorulur.
 * - Bağlantı durumu `network.ts` ile onlineManager'a bağlıdır; oturum hazırken çevrimdışı
 *   işaretleme kuyruğu (`offlineQueue.ts`) açılışta ve bağlantı gelince boşaltılır.
 */
import { onlineManager, QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api } from './client';
import { recentDaysQuery } from './hooks';
import { forgetSession, lastSession, rememberSession } from './lastSession';
import { connectivityKnown } from './network';
import { reapplyCheckinQueue, useCheckinQueueSync } from './offlineQueue';
import { configurePersistedQueries, getCacheOwner, persistOptions, setCacheOwner } from './queryPersist';
import type { Profile, Session } from './types';

export type AuthStatus =
  /** Oturum bilgisi okunuyor */
  | 'loading'
  /** Oturum yok → onboarding (karşılama, giriş) */
  | 'signedOut'
  /** Oturum var, profil tamamlanmadı → onboarding Profil adımı */
  | 'needsProfile'
  /** Uygulama hazır */
  | 'ready';

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
};

const AuthContext = createContext<AuthState>({ status: 'loading', session: null, profile: null });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
    // Yazmalar çevrimdışıyken duraklayıp sonsuz beklemesin: istek hemen gider, ağ yoksa api NetworkError ile düşer
    // ("İnternet bağlantısı yok…" ekranda mutation.error olarak). İşaretleme/geri alma kendi kuyruğuyla zaten böyle.
    mutations: { networkMode: 'always' },
  },
});
configurePersistedQueries(queryClient);

const PERSIST_OPTIONS = persistOptions(api);

function AuthGate({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    let seq = 0;
    /** undefined: açılışta henüz bilinmiyor (önbellek geri yüklenen kullanıcınındır) */
    let userId: string | null | undefined;
    /** Oturum yenilenemedi, son bilinen oturumla çevrimdışı devam ediliyor */
    let offlineFallback = false;

    const apply = async (next: Session | null) => {
      const call = ++seq;
      let resolved = next;
      if (next) {
        rememberSession(next);
        offlineFallback = false;
      } else {
        // Çevrimdışıysa belirteç yenilenemediği için null gelmiş olabilir: bilerek çıkış
        // yapılmadıysa (forgetSession) son oturumla devam
        const online = await connectivityKnown();
        if (!active || call !== seq) return;
        resolved = online ? null : lastSession();
        offlineFallback = !!resolved;
        if (online) forgetSession();
      }
      const nextId = resolved?.userId ?? null;
      if (userId !== undefined && userId !== nextId) client.clear();
      userId = nextId;
      setCacheOwner(nextId);
      setSession(resolved);
    };

    const recheck = () =>
      api.getSession().then((s) => {
        if (active) void apply(s);
      });

    void recheck();
    const unsubscribe = api.onSessionChange((s) => void apply(s));
    const unsubscribeOnline = onlineManager.subscribe((online) => {
      if (online && offlineFallback) void recheck();
    });
    return () => {
      active = false;
      unsubscribe();
      unsubscribeOnline();
    };
  }, [client]);

  const profileQuery = useQuery({
    queryKey: ['me', 'profile', session?.userId ?? null],
    queryFn: () => api.getMyProfile(),
    enabled: !!session,
  });

  const state = useMemo<AuthState>(() => {
    if (session === undefined || (session && profileQuery.isPending)) {
      return { status: 'loading', session: session ?? null, profile: null };
    }
    if (!session) return { status: 'signedOut', session: null, profile: null };
    if (!profileQuery.data) return { status: 'needsProfile', session, profile: null };
    return { status: 'ready', session, profile: profileQuery.data };
  }, [session, profileQuery.isPending, profileQuery.data]);

  const ready = state.status === 'ready';
  useCheckinQueueSync(api, ready ? state.session!.userId : null);

  // Completion haftası çevrimdışı da açılsın: son günler önden çekilir (kalıcı önbelleğe girer)
  useEffect(() => {
    if (ready) void client.prefetchQuery(recentDaysQuery(7));
  }, [ready, client]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={PERSIST_OPTIONS}
      onSuccess={() => reapplyCheckinQueue(queryClient, getCacheOwner())}>
      <AuthGate>{children}</AuthGate>
    </PersistQueryClientProvider>
  );
}

/** Oturum ve profil durumu */
export function useAuth() {
  return useContext(AuthContext);
}
