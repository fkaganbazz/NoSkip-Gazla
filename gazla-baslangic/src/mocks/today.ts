/**
 * Bugün ekranı için örnek veri — design/Today.dc.html'deki içerik.
 * Supabase bağlantısı gelince yerini sorgular alacak.
 */
import type { TodayFriend, TodayTask } from '@/features/today/types';

export const mockUser = {
  firstName: 'Deniz',
  /** Dünkü günle biten seri (sunucu hesaplar) */
  streakDays: 12,
  unreadActivity: 3,
};

export const mockTasks: TodayTask[] = [
  {
    id: 'phone',
    type: 'check',
    title: 'Uyanınca 1 saat telefonsuz',
    meta: 'Gün 12/30 · Grup 4 kişi',
    progress: 40,
    tint: 'lilac',
    icon: 'phoneOff',
  },
  {
    id: 'read',
    type: 'photo',
    title: 'Her gün 20 sayfa oku',
    meta: 'Gün 4/30 · Fotoğraf kanıtı',
    progress: 13,
    tint: 'rose',
    icon: 'book',
  },
  {
    id: 'plank',
    type: 'number',
    title: 'Plank: her gün +5 saniye',
    meta: 'Gün 3/10 · Bugün 70 sn',
    progress: 30,
    tint: 'green',
    icon: 'timer',
  },
];

/** Tasarımdaki başlangıç durumu: ilk görev tamam */
export const mockInitialDone: Record<string, boolean> = {
  phone: true,
  read: false,
  plank: false,
};

export const mockFriends: TodayFriend[] = [
  { id: 'mert', name: 'Mert', tint: 'peach', doneToday: true },
  { id: 'ece', name: 'Ece', tint: 'lavender', doneToday: false },
  { id: 'can', name: 'Can', tint: 'mint', doneToday: true },
  { id: 'selin', name: 'Selin', tint: 'butter', doneToday: false },
];
