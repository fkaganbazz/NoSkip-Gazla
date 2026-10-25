import type { onboarding as tr } from '../tr/onboarding';

export const onboarding: typeof tr = {
  welcome: {
    title: "Your streak, Diken's roasts.",
    lead: 'Join 7, 10 or 30-day challenges with your friends. Hype each other up, and Diken pokes whoever skips a day.',
    start: "Let's go",
    haveAccount: 'I already have an account',
    bubble: "I'm Diken. I'm here to poke you.",
  },

  pick: {
    title: 'Pick your first challenge',
    body: 'You can add as many as you like later. Your friends can join the same challenge too.',
    custom: "I'll make my own",
  },

  categories: {
    detox: 'Detox',
    social_courage: 'Social courage',
    sport: 'Sports',
    food_drink: 'Food & drink',
    reading: 'Reading',
    money: 'Money',
    quirky: 'Quirky',
  },

  profile: {
    title: 'What should we call you?',
    body: 'Your friends find you by your username.',
    nameLabel: 'Your name',
    avatar: {
      label: 'Your profile photo',
      add: 'Add profile photo',
      change: 'Change profile photo',
      title: 'Profile photo',
      note: 'You can add one later if you like.',
    },
    username: {
      label: 'Your username',
      short: 'Must be at least 3 characters',
      available: 'This username is available',
      unavailable: "This username is taken or can't be used",
    },
    birthYear: {
      label: 'Your birth year',
      a11yLabel: (year) => `Your birth year${year ? `, ${year}` : ''}`,
      a11yHint: 'Opens the year list',
      placeholder: 'Pick',
      note: 'Not shown on your profile. We only ask to check your age.',
    },
  },

  notifications: {
    title: 'Let me poke you.',
    body: "Promise, I'll only write when the day's ending or friends poke you.",
    allow: 'Allow notifications',
    notNow: 'Not now',
    previewTime: '9:30 PM',
    previewBody: "The day's almost over and 2 tasks are left. I'm getting thirsty here.",
    previewA11y: (body) => `Sample notification: Diken, ${body}`,
  },

  genericError: 'Something went wrong. Check your connection and try again.',
  inviteJoinFailed: (reason) => `Couldn't accept the invite: ${reason}`,
};
