/**
 * Bildirim gönderimi (Expo Push API). İki çağrı türü:
 *
 * 1. Arkadaş bildirimi — `notifications` INSERT (Database Webhook gövdesi
 *    `{ type: 'INSERT', table: 'notifications', record }`; migration 20261021100200'deki tetikleyici
 *    pg_net ile gönderir, Supabase panelindeki Database Webhook da aynı gövdeyi yollar). `actor_id`
 *    doluysa `claim_social_push(id)`: alıcı dürtme bildirimlerini kapattıysa dürtme gitmez, aynı satır
 *    iki kez gönderilmez. Metin alıcının dilinde (`locale`: 'tr' Gazla, 'en' NoSkip; dürtme metni de o dilde
 *    gelir). Diken satırları (actor_id null) burada atlanır.
 * 2. Diken bildirimleri — `{ mode: 'schedule' }` (pg_cron 15 dakikada bir): `queue_diken_notifications()`
 *    kullanıcının yerel saatinde zamanı gelenleri (günlük hatırlatma, challenge hatırlatması, gün bitiyor,
 *    seri koptu) sessiz saat ve günde 2 kuralıyla ayırır; metni alıcının dilinde SQL yazar (`app.diken_text`),
 *    burada yalnızca gönderilir.
 *
 * Expo yanıtında `DeviceNotRegistered` dönen token'lar `push_tokens`'tan silinir.
 * Android kanalları (src/notifications/channels.ts): Diken `diken`; dürt, gaz, istek, davet, arkadaşın
 * bitirdi `friends`; diğerleri `default`. `data.url` uygulama içi yoldur: Diken satırlarında SQL'in yazdığı
 * (`/`, `/challenge/<id>`, `/streak-lost/<challengeId>`), arkadaş bildirimlerinde `/poke/<id>`, `/friends`, `/activity`.
 *
 * Yetki: `x-gazla-secret` başlığı = PUSH_WEBHOOK_SECRET (Vault `gazla_push_secret` ile aynı) ya da
 * `Authorization: Bearer <service role key>`. Dağıtım: `supabase functions deploy push --no-verify-jwt`.
 * İsteğe bağlı EXPO_ACCESS_TOKEN (Expo hesabında "push security" açıksa).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): unknown;
  env: { get(name: string): string | undefined };
};

export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH = 100;

export type ChannelId = 'default' | 'diken' | 'friends';

export type PushMessage = {
  to: string;
  title?: string;
  body?: string;
  data: { url: string; notificationId: string; kind: string };
  channelId: ChannelId;
  sound: 'default';
  priority?: 'default' | 'high';
};

// Metinler (design/Notifications.dc.html; src/features/settings/notificationCopy.ts ve
// src/features/activity/logic.ts ile aynı kalıplar), alıcının dilinde. Diken metinleri SQL'de (app.diken_text)
// çünkü satırla birlikte saklanıp Aktivite'de de gösteriliyor.

export const DIKEN_TITLE = 'Diken';

export type Locale = 'tr' | 'en';

export type SocialPush = {
  notification_id: string;
  recipient_id: string;
  /** Alıcının dili (user_settings.locale); eski satırlarda yoksa Türkçe */
  locale?: Locale | null;
  kind: string;
  actor_id: string;
  actor_name: string | null;
  challenge_id: string | null;
  challenge_title: string | null;
  poke_text: string | null;
  payload: Record<string, unknown> | null;
  tokens: string[];
};

type Content = { title: string; body?: string; url: string; channelId: ChannelId };

/** Arkadaş bildirimi metinleri, dile göre */
type SocialCopy = {
  someone: string;
  hype: (name: string) => string;
  roast: (name: string) => string;
  friendRequest: (name: string) => string;
  challengeInvite: (name: string) => string;
  finished: (name: string) => string;
  finishedBody: (title: string | null) => string;
};

