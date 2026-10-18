/**
 * Hangi veri kaynağının kullanılacağı: `.env` içinde EXPO_PUBLIC_SUPABASE_URL ve
 * EXPO_PUBLIC_SUPABASE_ANON_KEY varsa Supabase, yoksa örnek veri (mock). Ekranlar `api`yi
 * doğrudan değil, `hooks.ts`teki sorgu kancalarıyla kullanır.
 */
import type { GazlaApi } from './api';
import { mockApi } from './mock/mockApi';
import { createSupabaseApi } from './supabase/supabaseApi';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const api: GazlaApi = url && anonKey ? createSupabaseApi(url, anonKey) : mockApi;
