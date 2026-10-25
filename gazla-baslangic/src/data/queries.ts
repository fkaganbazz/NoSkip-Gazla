/**
 * Kancalarla (`hooks.ts`) DataProvider'ın paylaştığı sorgu seçenekleri. Ayrı dosyada: DataProvider bunları
 * açılışta kullanır, `hooks.ts` de DataProvider'dan `useAuth` alır (döngüsel içe aktarma olmasın).
 */
import { queryOptions } from '@tanstack/react-query';

import { api } from './client';
import { reflectRecentDays } from './offlineQueue';
import { queryKeys } from './queryKeys';

/** Kendi profil satırı (profil tamamlanmadıysa null); anahtar kullanıcıya bağlı (`['me', 'profile', userId]`) */
export const profileQuery = (userId: string | null) =>
  queryOptions({
    queryKey: [...queryKeys.profile, userId],
    queryFn: () => api.getMyProfile(),
  });

/** Kendi ayarların (user_settings); DataProvider dil eşitlemesinde de okur (`useMySettings` aynı sorgu) */
export const settingsQuery = queryOptions({
  queryKey: queryKeys.settings,
  queryFn: () => api.getMySettings(),
});

/** Son günler sorgusu (Completion haftası); DataProvider açılışta önden çeker ki çevrimdışı da açılsın */
export const recentDaysQuery = (days = 7) =>
  queryOptions({
    queryKey: queryKeys.recentDays(days),
    queryFn: async () => reflectRecentDays(await api.getRecentDays(days)),
  });
