/**
 * TanStack Query anahtarları. Kancalar (`hooks.ts`) ve çevrimdışı kuyruk (`offlineQueue.ts`)
 * aynı anahtarları kullanır; ekranlara `@/data` üzerinden `queryKeys` olarak açılır.
 */
import type { QueryKey } from '@tanstack/react-query';

import type { LocalDate } from './types';

export const queryKeys = {
  profile: ['me', 'profile'] as const,
  settings: ['me', 'settings'] as const,
  today: ['me', 'today'] as const,
  streak: ['me', 'streak'] as const,
  recentDays: (days: number) => ['me', 'recentDays', days] as const,
  pendingRescues: ['me', 'pendingRescues'] as const,
  unseenFinished: ['me', 'unseenFinished'] as const,
  garden: ['me', 'garden'] as const,
  badges: ['me', 'badges'] as const,
  templates: ['templates'] as const,
  templateStats: (id: string) => ['templates', id, 'stats'] as const,
  challenge: (id: string) => ['challenge', id] as const,
  membership: (id: string) => ['challenge', id, 'membership'] as const,
  board: (id: string) => ['challenge', id, 'board'] as const,
  calendar: (id: string) => ['challenge', id, 'calendar'] as const,
  numberStats: (id: string, date: LocalDate | null) => ['challenge', id, 'numberStats', date ?? 'today'] as const,
  invitePreview: (code: string) => ['invite', code] as const,
  friendsToday: ['friends', 'today'] as const,
  friendRequests: ['friends', 'requests'] as const,
  search: (q: string) => ['friends', 'search', q] as const,
  friendProfile: (id: string) => ['friends', 'profile', id] as const,
  pokeStatus: (id: string) => ['friends', 'pokeStatus', id] as const,
  pokeMessages: ['pokeMessages'] as const,
  activity: ['activity'] as const,
  activityPages: ['activity', 'pages'] as const,
  unreadCount: ['activity', 'unread'] as const,
  blocked: ['blocked'] as const,
};

/** İşaretleme gibi günlük yazmalardan sonra yenilenecek gruplar (Bugün, seri, challenge, arkadaşlar) */
export const DAILY_KEYS: QueryKey[] = [['me'], ['challenge'], ['friends']];
