/**
 * Aktivite akışının metin ve gruplama kuralları (Activity.dc.html). Bildirimler sunucudan sıralı gelir;
 * burada yalnızca güne göre ayrılır ve satır metni seçilir.
 */
import type { ActivityItem } from '@/data';
import { accusativeSuffix } from '@/features/friends/names';

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** 0 = bugün, 1 = dün, 2+ = daha önce */
export function dayOffset(iso: string, now: Date) {
  return Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000);
}

/** "5 dk", "3 sa", "Dün", "12 Ekim" */
export function timeLabel(iso: string, now: Date) {
  const offset = dayOffset(iso, now);
  if (offset === 0) {
    const minutes = Math.max(1, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000));
    return minutes < 60 ? `${minutes} dk` : `${Math.floor(minutes / 60)} sa`;
  }
  if (offset === 1) return 'Dün';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export type ActivityGroup = { key: string; label: string; items: ActivityItem[] };

/** BUGÜN / DÜN / DAHA ÖNCE */
export function groupByDay(items: ActivityItem[], now: Date): ActivityGroup[] {
  const groups: ActivityGroup[] = [
    { key: 'today', label: 'BUGÜN', items: [] },
    { key: 'yesterday', label: 'DÜN', items: [] },
    { key: 'older', label: 'DAHA ÖNCE', items: [] },
  ];
  items.forEach((item) => groups[Math.min(Math.max(dayOffset(item.createdAt, now), 0), 2)].items.push(item));
  return groups.filter((g) => g.items.length > 0);
}

const payloadText = (item: ActivityItem, key: string) => {
  const value = item.payload[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
};

/** Diken'in söylediği bildirimler için metin yoksa gösterilecek satır */
const DIKEN_FALLBACK: Partial<Record<ActivityItem['kind'], string>> = {
  daily_reminder: 'Bugünkü görevlerin seni bekliyor.',
  day_ending: 'Günün bitmesine az kaldı.',
  streak_broken: 'Serin koptu. 24 saat içinde kurtarabilirsin.',
  weekly_summary: 'Haftalık özetin hazır.',
  streak_milestone: 'Serin büyüyor. Böyle devam.',
};

export type ActivityText = {
  title: string;
  /** Alt satır (dürtme mesajı tırnak içinde, challenge adı, Diken'in sözü) */
  sub: string | null;
};

export function activityText(item: ActivityItem): ActivityText {
  const name = item.actor?.displayName;
  if (!name) {
    return { title: 'Diken', sub: payloadText(item, 'text') ?? DIKEN_FALLBACK[item.kind] ?? null };
  }
  const challenge = item.challengeTitle ?? payloadText(item, 'title');
  switch (item.kind) {
    case 'poke_roast':
      return { title: `${name} sana laf soktu`, sub: item.pokeText ? `"${item.pokeText}"` : null };
    case 'poke_hype':
      return { title: `${name} sana gaz verdi`, sub: item.pokeText ? `"${item.pokeText}"` : null };
    case 'friend_finished_challenge':
      return {
        title: challenge
          ? `${name} "${challenge}"${accusativeSuffix(challenge)} bitirdi`
          : `${name} bir challenge'ı bitirdi`,
        sub: null,
      };
    case 'friend_request':
      return { title: `${name} arkadaşlık isteği gönderdi`, sub: null };
    case 'challenge_invite':
      return { title: `${name} seni bir challenge'a ekledi`, sub: challenge };
    default:
      return { title: name, sub: payloadText(item, 'text') ?? DIKEN_FALLBACK[item.kind] ?? null };
  }
}

export const isPoke = (item: ActivityItem) => item.kind === 'poke_hype' || item.kind === 'poke_roast';
