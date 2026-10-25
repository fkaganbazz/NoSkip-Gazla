import type { moments as tr } from '../tr/moments';

/** "Mert", "Mert and Can", "Mert, Can and Selin", "Mert, Can and 2 others" */
function joinNames(names: string[], max = 3) {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length <= max) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const rest = names.length - (max - 1);
  return `${names.slice(0, max - 1).join(', ')} and ${rest === 1 ? '1 other' : `${rest} others`}`;
}

export const moments: typeof tr = {
  weekdayShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],

  completion: {
    title: "Today's done!",
    sub: "Diken's all watered. Same time tomorrow.",
    great: 'Awesome',
    friendsDone: (names) => `${joinNames(names)} finished today too.`,
    hypeUp: (names) =>
      names.length <= 2 ? `Hype up ${joinNames(names)}` : `Hype up ${names[0]}, ${names[1]} and the others`,
  },

  streakCard: {
    label: 'day streak',
    a11y: (n) => `${n}-day streak`,
    dayState: {
      empty: 'not done',
      saved: 'rescued',
      done: 'done',
    },
  },

  share: {
    // "30 DAYS" kartın genişliğine sığmıyor (büyük yazı iki satıra iniyor): "DAY 30"
    bigDays: (n) => `DAY ${n}`,
    sub: (name) => `${name} did it. Your turn.`,
    handle: (username) => `Find me on NoSkip · @${username}`,
    a11y: (days, title, name) => `${days === 1 ? '1 day' : `${days} days`}, ${title}. ${name} did it. Your turn.`,
    dialogTitle: 'Share to Story',
    message: (days, title, name, username) =>
      `${days === 1 ? '1 DAY' : `${days} DAYS`} · ${title}. ${name} did it. Your turn. Find me on NoSkip · @${username}`,
  },
};
