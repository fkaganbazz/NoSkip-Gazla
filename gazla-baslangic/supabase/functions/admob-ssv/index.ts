/**
 * AdMob ödüllü reklam sunucu doğrulaması (SSV) — StreakLost "Reklam izle, Diken'i sula".
 *
 * Google, kullanıcı ödülü kazanınca bu adrese GET atar:
 *   ?ad_network=…&ad_unit=…&custom_data=…&reward_amount=…&reward_item=…&timestamp=…
 *    &transaction_id=…&user_id=…&signature=…&key_id=…
 * İmza, sorgu dizesinin `&signature=`'dan önceki kısmının (alındığı gibi, kodlanmış hâliyle) ECDSA
 * P-256 / SHA-256 imzasıdır (DER, base64url). Açık anahtarlar
 * https://www.gstatic.com/admob/reward/verifier-keys.json'dan alınır ve önbelleğe konur.
 *
 * İmza geçerliyse `user_id` (Supabase kullanıcı kimliği) ve `custom_data` ({"challengeId","missedDate"};
 * uygulama src/data/adRescue.ts `adRescueSsvOptions` ile verir) ile service role üzerinden
 * `grant_ad_rescue(user, challenge, gün, transaction_id)` çağrılır. Kurtarma kuralları sunucuda; kural
 * reddederse sebep `record_ad_rescue_failure` ile kaydedilir (uygulama `ad_rescue_result` ile görür).
 *
 * Dağıtım: `supabase functions deploy admob-ssv --no-verify-jwt` (Google oturum belirteci göndermez).
 * AdMob → Uygulama → Reklam birimi → "Sunucu tarafı doğrulama" adresi:
 *   https://<proje>.supabase.co/functions/v1/admob-ssv
 */
import { createClient } from '@supabase/supabase-js';

// Deno çalışma zamanı (Supabase Edge Runtime); tip denetimi Node'da da çalışsın diye yerel bildirim
declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): unknown;
  env: { get(name: string): string | undefined };
};

export const VERIFIER_KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';
const KEY_CACHE_MS = 24 * 60 * 60 * 1000;

// İmza doğrulama ------------------------------------------------------------------------------------

type VerifierKey = { keyId: number | string; pem?: string; base64?: string };

/** base64 ya da base64url (dolgulu/dolgusuz) → bayt */
export function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * DER (ASN.1 SEQUENCE { INTEGER r, INTEGER s }) ECDSA imzası → WebCrypto'nun beklediği ham r‖s
 * (P-256 için 2 × 32 bayt). Geçersiz yapıda null.
 */
export function derToRawSignature(der: Uint8Array, size = 32): Uint8Array<ArrayBuffer> | null {
  let offset = 0;
  const readLength = (): number | null => {
    if (offset >= der.length) return null;
    let length = der[offset++];
    if (length & 0x80) {
      const count = length & 0x7f;
      if (count === 0 || count > 2 || offset + count > der.length) return null;
      length = 0;
      for (let i = 0; i < count; i++) length = (length << 8) | der[offset++];
    }
    return length;
  };
  const readInteger = (): Uint8Array | null => {
    if (der[offset++] !== 0x02) return null;
    const length = readLength();
    if (length === null || length === 0 || offset + length > der.length) return null;
    let value = der.subarray(offset, offset + length);
    offset += length;
    // Başta işaret için eklenen 0x00 baytları at; kısa değeri sola sıfırla doldur
    while (value.length > size && value[0] === 0) value = value.subarray(1);
    if (value.length > size) return null;
    const out = new Uint8Array(size);
    out.set(value, size - value.length);
    return out;
  };

  if (der[offset++] !== 0x30) return null;
  const total = readLength();
  if (total === null || offset + total !== der.length) return null;
  const r = readInteger();
  const s = r && readInteger();
  if (!r || !s || offset !== der.length) return null;
  const raw = new Uint8Array(size * 2);
  raw.set(r, 0);
  raw.set(s, size);
  return raw;
}

function spkiBytes(key: VerifierKey): Uint8Array<ArrayBuffer> | null {
  if (key.base64) return decodeBase64(key.base64);
  if (key.pem) return decodeBase64(key.pem.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, ''));
  return null;
}

export type SsvParts = { message: string; signature: string; keyId: string; params: URLSearchParams };

/**
 * Ham sorgu dizesini (başındaki "?" olmadan) imzalanan kısım, imza ve anahtar kimliği olarak ayırır.
 * Google'ın biçiminde `signature` ve `key_id` her zaman sondadır.
 */
export function splitSsvQuery(rawQuery: string): SsvParts | null {
  const query = rawQuery.startsWith('?') ? rawQuery.slice(1) : rawQuery;
  const at = query.indexOf('&signature=');
  if (at <= 0) return null;
  const params = new URLSearchParams(query);
  const signature = params.get('signature');
  const keyId = params.get('key_id');
  if (!signature || !keyId) return null;
  return { message: query.slice(0, at), signature, keyId, params };
}

export async function importVerifierKey(key: VerifierKey): Promise<CryptoKey | null> {
  const spki = spkiBytes(key);
  if (!spki) return null;
  try {
    return await crypto.subtle.importKey('spki', spki, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  } catch {
    return null;
  }
}

export async function verifySsvSignature(parts: SsvParts, key: CryptoKey): Promise<boolean> {
  let der: Uint8Array<ArrayBuffer>;
  try {
    der = decodeBase64(parts.signature);
  } catch {
    return false;
  }
  const raw = derToRawSignature(der);
  if (!raw) return false;
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    raw,
    new TextEncoder().encode(parts.message),
  );
}

