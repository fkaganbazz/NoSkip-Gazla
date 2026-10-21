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
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { googleSignInConfig } from '../../config/auth';
import { ApiError, ApiErrorCode, type OAuthProvider } from '../api';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

type Fail = (error: { message: string; code?: string } | null) => never;

export const cancelledError = () => new ApiError('Giriş iptal edildi', ApiErrorCode.cancelled);

const NOT_COMPLETED = 'Giriş tamamlanmadı. Tekrar dene.';

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

async function signInWithApple(supabase: SupabaseClient, fail: Fail): Promise<void> {
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
    throw new ApiError('Apple ile giriş tamamlanamadı. Tekrar dene.', codeOf(error));
  }
  if (!credential.identityToken) throw new ApiError(NOT_COMPLETED);

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) fail(error);

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

async function signInWithGoogle(google: GoogleSignInModule, supabase: SupabaseClient, fail: Fail): Promise<void> {
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
      if (error.code === statusCodes.IN_PROGRESS) throw new ApiError('Giriş zaten sürüyor.', ApiErrorCode.cancelled);
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new ApiError('Google ile giriş için Google Play Hizmetleri gerekli.', error.code);
      }
    }
    throw new ApiError('Google ile giriş tamamlanamadı. Tekrar dene.', codeOf(error));
  }
  if (!idToken) throw new ApiError(NOT_COMPLETED);

  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) fail(error);
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

// OAuth tarayıcı akışı (yedek) -----------------------------------------------------------------

async function signInWithBrowser(supabase: SupabaseClient, provider: OAuthProvider, fail: Fail): Promise<void> {
  const redirectTo = Linking.createURL('auth/callback');
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) fail(error);
    return;
  }
  // Tarayıcıda oturum aç, dönüş adresindeki kodu oturuma çevir (PKCE)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) fail(error);
  const result = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
  if (result.type === 'cancel' || result.type === 'dismiss') throw cancelledError();
  if (result.type !== 'success') throw new ApiError(NOT_COMPLETED);
  const params = Linking.parse(result.url).queryParams ?? {};
  const code = params.code;
  if (typeof code !== 'string') {
    // Sağlayıcı reddettiyse (ör. error=access_denied) kullanıcı vazgeçmiştir
    if (params.error === 'access_denied') throw cancelledError();
    throw new ApiError(NOT_COMPLETED);
  }
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) fail(exchangeError);
}

export async function signInWithProvider(supabase: SupabaseClient, provider: OAuthProvider, fail: Fail): Promise<void> {
  if (provider === 'apple' && Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync())) {
    return signInWithApple(supabase, fail);
  }
  if (provider === 'google') {
    const google = configuredGoogle();
    if (google) return signInWithGoogle(google, supabase, fail);
  }
  return signInWithBrowser(supabase, provider, fail);
}
