/**
 * Hesabı sil (DeleteAccount, Apple zorunluluğu). Uygulama `supabase.functions.invoke('delete-account')`
 * ile oturum belirteciyle çağırır (src/data/supabase/supabaseApi.ts `deleteAccount`).
 *
 * 1. Authorization'daki JWT'den kullanıcı (`auth.getUser`; süresi dolmuş/sahte belirteç reddedilir).
 * 2. Storage: `proofs/{uid}/…` (alt klasörler dahil) ve `avatars/{uid}/…` sayfa sayfa listelenip silinir.
 * 3. `auth.admin.deleteUser(uid)`: profil, ayarlar, işaretlemeler, arkadaşlıklar, token'lar … zincirleme
 *    silinir; şikayetler kişi alanları boşaltılarak kalır (supabase/README.md "Hesap silme").
 *
 * Dağıtım: `supabase functions deploy delete-account` (JWT doğrulaması açık kalır). Hata metinleri Türkçe;
 * uygulama `error.message`'ı gösterebilir.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): unknown;
  env: { get(name: string): string | undefined };
};

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
  });

const PAGE_SIZE = 100;
export const USER_BUCKETS = ['proofs', 'avatars'] as const;

type StorageApi = Pick<SupabaseClient['storage'], 'from'>;

/** Bir klasördeki tüm dosya yolları (alt klasörler dahil, sayfalı) */
export async function listFilesRecursive(storage: StorageApi, bucket: string, prefix: string): Promise<string[]> {
  const files: string[] = [];
  const folders = [prefix];
  while (folders.length) {
    const folder = folders.shift()!;
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await storage
        .from(bucket)
        .list(folder, { limit: PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw new Error(`${bucket}/${folder}: ${error.message}`);
      const items = data ?? [];
      for (const item of items) {
        const path = `${folder}/${item.name}`;
        // Klasörlerin id'si yok (Storage "sanal" klasör döndürür)
        if (item.id === null || item.id === undefined) folders.push(path);
        else files.push(path);
      }
      if (items.length < PAGE_SIZE) break;
    }
  }
  return files;
}

/** Kullanıcının iki kovadaki tüm dosyalarını siler; silinen dosya sayısı */
export async function deleteUserFiles(storage: StorageApi, userId: string): Promise<number> {
  let removed = 0;
  for (const bucket of USER_BUCKETS) {
    const paths = await listFilesRecursive(storage, bucket, userId);
    for (let i = 0; i < paths.length; i += PAGE_SIZE) {
      const batch = paths.slice(i, i + PAGE_SIZE);
      const { error } = await storage.from(bucket).remove(batch);
      if (error) throw new Error(`${bucket}: ${error.message}`);
      removed += batch.length;
    }
  }
  return removed;
}

export async function handleDeleteAccount(request: Request, admin?: SupabaseClient): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return json(405, { error: 'Bu istek desteklenmiyor.' });

  const token = /^Bearer\s+(.+)$/i.exec(request.headers.get('Authorization') ?? '')?.[1]?.trim();
  if (!token) return json(401, { error: 'Oturum açman gerekiyor.' });

  let client = admin;
  if (!client) {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) {
      console.error('delete-account: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tanımlı değil');
      return json(500, { error: 'Hesap şu an silinemiyor. Biraz sonra tekrar dene.' });
    }
    client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  const { data, error: userError } = await client.auth.getUser(token);
  const userId = data?.user?.id;
  if (userError || !userId) return json(401, { error: 'Oturumun geçersiz. Yeniden giriş yapıp tekrar dene.' });

  try {
    await deleteUserFiles(client.storage, userId);
  } catch (error) {
    console.error('delete-account: dosyalar silinemedi', error);
    return json(500, { error: 'Fotoğrafların silinemedi. Biraz sonra tekrar dene.' });
  }

  const { error: deleteError } = await client.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('delete-account: deleteUser', deleteError.message);
    return json(500, { error: 'Hesap silinemedi. Biraz sonra tekrar dene.' });
  }
  return json(200, { ok: true });
}

if (typeof Deno !== 'undefined') Deno.serve((request) => handleDeleteAccount(request));