export const SOCIAL_COPY: Record<Locale, SocialCopy> = {
  tr: {
    someone: 'Bir arkadaşın',
    hype: (name) => `${name} sana gaz verdi`,
    roast: (name) => `${name} sana laf soktu`,
    friendRequest: (name) => `${name} arkadaşlık isteği gönderdi`,
    challengeInvite: (name) => `${name} seni bir challenge'a ekledi`,
    finished: (name) => `${name} bitirdi`,
    finishedBody: (title) => (title ? `${title} tamam. Tebrik etmek ister misin?` : 'Tebrik etmek ister misin?'),
  },
  en: {
    someone: 'A friend',
    hype: (name) => `${name} hyped you up`,
    roast: (name) => `${name} roasted you`,
    friendRequest: (name) => `${name} sent you a friend request`,
    challengeInvite: (name) => `${name} added you to a challenge`,
    finished: (name) => `${name} finished`,
    finishedBody: (title) => (title ? `${title}, done. Want to send congrats?` : 'Want to send congrats?'),
  },
};

const quote = (text: string | null) => (text ? `"${text}"` : undefined);

export function socialContent(n: SocialPush): Content {
  const copy = SOCIAL_COPY[n.locale === 'en' ? 'en' : 'tr'];
  const name = n.actor_name?.trim() || copy.someone;
  switch (n.kind) {
    case 'poke_hype':
      return { title: copy.hype(name), body: quote(n.poke_text), url: `/poke/${n.actor_id}`, channelId: 'friends' };
    case 'poke_roast':
      return { title: copy.roast(name), body: quote(n.poke_text), url: `/poke/${n.actor_id}`, channelId: 'friends' };
    case 'friend_request':
      return { title: copy.friendRequest(name), url: '/friends', channelId: 'friends' };
    case 'challenge_invite':
      return {
        title: copy.challengeInvite(name),
        body: n.challenge_title ?? undefined,
        url: '/activity',
        channelId: 'friends',
      };
    case 'friend_finished_challenge':
      return {
        title: copy.finished(name),
        body: copy.finishedBody(n.challenge_title),
        url: '/activity',
        channelId: 'friends',
      };
    default:
      return { title: name, url: '/activity', channelId: 'default' };
  }
}

export function socialMessages(n: SocialPush): PushMessage[] {
  const content = socialContent(n);
  return n.tokens.map((to) => ({
    to,
    title: content.title,
    ...(content.body ? { body: content.body } : null),
    data: { url: content.url, notificationId: n.notification_id, kind: n.kind },
    channelId: content.channelId,
    sound: 'default',
    priority: 'high',
  }));
}

export type DikenPush = {
  notification_id: string;
  recipient_id: string;
  kind: string;
  challenge_id: string | null;
  body: string;
  url: string;
  tokens: string[];
};

export function dikenMessages(rows: DikenPush[]): PushMessage[] {
  return rows.flatMap((row) =>
    row.tokens.map((to) => ({
      to,
      title: DIKEN_TITLE,
      body: row.body,
      data: { url: row.url, notificationId: row.notification_id, kind: row.kind },
      channelId: 'diken' as const,
      sound: 'default' as const,
    })),
  );
}

// Expo Push API ------------------------------------------------------------------------------------

type ExpoTicket = { status: 'ok'; id: string } | { status: 'error'; message?: string; details?: { error?: string } };

export type SendResult = { sent: number; failed: number; invalidTokens: string[] };

