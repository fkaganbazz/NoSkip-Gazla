import type { challenge as tr } from '../tr/challenge';

/** 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st … */
function ordinal(n: number) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

const days = (n: number) => (n === 1 ? '1 day' : `${n} days`);

export const challenge: typeof tr = {
  detail: {
    options: 'Challenge options',
    reminderChip: (time) => `Reminder ${time}`,
    progress: (day, total) => `Day ${day}/${total}`,
    daysLeft: (n) => `${days(n)} left`,
    lastDay: 'Last day',
    startsTomorrow: 'Starts tomorrow',
    startsOn: (date) => `Starts ${date}`,
    finished: 'Finished',
    seeSummary: 'See summary',
    completePhoto: 'Complete with a photo',
    completeNumber: "Enter today's number",
    completeCheck: 'Complete today',
    pokeName: (name) => `Poke ${name}`,
    inviteFriends: 'Invite friends',
  },

  menu: {
    leave: 'Leave challenge',
    leaveTitle: 'Leave this challenge?',
    leaveMessage: "It won't show up on your Today list anymore, and you'll drop off the group leaderboard.",
    leaveConfirm: 'Leave',
    changeReminder: 'Change reminder time',
    invite: 'Invite friends',
  },

  categories: {
    detox: 'Digital detox',
    social_courage: 'Social courage',
    sport: 'Fitness',
    food_drink: 'Food & drink',
    reading: 'Reading',
    money: 'Money',
    quirky: 'Quirky & fun',
  },

  progress: {
    doneToday: 'Done today',
    legend: {
      done: 'Done',
      saved: 'Rescued with an ad',
      today: 'Today',
    },
    cell: (n, state) => `Day ${n}${state ? `, ${state}` : ''}`,
    cellState: {
      done: 'done',
      saved: 'rescued',
      today: 'today, done',
      todayOpen: 'today, pending',
    },
  },

  board: {
    title: 'Group',
    byStreak: 'By streak',
    you: 'You',
    waiting: (streak) => `${days(streak)} · pending today`,
    broken: 'Streak lost, started over',
  },

  reminderSheet: {
    title: 'Reminder time',
    groupTime: (time) => `Group time (${time ?? 'off'})`,
    groupTimeDetail: "Your personal time is cleared and you'll be reminded with the group.",
  },

  names: {
    pair: (rest, last) => `${rest} and ${last}`,
    more: (n) => `${n} more`,
  },

  finished: {
    badge: (done, required) => `${done}/${required} DAYS`,
    title: 'Legendary!',
    sub: (title) => `You finished "${title}".`,
    bloomed: ' Diken is in bloom.',
    stats: {
      days: 'days',
      rescues: (n) => (n === 1 ? 'rescue' : 'rescues'),
      rank: 'group rank',
    },
    rank: ordinal,
    gardenBloomed: 'A blooming cactus joined your garden',
    gardenNew: 'A new cactus joined your garden',
    shareStory: 'Share to story',
    sharePreparing: 'Preparing your share image',
    pickNew: 'Pick a new challenge',
    downloaded: 'Share image downloaded.',
    shareFailed: "Couldn't open sharing. Try again.",
  },
};
