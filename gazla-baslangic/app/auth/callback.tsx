import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, LoadingState } from '@/components/ui';
import { isCancelledError, isNetworkError, parseAuthRedirect, useAuth, useCompleteAuthRedirect } from '@/data';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { useT } from '@/i18n';

// Giriş dönüşü: e-posta bağlantısı ve tarayıcı akışı gazla://auth/callback?code=… adresine döner (PKCE; web'de
// <site>/auth/callback). Kod oturuma çevrilir; oturum açılınca önceki ekrana döner (onboarding düzeni profil
// adımına, profil hazırsa uygulamaya taşır). Bağlantının süresi dolduysa ya da başka cihazda istendiyse nedeni ve
// "Girişe dön". Vazgeçildiyse ya da oturum zaten açıksa (eski bağlantı) sessizce geri döner. Uygulama bu adresle
// açıldıysa (geri gidilecek ekran yok) uygulama açıksa Bugün'e, değilse onboarding'e (giriş ya da kaldığı adım) gider.
export default function AuthCallbackScreen() {
  const router = useRouter();
  const t = useT();
  const search = useLocalSearchParams();
  const url = Linking.useLinkingURL();
  const { status } = useAuth();
  const onboarding = useOnboarding();
  const complete = useCompleteAuthRedirect();
  const [done, setDone] = useState(false);

  // Adresin ilk hali: sonradan gelen başka bir bağlantı bu ekranın işini değiştirmesin
  const [params] = useState(() => parseAuthRedirect(url, search));
  const signedIn = status === 'needsProfile' || status === 'ready';
  // app/_layout.tsx ile aynı koşul: değilse "/" korumalı, onboarding açık
  const appOpen = status === 'ready' && !onboarding.inProgress;

  const { mutate } = complete;
  const run = useCallback(() => mutate(params, { onSuccess: () => setDone(true) }), [mutate, params]);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
  }, [run]);

  const error = complete.error;
  const silent = !!error && (isCancelledError(error) || signedIn);
  const left = useRef(false);
  const leave = useCallback(() => {
    if (left.current) return;
    left.current = true;
    if (router.canGoBack()) router.back();
    else if (appOpen) router.replace('/');
    // Oturum açıldıysa onboarding düzeni kaldığı adıma taşır
    else router.replace(signedIn ? '/welcome' : '/sign-in');
  }, [router, appOpen, signedIn]);
  // Oturum durumu güncellenince çık (önce çıkılırsa giriş ekranı bir an görünür)
  useEffect(() => {
    if ((done && signedIn) || silent) leave();
  }, [done, signedIn, silent, leave]);

  const retryable = useMemo(() => !!error && isNetworkError(error), [error]);

  return (
    <SafeAreaView style={styles.screen}>
      {error && !silent ? (
        retryable ? (
          <ErrorState message={error.message} onRetry={run} />
        ) : (
          <ErrorState
            message={error.message}
            actionLabel={t.auth.callback.backToSignIn}
            onRetry={() => router.replace('/sign-in')}
          />
        )
      ) : (
        <LoadingState />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
