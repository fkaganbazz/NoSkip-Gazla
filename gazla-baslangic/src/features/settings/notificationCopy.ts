/**
 * Bildirim kuralları ve metinleri — design/Notifications.dc.html. Metinleri sunucu gönderir;
 * burada kullanıcıya ne zaman ne geleceğini göstermek için birebir listelenir (sözlük: settings.notifications).
 */
import type { Messages } from '@/i18n';

export type RuleTone = 'strong' | 'lilac' | 'peach';

export const notificationRules = (t: Messages): { label: string; tone: RuleTone }[] => {
  const r = t.settings.notifications.rules;
  return [
    { label: r.dikenLimit, tone: 'strong' },
    { label: r.quietHours, tone: 'lilac' },
    { label: r.roastHarshOnly, tone: 'peach' },
  ];
};

export type CopyRow = { when: string; title: string; from: 'diken' | 'friend'; body: string };

export const notificationCopy = (t: Messages): CopyRow[] => {
  const c = t.settings.notifications.copy;
  return [
    { ...c.reminder, from: 'diken' },
    { ...c.dayEnding, from: 'diken' },
    { ...c.hype, from: 'friend' },
    { ...c.roast, from: 'friend' },
    { ...c.finished, from: 'friend' },
    { ...c.streakLost, from: 'diken' },
    { ...c.weekly, from: 'diken' },
  ];
};