/** Mesajları 100'lük gruplar halinde gönderir; geçersiz (DeviceNotRegistered) token'ları ayırır */
export async function sendExpoPush(messages: PushMessage[], fetcher: typeof fetch = fetch, accessToken?: string): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, invalidTokens: [] };
  for (let i = 0; i < messages.length; i += EXPO_BATCH) {
    const batch = messages.slice(i, i + EXPO_BATCH);
    let tickets: ExpoTicket[] = [];
    try {
      const response = await fetcher(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : null),
        },
        body: JSON.stringify(batch),
      });
      const body = (await response.json().catch(() => ({}))) as { data?: ExpoTicket[]; errors?: unknown };
      if (!response.ok || !Array.isArray(body.data)) {
        console.error('push: Expo isteği başarısız', response.status, JSON.stringify(body.errors ?? body));
        result.failed += batch.length;
        continue;
      }
      tickets = body.data;
    } catch (error) {
      console.error('push: Expo isteği gönderilemedi', error);
      result.failed += batch.length;
      continue;
    }
    batch.forEach((message, index) => {
      const ticket = tickets[index];
      if (ticket?.status === 'ok') {
        result.sent += 1;
        return;
      }
      result.failed += 1;
      if (ticket?.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        result.invalidTokens.push(message.to);
      }
    });
  }
  return result;
}

// HTTP ----------------------------------------------------------------------------------------------

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

/** Sabit süreli karşılaştırma (sırrın uzunluğu dışında bilgi sızdırmaz) */
export function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function isAuthorized(request: Request, secret: string | undefined, serviceKey: string | undefined): boolean {
  const header = request.headers.get('x-gazla-secret');
  if (secret && header && safeEqual(header, secret)) return true;
  const bearer = /^Bearer\s+(.+)$/i.exec(request.headers.get('Authorization') ?? '')?.[1]?.trim();
  return !!(serviceKey && bearer && safeEqual(bearer, serviceKey));
}

type Deps = { admin?: SupabaseClient; fetcher?: typeof fetch; env?: (name: string) => string | undefined };

async function removeTokens(admin: SupabaseClient, tokens: string[]) {
  if (!tokens.length) return;
  const { error } = await admin.from('push_tokens').delete().in('token', tokens);
  if (error) console.error('push: geçersiz token silinemedi', error.message);
}

export async function handlePush(request: Request, deps: Deps = {}): Promise<Response> {
  const env = deps.env ?? ((name: string) => Deno.env.get(name));
  if (request.method !== 'POST') return json(405, { error: 'Yalnızca POST' });
  if (!isAuthorized(request, env('PUSH_WEBHOOK_SECRET'), env('SUPABASE_SERVICE_ROLE_KEY'))) {
    return json(401, { error: 'Yetkisiz' });
  }

  let body: { mode?: string; type?: string; table?: string; record?: { id?: string; actor_id?: string | null } };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Geçersiz gövde' });
  }

  let admin = deps.admin;
  if (!admin) {
    const url = env('SUPABASE_URL');
    const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return json(500, { error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tanımlı değil' });
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  const fetcher = deps.fetcher ?? fetch;
  const accessToken = env('EXPO_ACCESS_TOKEN');

  let messages: PushMessage[] = [];
  if (body.mode === 'schedule') {
    const { data, error } = await admin.rpc('queue_diken_notifications');
    if (error) {
      console.error('push: queue_diken_notifications', error.message);
      return json(500, { error: 'Diken bildirimleri hazırlanamadı' });
    }
    messages = dikenMessages((data ?? []) as DikenPush[]);
  } else if (body.type === 'INSERT' && body.table === 'notifications' && body.record?.id) {
    if (!body.record.actor_id) return json(200, { skipped: 'diken' });
    const { data, error } = await admin.rpc('claim_social_push', { p_notification: body.record.id });
    if (error) {
      console.error('push: claim_social_push', error.message);
      return json(500, { error: 'Bildirim hazırlanamadı' });
    }
    if (!data) return json(200, { sent: 0 });
    messages = socialMessages(data as SocialPush);
  } else {
    return json(400, { error: 'Bilinmeyen istek' });
  }

  const result = await sendExpoPush(messages, fetcher, accessToken);
  await removeTokens(admin, result.invalidTokens);
  return json(200, { sent: result.sent, failed: result.failed, removedTokens: result.invalidTokens.length });
}

if (typeof Deno !== 'undefined') Deno.serve((request) => handlePush(request));
