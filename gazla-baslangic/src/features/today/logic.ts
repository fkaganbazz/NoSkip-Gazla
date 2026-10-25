/**
 * Bugün ekranının metin ve ifade kuralları — design/Today.dc.html'deki renderVals() mantığı,
 * görev sayısından bağımsız hale getirilmiş hali. Metinler sözlükten (`t.today`, `t.common.dates`).
 */
import type { DikenMood } from '@/components/Diken';
import type { FriendToday, TodayTask } from '@/data';
import { formatNumber, getT, type Messages } from '@/i18n';

import type { TaskRow, TodayFriend } from './types';

/** "Pazartesi, 28 Eylül" / "Monday, September 28" (`t` verilmezse o anki dil) */
export function formatDayLabel(now: Date, t: Messages = getT()) {
  return t.common.dates.weekdayDayMonth(now);
}

/** Saate göre selamlama: 05–12 Günaydın, 12–18 İyi günler, diğer saatler İyi akşamlar */
export function greeting(now: Date, t: Messages) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) {
    return t.today.greeting.morning;
  }
  if (hour >= 12 && hour < 18) {
    return t.today.greeting.afternoon;
  }
  return t.today.greeting.evening;
}

/** Yerel gece yarısına kalan dakika (yukarı yuvarlanır) */
export function minutesUntilMidnight(now: Date) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 60000);
}

/** "1 sa 16 dk", "2 sa", "16 dk" / "1h 16m", "2h", "16m" */
export function formatDuration(totalMinutes: number, t: Messages) {
  const { hoursShort, minutesShort } = t.common.dates;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return minutesShort(minutes);
  }
  return minutes === 0 ? hoursShort(hours) : `${hoursShort(hours)} ${minutesShort(minutes)}`;
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
export function heroState(
  done: number,
  total: number,
  streakDays: number,
  minutesLeft: number,
  t: Messages,
): HeroState {
  const h = t.today.hero;
  const remaining = total - done;
  if (remaining <= 0) {
    return {
      title: h.doneTitle,
      sub: h.doneSub(streakDays + 1),
      mood: 'cosku',
      streak: streakDays + 1,
    };
  }
  const countdown = h.countdown(remaining, formatDuration(minutesLeft, t));
  if (done === 0) {
    return { title: h.thirstyTitle, sub: countdown, mood: 'endise', streak: streakDays };
  }
  if (remaining === 1) {
    return {
      title: h.almostTitle,
      sub: h.almostSub,
      mood: 'mutlu',
      streak: streakDays,
    };
  }
  return { title: h.stillThirstyTitle, sub: countdown, mood: 'endise', streak: streakDays };
}

/** Görev satırı alt bilgisi: "Gün 12/30 · Grup 4 kişi", "Gün 4/30 · Fotoğraf kanıtı", "Gün 3/10 · Bugün 70 sn" */
export function taskMeta(task: TodayTask, now: Date, t: Messages) {
  const m = t.today.taskMeta;
  const day = m.day(task.dayIndex, task.durationDays);
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  // Toleransta dünün görevi: "Dün · Gün 4/30 · …"
  const parts = task.localDate !== todayIso ? [t.common.dates.yesterday, day] : [day];
  if (task.taskType === 'number' && task.target != null) {
    const value = formatNumber(task.done && task.value != null ? task.value : task.target, { maximumFractionDigits: 4 });
    const unit = task.numberUnit ?? '';
    parts.push(task.done ? `${value} ${unit}`.trim() : m.todayTarget(value, unit));
  } else if (task.taskType === 'photo') {
    parts.push(m.photoProof);
  } else if (task.memberCount > 1) {
    parts.push(m.group(task.memberCount));
  }
  return parts.join(' · ');
}

export function toTaskRow(task: TodayTask, now: Date, t: Messages): TaskRow {
  return {
    id: `${task.challengeId}|${task.localDate}`,
    challengeId: task.challengeId,
    done: task.done,
    taskType: task.taskType,
    title: task.title,
    meta: taskMeta(task, now, t),
    // Tasarımdaki gibi tam yüzdeye yuvarlanır (Gün 4/30 → %13)
    progress: task.durationDays > 0 ? Math.round((Math.min(task.dayIndex, task.durationDays) / task.durationDays) * 100) / 100 : 0,
    tint: task.tint,
    icon: task.icon,
  };
}

export function toFriendRow(friend: FriendToday): TodayFriend {
  return {
    id: friend.id,
    displayName: friend.displayName,
    avatarTint: friend.avatarTint,
    avatarUrl: friend.avatarUrl,
    doneToday: !!friend.doneToday,
  };
}
