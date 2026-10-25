import type { garden as tr } from '../tr/garden';

export const garden: typeof tr = {
  header: {
    title: (name) => `${name}'s garden`,
    sub: (username, harshMode) => `@${username} · Roast mode ${harshMode ? 'on' : 'off'}`,
  },
  stats: {
    currentStreak: 'Current streak',
    completed: 'Completed',
    longestStreak: 'Best streak',
  },
  shelves: {
    plantLabel: (days, title) => `${days}-day ${title}`,
    plantA11y: (title) => `${title}, completed`,
    next: 'Up next',
    findNew: 'Find a new challenge',
    empty: 'Every challenge you finish adds a new cactus to your shelf.',
  },
  badges: {
    title: 'Badges',
    countA11y: (earned, total) => `${earned} of ${total} badges earned`,
    locked: 'Locked',
    lockedA11y: (title, description) => `${title}, locked. ${description}`,
    earnedA11y: (title, description) => `${title} badge. ${description}`,
    loadFailed: "Couldn't load badges.",
  },
};
