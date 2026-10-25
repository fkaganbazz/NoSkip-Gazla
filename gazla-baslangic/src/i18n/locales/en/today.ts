import type { today as tr } from '../tr/today';

export const today: typeof tr = {
  greeting: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    withName: (greeting, name) => `${greeting}, ${name}`,
  },

  header: {
    activity: 'Activity',
    activityUnread: (n) => `Activity, ${n} new`,
  },

  hero: {
    doneTitle: "Diken's all watered",
    doneSub: (days) => `Done for today. Your streak is ${days === 1 ? '1 day' : `${days} days`} now.`,
    thirstyTitle: "Diken's thirsty",
    stillThirstyTitle: 'Still thirsty',
    almostTitle: "Don't stop now",
    almostSub: 'Just one task left. Diken can see the glass.',
    countdown: (remaining, timeLeft) =>
      `${remaining === 1 ? '1 task' : `${remaining} tasks`} left. ${timeLeft} until the day ends.`,
  },

  sections: {
    tasks: "Today's tasks",
    tasksDone: (done, total) => `${done}/${total} done`,
    friends: 'Your friends',
    friendsWaiting: (n) => `${n} waiting`,
  },

  taskMeta: {
    day: (index, total) => `Day ${index}/${total}`,
    todayTarget: (value, unit) => `${`${value} ${unit}`.trim()} today`,
    photoProof: 'Photo proof',
    group: (n) => (n === 1 ? 'Group of 1' : `Group of ${n}`),
  },

  toasts: {
    offline: "You're offline. Your check-ins will be sent once you're back online.",
    offlinePending: (n) =>
      `You're offline. ${n === 1 ? '1 check-in' : `${n} check-ins`} saved, sending once you're back online.`,
  },

  empty: {
    greeting: (name) => `Hi, ${name}`,
    title: "It's a desert in here",
    body: 'You have no active challenges. Diken got so bored he fell asleep.',
    findChallenge: 'Find a challenge',
    createOwn: 'Create your own',
  },
};
