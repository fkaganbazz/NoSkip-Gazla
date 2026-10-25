import type { notifications as tr } from '../tr/notifications';

export const notifications: typeof tr = {
  channels: {
    default: {
      name: 'General',
      description: 'Other notifications from NoSkip',
    },
    diken: {
      name: 'Diken',
      description: 'Reminders before the day ends and alerts when your streak is at risk (at most 2 a day)',
    },
    friends: {
      name: 'Friends',
      description: 'Pokes, hypes, friend requests and challenge invites',
    },
  },
};
