import type { streakLost as tr } from '../tr/streakLost';
import { common } from './common';

/** "Mert", "Mert and Can", "Mert, Can and Selin", "Mert, Can and 2 others" */
function joinNames(names: string[], max = 3) {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length <= max) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const rest = names.length - (max - 1);
  return `${names.slice(0, max - 1).join(', ')} and ${rest === 1 ? '1 other' : `${rest} others`}`;
}

const dayStreak = (days: number) => `${days}-day streak`;

export const streakLost: typeof tr = {
  nothingToSave: 'No streak to save',

  pill: {
    remaining: (time) => `${time} left to save it`,
    remainingA11y: (time) => `${time} left to save your streak`,
    saved: 'Streak saved',
  },

  lostTitle: 'Streak lost',
  savedTitle: 'Diken got watered!',
  lostSub: (title, days, missedOn) =>
    `You missed "${title}" ${missedOn ? `on ${common.dates.dayMonth(missedOn)}` : 'yesterday'}. Your ${dayStreak(days)} is in danger.`,
  savedAdSub: (days) => `Your ${dayStreak(days)} picks up right where it left off. Don't forget today.`,
  savedFreeSub: (days) => `You used your free save. Your streak continues from day ${days}.`,
  friendsContinue: (names) => `${joinNames(names)} ${names.length === 1 ? 'is' : 'are'} still going`,

  adFailedFree: "Couldn't load the ad right now. You can use your free save.",
  adFailed: "Couldn't load the ad right now. Try again in a bit.",

  watchAd: 'Watch an ad, water Diken',
  watchAdA11y: 'Watch an ad, water Diken, 30 seconds',
  adBadge: '30s',
  useFree: 'Use my free save',
  freeAvailable: '1 per month · you have 1 left this month',
  freeUsed: "1 per month · this month's is used up",
  restart: 'Start over',
};