// Anahtar önbelleği ------------------------------------------------------------------------------

let keyCache: { at: number; keys: Map<string, CryptoKey> } | null = null;

async function fetchVerifierKeys(fetcher: typeof fetch): Promise<Map<string, CryptoKey>> {
  const response = await fetcher(VERIFIER_KEYS_URL);
  if (!response.ok) throw new Error(`verifier keys ${response.status}`);
  const body = (await response.json()) as { keys?: VerifierKey[] };
  const keys = new Map<string, CryptoKey>();
  for (const key of body.keys ?? []) {
    const imported = await importVerifierKey(key);
    if (imported) keys.set(String(key.keyId), imported);
  }
  return keys;
}

/** Anahtar kimliğine göre doğrulayıcı; önbellekte yoksa (anahtar döndürüldüyse) bir kez yeniden çeker */
export async function verifierKey(keyId: string, fetcher: typeof fetch = fetch, now = Date.now()): Promise<CryptoKey | null> {
  if (!keyCache || now - keyCache.at > KEY_CACHE_MS) {
    keyCache = { at: now, keys: await fetchVerifierKeys(fetcher) };
  }
  let key = keyCache.keys.get(keyId);
  if (!key && now - keyCache.at > 60_000) {
    keyCache = { at: now, keys: await fetchVerifierKeys(fetcher) };
    key = keyCache.keys.get(keyId);
  }
  return key ?? null;
}

/** Testler için */
export function resetVerifierKeyCache() {
  keyCache = null;
}

// Ödül verisi -----------------------------------------------------------------------------------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type AdRescueReward = { userId: string; challengeId: string; missedDate: string; transactionId: string };

/** İmzası doğrulanmış parametrelerden kurtarma isteği; eksik/bozuksa sebep */
export function parseReward(params: URLSearchParams): AdRescueReward | { invalid: string } {
  const userId = params.get('user_id') ?? '';
  const transactionId = params.get('transaction_id') ?? '';
  const customData = params.get('custom_data') ?? '';
  if (!UUID.test(userId)) return { invalid: 'user_id' };
  if (transactionId.length < 8 || transactionId.length > 200) return { invalid: 'transaction_id' };
  let data: unknown;
  try {
    data = JSON.parse(customData);
  } catch {
    return { invalid: 'custom_data' };
  }
  const { challengeId, missedDate } = (data ?? {}) as { challengeId?: unknown; missedDate?: unknown };
  if (typeof challengeId !== 'string' || !UUID.test(challengeId)) return { invalid: 'challengeId' };
  if (typeof missedDate !== 'string' || !DATE.test(missedDate)) return { invalid: 'missedDate' };
  return { userId, challengeId, missedDate, transactionId };
}

/** grant_ad_rescue'nun iş kuralı hataları (kayıt edilir, 200 döner); diğerleri sunucu hatası */
const RULE_ERRORS = new Set(['P0001', 'P0002', '22023', '22P02', '23503', '23505']);

// HTTP ----------------------------------------------------------------------------------------------

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

type Deps = {
  fetcher?: typeof fetch;
  rpc?: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>;
};

function adminRpc(): NonNullable<Deps['rpc']> {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tanımlı değil');
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return async (fn, args) => {
    const { data, error } = await admin.rpc(fn, args);
    return { data, error: error ? { message: error.message, code: error.code } : null };
  };
}

export async function handleSsv(request: Request, deps: Deps = {}): Promise<Response> {
  if (request.method !== 'GET') return json(405, { error: 'Yalnızca GET' });

  const parts = splitSsvQuery(new URL(request.url).search);
  if (!parts) return json(400, { error: 'İmza yok' });

  let key: CryptoKey | null;
  try {
    key = await verifierKey(parts.keyId, deps.fetcher ?? fetch);
  } catch (error) {
    console.error('admob-ssv: doğrulama anahtarları alınamadı', error);
    return json(503, { error: 'Doğrulama anahtarları alınamadı' });
  }
  if (!key || !(await verifySsvSignature(parts, key))) {
    return json(403, { error: 'İmza doğrulanamadı' });
  }

  // AdMob panelindeki "doğrulama adresini test et" isteği kullanıcı verisi taşımaz
  if (!parts.params.get('user_id') && !parts.params.get('custom_data')) return json(200, { ok: true, test: true });

  const reward = parseReward(parts.params);
  if ('invalid' in reward) {
    console.warn('admob-ssv: geçersiz ödül verisi', reward.invalid);
    return json(200, { ok: false, reason: reward.invalid });
  }

  const rpc = deps.rpc ?? adminRpc();
  const { error } = await rpc('grant_ad_rescue', {
    p_user: reward.userId,
    p_challenge: reward.challengeId,
    p_missed_date: reward.missedDate,
    p_ad_reward_id: reward.transactionId,
  });
  if (!error) return json(200, { ok: true });

  if (error.code && RULE_ERRORS.has(error.code)) {
    const recorded = await rpc('record_ad_rescue_failure', {
      p_user: reward.userId,
      p_challenge: reward.challengeId,
      p_missed_date: reward.missedDate,
      p_ad_reward_id: reward.transactionId,
      p_message: error.message,
      p_code: error.code,
    });
    if (recorded.error) console.error('admob-ssv: ret kaydedilemedi', recorded.error.message);
    return json(200, { ok: false, reason: error.message });
  }
  console.error('admob-ssv: grant_ad_rescue', error.code, error.message);
  return json(500, { error: 'Kurtarma kaydedilemedi' });
}

if (typeof Deno !== 'undefined') Deno.serve((request) => handleSsv(request));
