import type { friends as tr } from '../tr/friends';

export const friends: typeof tr = {
  screen: {
    title: 'Friends',
    addFriend: 'Add friend',
    searchPlaceholder: 'Search by username',
    noResults: 'No one with that username.',
    profileLabel: (name) => `${name}'s profile`,
    inviteCopied: 'Invite text copied',
  },
  sections: {
    requests: 'REQUESTS',
    pending: 'STILL TO GO TODAY',
    done: 'DONE FOR TODAY',
    idle: 'NOTHING DUE TODAY',
  },
  rows: {
    streak: (n) => `${n}-day streak`,
    activeChallenges: (n) => (n === 1 ? '1 challenge' : `${n} challenges`),
    mutual: (n) => `${n} mutual`,
  },
  invite: {
    title: 'Invite a friend',
    sub: 'Your link drops them right into your group.',
    emptyTitle: 'No friends yet',
    emptySub: 'Invite a friend or search by username. Your link drops them right into your group.',
    shareLabel: 'Share friend invite',
    message: (username, url) =>
      username
        ? `Let's do a challenge together on NoSkip. Get the app and search for me as @${username} in Friends: ${url}`
        : `Let's do a challenge together on NoSkip. Get the app: ${url}`,
  },
};
