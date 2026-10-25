/**
 * Aktivite akışının metin ve gruplama kuralları (Activity.dc.html). Bildirimler sunucudan sıralı gelir;
 * burada yalnızca güne göre ayrılır ve satır metni seçilir.
 */
import type { ActivityItem, NotificationKind } from '@/data';
import type { Messages } from '@/i18n';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** 0 = bugün, 1 = dün, 2+ = daha önce */
export function dayOffset(iso: string, now: Date) {
  return Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000);
}

/** "5 dk", "3 sa", "Dün", "12 Ekim" */
export function timeLabel(iso: string, now: Date, t: Messages) {
  const dates = t.common.dates;
  const offset = dayOffset(iso, now);
  if (offset === 0) {
    const minutes = Math.max(1, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000));
    return minutes < 60 ? dates.minutesShort(minutes) : dates.hoursShort(Math.floor(minutes / 60));
  }
  if (offset === 1) return dates.yesterday;
  return dates.dayMonth(new Date(iso));
}

export type ActivityGroup = { key: string; label: string; items: ActivityItem[] };

/** BUGÜN / DÜN / DAHA ÖNCE */
export function groupByDay(items: ActivityItem[], now: Date, t: Messages): ActivityGroup[] {
  const groups: ActivityGroup[] = [
    { key: 'today', label: t.activity.groups.today, items: [] },
    { key: 'yesterday', label: t.activity.groups.yesterday, items: [] },
    { key: 'older', label: t.activity.groups.older, items: [] },
  ];
  items.forEach((item) => groups[Math.min(Math.max(dayOffset(item.createdAt, now), 0), 2)].items.push(item));
  return groups.filter((g) => g.items.length > 0);
}

const payloadText = (item: ActivityItem, key: string) => {
  const value = item.payload[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
};

/** Diken'in söylediği bildirimler için metin yoksa gösterilecek satır */
const dikenFallback = (item: ActivityItem, t: Messages) =>
  (t.activity.dikenFallback as Partial<Record<NotificationKind, string>>)[item.kind] ?? null;

export type ActivityText = {
  title: string;
  /** Alt satır (dürtme mesajı tırnak içinde, challenge adı, Diken'in sözü) */
  sub: string | null;
};

export function activityText(item: ActivityItem, t: Messages): ActivityText {
  const name = item.actor?.displayName;
  if (!name) {
    return { title: t.common.mascot, sub: payloadText(item, 'text') ?? dikenFallback(item, t) };
  }
  const rows = t.activity.rows;
  const challenge = item.challengeTitle ?? payloadText(item, 'title');
  switch (item.kind) {
    case 'poke_roast':
      return { title: rows.pokeRoast(name), sub: item.pokeText ? `"${item.pokeText}"` : null };
    case 'poke_hype':
      return { title: rows.pokeHype(name), sub: item.pokeText ? `"${item.pokeText}"` : null };
    case 'friend_finished_challenge':
      return {
        title: challenge ? rows.finished(name, challenge) : rows.finishedUnknown(name),
        sub: null,
      };
    case 'friend_request':
      return { title: rows.friendRequest(name), sub: null };
    case 'challenge_invite':
      return { title: rows.challengeInvite(name), sub: challenge };
    default:
      return { title: name, sub: payloadText(item, 'text') ?? dikenFallback(item, t) };
  }
}

export const isPoke = (item: ActivityItem) => item.kind === 'poke_hype' || item.kind === 'poke_roast';
