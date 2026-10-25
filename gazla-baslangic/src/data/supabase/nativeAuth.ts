/**
 * Apple ve Google ile giriş (supabaseApi.signInWithProvider):
 * - iOS'ta Apple: expo-apple-authentication. Ham nonce Supabase'e, SHA-256'sı Apple'a gider; Apple'ın
 *   kimlik belirteci `auth.signInWithIdToken({ provider: 'apple', token, nonce })` ile oturuma çevrilir.
 *   Apple adı yalnızca ilk girişte verir: kullanıcı meta verisine yazılır (Profile adımında ad önerisi).
 * - Google: @react-native-google-signin/google-signin `signIn()` → idToken →
 *   `auth.signInWithIdToken({ provider: 'google', token })`.
 * - Native yol yoksa (web, Android'de Apple, native modülü olmayan eski geliştirme derlemesi, Google
 *   istemci kimliği tanımsız) Supabase OAuth tarayıcı akışı.
 *
 * Kullanıcı pencereyi kapatırsa `ApiError` kodu 'CANCELLED' (ekran sessiz geçer; `isCancelledError`).
 * Supabase Auth hataları `authError` ile uygulama dilindeki `ApiError`'a çevrilir (`t.errors.auth`).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { googleSignInConfig } from '../../config/auth';
import { getT } from '../../i18n';
import { ApiError, ApiErrorCode, isNetworkError, type OAuthProvider } from '../api';
import { authCancelled, authError, authNotCompleted, parseAuthRedirect, redirectError } from '../authRedirect';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

export const cancelledError = authCancelled;

let googleModule: GoogleSignInModule | null | undefined;

/**
 * google-signin native modülü içe aktarılırken yoksa hata fırlatır (TurboModuleRegistry.getEnforcing);
 * bu yüzden ilk kullanımda ve korumalı yüklenir. Web'de paketin web eşi "yalnızca sponsorlara" uyarısı
 * verdiği için hiç yüklenmez.
 */
function loadGoogleSignIn(): GoogleSignInModule | null {
  if (googleModule !== undefined) return googleModule;
  if (Platform.OS === 'web') {
    googleModule = null;
    return null;
  }
  try {
    googleModule = require('@react-native-google-signin/google-signin') as GoogleSignInModule;
  } catch {
    googleModule = null;
  }
  return googleModule;
}

let googleConfigured = false;

function configuredGoogle(): GoogleSignInModule | null {
  const { webClientId, iosClientId } = googleSignInConfig;
  // idToken için web istemci kimliği şart; iOS'ta ayrıca iOS istemci kimliği
  if (!webClientId || (Platform.OS === 'ios' && !iosClientId)) return null;
  const google = loadGoogleSignIn();
  if (!google) return null;
  if (!googleConfigured) {
    google.GoogleSignin.configure({ webClientId, iosClientId, scopes: ['email', 'profile'] });
    googleConfigured = true;
  }
  return google;
}

/** Uygulama içi kullanım: native Google girişi bu derlemede kullanılabilir mi */
export const isNativeGoogleSignInAvailable = () => configuredGoogle() !== null;

const codeOf = (error: unknown) =>
  error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : null;

// Apple -----------------------------------------------------------------------------------------

async function randomNonce(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function signInWithApple(supabase: SupabaseClient): Promise<void> {
  const rawNonce = await randomNonce();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (codeOf(error) === 'ERR_REQUEST_CANCELED') throw cancelledError();
    throw new ApiError(getT().errors.auth.appleFailed, codeOf(error));
  }
  if (!credential.identityToken) throw authNotCompleted();

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw authError(error);

  // Apple adı yalnızca ilk girişte verir; sonra bir daha gelmez. Profil önerisi için sakla.
  const name = credential.fullName;
  if (name && (name.givenName || name.familyName)) {
    const fullName = [name.givenName, name.familyName].filter(Boolean).join(' ');
    await supabase.auth
      .updateUser({ data: { full_name: fullName, given_name: name.givenName ?? null, family_name: name.familyName ?? null } })
      .catch(() => undefined);
  }
}

