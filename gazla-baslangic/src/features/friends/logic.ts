/**
 * Arkadaşlar ekranının gruplama ve metin kuralları. Seri ve bugünkü durum sunucudan (friends_today);
 * burada yalnızca gösterim için ayrılır.
 */
import { useEffect, useState } from 'react';

import type { FriendToday } from '@/data';

export type FriendGroups = {
  /** Bugün görevi olup henüz bitirmeyenler */
  pending: FriendToday[];
  /** Bugünü bitirenler */
  done: FriendToday[];
  /** Bugün görevi olmayanlar */
  idle: FriendToday[];
};

export function groupFriends(friends: FriendToday[]): FriendGroups {
  return {
    pending: friends.filter((f) => f.doneToday === false),
    done: friends.filter((f) => f.doneToday === true),
    idle: friends.filter((f) => f.doneToday === null),
  };
}

/** "11 gün seri · Uyanınca 1 saat telefonsuz" ya da ortak challenge yoksa "12 gün seri · 2 challenge" */
export function friendSub(f: FriendToday) {
  const detail = f.sharedChallengeTitle ?? (f.activeChallenges > 0 ? `${f.activeChallenges} challenge` : null);
  return detail ? `${f.streak} gün seri · ${detail}` : `${f.streak} gün seri`;
}

/** Arama terimi: baştaki @ ve boşluklar atılır; 2 harften kısaysa arama yapılmaz */
export const searchTerm = (query: string) => query.trim().replace(/^@/, '');

/** Değer `delay` ms boyunca değişmezse güncellenir (aramada her tuşta istek atılmasın) */
export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
