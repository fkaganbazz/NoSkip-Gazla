/**
 * Veri sağlayıcı: TanStack Query istemcisi ve oturum durumu. Kök düzende (`app/_layout.tsx`)
 * tüm uygulamayı sarar. Oturum değişince önbellek temizlenir (başka kullanıcının verisi kalmasın).
 */
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api } from './client';
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
  },
});

function AuthGate({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    api.getSession().then((s) => active && setSession(s));
    const unsubscribe = api.onSessionChange((s) => {
      setSession(s);
      client.clear();
    });
    return () => {
      active = false;
      unsubscribe();
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

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>{children}</AuthGate>
    </QueryClientProvider>
  );
}

/** Oturum ve profil durumu */
export function useAuth() {
  return useContext(AuthContext);
}
