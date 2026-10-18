/**
 * Bugün ekranının metin ve ifade kuralları — design/Today.dc.html'deki renderVals() mantığı,
 * görev sayısından bağımsız hale getirilmiş hali.
 */
import type { DikenMood } from '@/components/Diken';
import type { FriendToday, TodayTask } from '@/data';

import type { TaskRow, TodayFriend } from './types';

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
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

/** "Pazartesi, 28 Eylül" */
export function formatDayLabel(now: Date) {
  return `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

/** Saate göre selamlama: 05–12 Günaydın, 12–18 İyi günler, diğer saatler İyi akşamlar */
export function greeting(now: Date) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) {
    return 'Günaydın';
  }
  if (hour >= 12 && hour < 18) {
    return 'İyi günler';
  }
  return 'İyi akşamlar';
}

/** Yerel gece yarısına kalan dakika (yukarı yuvarlanır) */
export function minutesUntilMidnight(now: Date) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 60000);
}

/** "1 sa 16 dk", "2 sa", "16 dk" */
export function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} dk`;
  }
  return minutes === 0 ? `${hours} sa` : `${hours} sa ${minutes} dk`;
}

export type HeroState = {
  title: string;
  sub: string;
  mood: DikenMood;
  /** Seri çipinde gösterilecek gün sayısı (bugün tamamlanınca bir artar) */
  streak: number;
};

/**
 * Kahraman kartı: kalan görev sayısına göre başlık, açıklama ve Diken'in ifadesi.
 * Tasarımda 3 görev için: 0 → susadı, 1 → hâlâ susuz, 2 → az kaldı, 3 → kana kana içti.
 */
export function heroState(done: number, total: number, streakDays: number, minutesLeft: number): HeroState {
  const remaining = total - done;
  if (remaining <= 0) {
    return {
      title: 'Diken kana kana içti',
      sub: `Bugün tamam. Serin ${streakDays + 1} gün oldu.`,
      mood: 'cosku',
      streak: streakDays + 1,
    };
  }
  const countdown = `${remaining} görev kaldı. Günün bitmesine ${formatDuration(minutesLeft)} var.`;
  if (done === 0) {
    return { title: 'Diken susadı', sub: countdown, mood: 'endise', streak: streakDays };
  }
  if (remaining === 1) {
    return {
      title: 'Az kaldı, bırakma',
      sub: 'Tek görev kaldı. Diken bardağı görüyor.',
      mood: 'mutlu',
      streak: streakDays,
    };
  }
  return { title: 'Diken hâlâ susuz', sub: countdown, mood: 'endise', streak: streakDays };
}

const formatNumber = (n: number) => (Number.isInteger(n) ? String(n) : n.toLocaleString('tr-TR'));

/** Görev satırı alt bilgisi: "Gün 12/30 · Grup 4 kişi", "Gün 4/30 · Fotoğraf kanıtı", "Gün 3/10 · Bugün 70 sn" */
export function taskMeta(task: TodayTask, now: Date) {
  const day = `Gün ${task.dayIndex}/${task.durationDays}`;
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const prefix = task.localDate !== todayIso ? 'Dün · ' : '';
  if (task.taskType === 'number' && task.target != null) {
    const value = task.done && task.value != null ? task.value : task.target;
    return `${prefix}${day} · ${task.done ? '' : 'Bugün '}${formatNumber(value)} ${task.numberUnit ?? ''}`.trim();
  }
  if (task.taskType === 'photo') {
    return `${prefix}${day} · Fotoğraf kanıtı`;
  }
  return task.memberCount > 1 ? `${prefix}${day} · Grup ${task.memberCount} kişi` : `${prefix}${day}`;
}

export function toTaskRow(task: TodayTask, now: Date): TaskRow {
  return {
    id: `${task.challengeId}|${task.localDate}`,
    challengeId: task.challengeId,
    done: task.done,
    type: task.taskType,
    title: task.title,
    meta: taskMeta(task, now),
    progress: Math.round((Math.min(task.dayIndex, task.durationDays) / task.durationDays) * 100),
    tint: task.tint,
    icon: task.icon,
  };
}

export function toFriendRow(friend: FriendToday): TodayFriend {
  return { id: friend.id, name: friend.displayName, tint: friend.avatarTint, doneToday: !!friend.doneToday };
}
