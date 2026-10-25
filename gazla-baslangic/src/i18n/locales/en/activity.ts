import type { activity as tr } from '../tr/activity';

export const activity: typeof tr = {
  title: 'Activity',
  markAllRead: 'Mark all read',
  empty: 'Nothing here yet. When friends poke you or invite you, it shows up here.',
  loadingMore: 'Loading older notifications',
  loadMoreFailed: "Couldn't load older notifications.",
  congratsSent: (name) => `Congrats sent to ${name}`,
  groups: {
    today: 'TODAY',
    yesterday: 'YESTERDAY',
    older: 'EARLIER',
  },
  rows: {
    pokeRoast: (name) => `${name} roasted you`,
    pokeHype: (name) => `${name} hyped you up`,
    finished: (name, challenge) => `${name} finished "${challenge}"`,
    finishedUnknown: (name) => `${name} finished a challenge`,
    friendRequest: (name) => `${name} sent you a friend request`,
    challengeInvite: (name) => `${name} added you to a challenge`,
  },
  dikenFallback: {
    daily_reminder: "Today's tasks are waiting for you.",
    day_ending: 'The day is almost over.',
    streak_broken: 'You lost your streak. You have 24 hours to save it.',
    weekly_summary: 'Your weekly summary is ready.',
    streak_milestone: 'Your streak is growing. Keep it up.',
  },
  actions: {
    acceptLabel: (name) => `Accept ${name}'s request`,
    declineLabel: (name) => `Delete ${name}'s request`,
    reply: 'Poke back',
    replyLabel: (name) => `Poke ${name} back`,
    congrats: 'Send congrats',
    congratsDone: 'Congrats sent',
    congratsLabel: (name) => `Send ${name} congrats`,
    congratsDoneLabel: (name) => `Congrats sent to ${name}`,
    declineInvite: 'Decline',
  },
  unread: 'Unread',
};
