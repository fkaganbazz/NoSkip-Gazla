import type { profile as tr } from '../tr/profile';

export const profile: typeof tr = {
  notViewable: "This profile can't be viewed.",
  sharedCount: (username, n) => `@${username} · ${n === 1 ? '1 shared challenge' : `${n} shared challenges`}`,
  stats: {
    streak: 'day streak',
    completed: 'completed',
    harshMode: 'roast mode',
    on: 'On',
    off: 'Off',
  },
  sections: {
    shared: 'SHARED CHALLENGES',
    joinable: 'CHALLENGES YOU CAN JOIN',
  },
  joined: (title) => `You joined "${title}"`,
  menu: {
    label: (name) => `Actions for ${name}`,
    poke: (name) => `Poke ${name}`,
    remove: 'Remove friend',
    removeTitle: (name) => `Remove ${name} as a friend?`,
    removeMessage: 'You can always send a new friend request later.',
    blockTitle: (name) => `Block ${name}?`,
    blockMessage: "Blocked people can't find or poke you. You can unblock them in Settings.",
  },
  shared: {
    notStarted: 'Not started',
  },
  joinable: {
    startsToday: 'starts today',
    startsTomorrow: 'starts tomorrow',
    startsIn: (days) => `starts in ${days} days`,
    joinLabel: (title) => `Join ${title}`,
  },
};
