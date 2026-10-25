/**
 * Giriş dönüşü ve Supabase Auth hataları.
 *
 * E-posta bağlantısı ve tarayıcı akışı (PKCE) `gazla://auth/callback?code=…` adresine döner
 * (`app/auth/callback.tsx`); kod `auth.exchangeCodeForSession` ile oturuma çevrilir. Hata olursa Supabase
 * `error`, `error_code`, `error_description` ekler: PKCE'de sorgu dizgisinde, eski (implicit) akışta `#`
 * sonrasında gelir; ikisi de okunur.
 *
 * Auth hatalarının metni İngilizcedir; kullanıcıya `authError` ile Türkçe `ApiError` gösterilir.
 */
import { ApiError, ApiErrorCode, NetworkError } from './api';

export type AuthRedirectParams = {
  /** PKCE kodu (tek kullanımlık) */
  code?: string;
  /** OAuth hatası (`access_denied`: kullanıcı vazgeçti ya da bağlantı geçersiz) */
  error?: string;
  /** Supabase hata kodu (`otp_expired` …) */
  errorCode?: string;
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) || undefined;

/** `a=1&b=2` → { a: '1', b: '2' } (`+` boşluktur) */
function parseQuery(query: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of query.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const key = eq < 0 ? part : part.slice(0, eq);
    const value = eq < 0 ? '' : part.slice(eq + 1);
    try {
      out[decodeURIComponent(key.replace(/\+/g, ' '))] = decodeURIComponent(value.replace(/\+/g, ' '));
    } catch {
      // bozuk yüzde kodlaması: parametre atlanır
    }
  }
  return out;
}

/**
 * Dönüş adresinin parametreleri: adresin sorgu dizgisi ve `#` sonrası, üstüne route parametreleri
 * (expo-router `useLocalSearchParams`; `#` sonrasını vermez).
 */
export function parseAuthRedirect(url: string | null | undefined, search: SearchParams = {}): AuthRedirectParams {
  let fromUrl: Record<string, string> = {};
  if (url) {
    const hashAt = url.indexOf('#');
    const beforeHash = hashAt < 0 ? url : url.slice(0, hashAt);
    const queryAt = beforeHash.indexOf('?');
    fromUrl = {
      ...(hashAt < 0 ? {} : parseQuery(url.slice(hashAt + 1))),
      ...(queryAt < 0 ? {} : parseQuery(beforeHash.slice(queryAt + 1))),
    };
  }
  const pick = (key: string) => first(search[key]) ?? (fromUrl[key] || undefined);
  const params: AuthRedirectParams = {};
  const code = pick('code');
  const error = pick('error');
  const errorCode = pick('error_code');
  if (code) params.code = code;
  if (error) params.error = error;
  if (errorCode) params.errorCode = errorCode;
  return params;
}

export const AUTH_NOT_COMPLETED = 'Giriş tamamlanmadı. Tekrar dene.';

const LINK_EXPIRED = 'Bu giriş bağlantısının süresi dolmuş. Yeni bir bağlantı iste.';
const LINK_INVALID = 'Bu bağlantı artık geçerli değil. Giriş bağlantısını bu cihazdan yeniden iste ve aynı cihazda aç.';

/** Supabase Auth hata kodu → kullanıcıya gösterilecek metin */
const AUTH_MESSAGES: Record<string, string> = {
  otp_expired: LINK_EXPIRED,
  flow_state_expired: LINK_EXPIRED,
  flow_state_not_found: LINK_INVALID,
  bad_code_verifier: LINK_INVALID,
  over_email_send_rate_limit: 'Çok sık denedin. Birkaç dakika sonra tekrar dene.',
  over_request_rate_limit: 'Çok sık denedin. Birkaç dakika sonra tekrar dene.',
  email_address_invalid: 'Geçerli bir e-posta yaz',
  email_address_not_authorized: 'Bu adrese şu an e-posta gönderilemiyor. Apple ya da Google ile devam et.',
  email_provider_disabled: 'E-postayla giriş şu an kapalı. Apple ya da Google ile devam et.',
  provider_disabled: 'Bu giriş yolu şu an kapalı. Başka bir yolla devam et.',
  signup_disabled: 'Şu an yeni hesap açılamıyor. Biraz sonra tekrar dene.',
  user_banned: 'Bu hesap kullanıma kapatıldı.',
};

type AuthErrorLike = { message?: string; code?: string | null; name?: string; status?: number } | null | undefined;

/**
 * Supabase Auth hatası (ya da dönüş adresindeki hata kodu) → Türkçe `ApiError`.
 * Ağ hatası `NetworkError`; OAuth `access_denied` (kodsuz) vazgeçmedir: `ApiErrorCode.cancelled`.
 */
export function authError(error: AuthErrorLike, fallback = AUTH_NOT_COMPLETED): ApiError {
  if (error instanceof ApiError) return error;
  if (error?.name === 'AuthRetryableFetchError' || error?.name === 'AuthNetworkError') return new NetworkError();
  // Doğrulayıcı cihazda yok: bağlantı başka cihazda ya da tarayıcıda istenmiş
  if (error?.name === 'AuthPKCECodeVerifierMissingError') return new ApiError(LINK_INVALID, 'bad_code_verifier');
  const code = error?.code ?? null;
  if (code === 'access_denied') return new ApiError('Giriş iptal edildi', ApiErrorCode.cancelled);
  const message = code ? AUTH_MESSAGES[code] : undefined;
  if (message) return new ApiError(message, code);
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('[auth]', error);
  return new ApiError(fallback, code);
}

/** Dönüş adresindeki hata → `ApiError` (hata yoksa null) */
export function redirectError({ error, errorCode }: AuthRedirectParams): ApiError | null {
  if (!error && !errorCode) return null;
  return authError({ code: errorCode ?? error });
}
