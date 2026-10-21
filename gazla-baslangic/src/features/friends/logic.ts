/**
 * Arkadaşlar ekranının gruplama ve metin kuralları. Seri ve bugünkü durum sunucudan (friends_today);
 * burada yalnızca gösterim için ayrılır.
 */
import { useEffect, useState } from 'react';

import type { FriendToday, JoinableChallenge } from '@/data';

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

/**
 * "11 gün seri · telefonsuz sabah" (ortak challenge'ın kısa adı; yoksa tam adı) ya da ortak challenge
 * yoksa "12 gün seri · 2 challenge"
 */
export function friendSub(f: FriendToday) {
  const detail =
    f.challengeShortTitle ??
    f.sharedChallengeTitle ??
    (f.activeChallenges > 0 ? `${f.activeChallenges} challenge` : null);
  return detail ? `${f.streak} gün seri · ${detail}` : `${f.streak} gün seri`;
}

/** İstek ve arama satırı: "@kerem.a · 3 ortak" (ortak arkadaş yoksa yalnızca kullanıcı adı) */
export const personSub = (username: string, mutualCount: number) =>
  mutualCount > 0 ? `@${username} · ${mutualCount} ortak` : `@${username}`;

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

const dayNumber = (date: string) => {
  const [y, mo, d] = date.split('-').map(Number);
  return Date.UTC(y, mo - 1, d) / 86_400_000;
};

const deviceToday = () => {
  const d = new Date();
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000;
};

/** Katılınabilir challenge alt satırı: "7 gün · 2 kişi · yarın başlıyor" / "30 gün · 4 kişi · 12. gün" */
export function joinableSub(c: JoinableChallenge) {
  let when: string;
  if (c.dayIndex > 0) {
    when = `${c.dayIndex}. gün`;
  } else {
    const days = Math.round(dayNumber(c.startDate) - deviceToday());
    when = days <= 0 ? 'bugün başlıyor' : days === 1 ? 'yarın başlıyor' : `${days} gün sonra başlıyor`;
  }
  return `${c.durationDays} gün · ${c.memberCount} kişi · ${when}`;
}