// Google ----------------------------------------------------------------------------------------

async function signInWithGoogle(google: GoogleSignInModule, supabase: SupabaseClient): Promise<void> {
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = google;
  let idToken: string | null;
  try {
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) throw cancelledError();
    idToken = response.data.idToken;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) throw cancelledError();
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new ApiError(getT().errors.auth.googleInProgress, ApiErrorCode.cancelled);
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new ApiError(getT().errors.auth.googlePlayServices, error.code);
      }
    }
    throw new ApiError(getT().errors.auth.googleFailed, codeOf(error));
  }
  if (!idToken) throw authNotCompleted();

  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw authError(error);
}

/** Çıkışta Google hesabı seçimini sıfırla (bir sonraki girişte hesap seçici açılsın); hata yok sayılır */
export async function signOutNativeProviders(): Promise<void> {
  const google = googleModule;
  if (!google) return;
  try {
    if (google.GoogleSignin.hasPreviousSignIn()) await google.GoogleSignin.signOut();
  } catch {
    // yok say
  }
}

// Giriş dönüşü (PKCE) ---------------------------------------------------------------------------

/** E-posta bağlantısı ve tarayıcı akışının döndüğü adres (`app/auth/callback.tsx`) */
export const authRedirectUrl = () => Linking.createURL('auth/callback');

const exchanges = new Map<string, Promise<void>>();

/**
 * Dönüş adresindeki kodu oturuma çevirir. Kod tek kullanımlıktır: Android'de tarayıcı akışının dönüşü hem
 * `openAuthSessionAsync`'e hem expo-router'a (auth/callback ekranı) gelir; ikisi aynı isteği bekler.
 */
export function exchangeAuthCode(supabase: SupabaseClient, code: string): Promise<void> {
  let exchange = exchanges.get(code);
  if (!exchange) {
    exchange = supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) throw authError(error);
      })
      .catch((error: unknown) => {
        // İstek sunucuya ulaşmadıysa kod hâlâ geçerli: yeniden denenebilsin
        if (isNetworkError(error)) exchanges.delete(code);
        throw error;
      });
    exchanges.set(code, exchange);
  }
  return exchange;
}

/** Dönüş adresini işler: hata varsa fırlatır, kod varsa oturuma çevirir; ikisi de yoksa false */
export async function completeAuthRedirect(
  supabase: SupabaseClient,
  params: ReturnType<typeof parseAuthRedirect>,
): Promise<boolean> {
  const error = redirectError(params);
  if (error) throw error;
  if (!params.code) return false;
  await exchangeAuthCode(supabase, params.code);
  return true;
}

// OAuth tarayıcı akışı (yedek) -----------------------------------------------------------------

async function signInWithBrowser(supabase: SupabaseClient, provider: OAuthProvider): Promise<void> {
  const redirectTo = authRedirectUrl();
  if (Platform.OS === 'web') {
    // Sayfa sağlayıcıya gider, dönüşte auth/callback ekranı kodu oturuma çevirir
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) throw authError(error);
    return;
  }
  // Tarayıcıda oturum aç, dönüş adresindeki kodu oturuma çevir (PKCE)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw authError(error);
  const result = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
  if (result.type === 'cancel' || result.type === 'dismiss') throw cancelledError();
  if (result.type !== 'success') throw authNotCompleted();
  // Sağlayıcı reddettiyse (error=access_denied) kullanıcı vazgeçmiştir
  if (!(await completeAuthRedirect(supabase, parseAuthRedirect(result.url)))) throw authNotCompleted();
}

export async function signInWithProvider(supabase: SupabaseClient, provider: OAuthProvider): Promise<void> {
  if (provider === 'apple' && Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync())) {
    return signInWithApple(supabase);
  }
  if (provider === 'google') {
    const google = configuredGoogle();
    if (google) return signInWithGoogle(google, supabase);
  }
  return signInWithBrowser(supabase, provider);
}
