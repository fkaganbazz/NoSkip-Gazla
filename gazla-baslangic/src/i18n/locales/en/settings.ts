import type { settings as tr } from '../tr/settings';

export const settings: typeof tr = {
  index: {
    sections: {
      challengeNotifications: 'CHALLENGES AND NOTIFICATIONS',
      appearance: 'APPEARANCE',
      privacy: 'PRIVACY AND SAFETY',
      support: 'SUPPORT AND LEGAL',
    },
    harshMode: 'Roast mode',
    harshModeDetail: "Friends can roast you. When it's off, they can only hype you up.",
    pokePush: 'Poke notifications',
    dailyReminder: 'Daily reminder',
    dayEnd: 'Day ends at',
    theme: 'Theme',
    language: 'Language',
    discoverability: 'Who can find me',
    blocked: 'Blocked users',
    adPreferences: 'Ad preferences',
    adPreferencesFailed: "Couldn't open ad preferences right now. Try again in a bit.",
    help: 'Help and FAQ',
    writeToUs: 'Contact us',
    kvkk: 'KVKK Privacy Notice',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    signOut: 'Sign out',
    signingOut: 'Signing out…',
    deleteAccount: 'Delete account',
    footer: (app, version) => `${app} ${version} · Diken says hi`,
    profileUpdated: 'Profile updated.',
    pageOpenFailed: "Couldn't open the page. Try again in a bit.",
    mailOpenFailed: (email) => `Couldn't open your email app. You can write to us at ${email}.`,
    supportSubject: 'NoSkip support',
    dayEndDescription: (timezone) =>
      `Choose how long after midnight you can still check in for yesterday. Based on your time zone: ${timezone}.`,
  },

  theme: {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },

  language: {
    system: 'System',
    systemDetail: "Follows your phone's language",
  },

  discoverability: {
    everyone: 'Everyone',
    everyoneDetail: 'Anyone who searches your username can find you.',
    nobody: 'No one',
    nobodyDetail: "You won't show up in search. Friends add you with your invite link.",
  },

  dayEnd: {
    midnight: 'Midnight',
    midnightDetail: 'Your day ends at 00:00.',
    plusOne: '+1 hour',
    plusOneDetail: 'Check in for yesterday until 01:00.',
    plusTwo: '+2 hours',
    plusTwoDetail: 'Check in for yesterday until 02:00.',
    rowMidnight: 'Your day ends at midnight, in your time zone.',
    rowGrace: (hours) =>
      `You can still check in ${hours === 1 ? '1 hour' : `${hours} hours`} after midnight, in your time zone.`,
  },

  off: 'Off',
  saveFailed: "Couldn't save right now. Check your connection and try again.",
  pushDenied: "Notifications are off. You can turn them on in your phone's settings.",

  profileCard: {
    a11y: (name) => `${name}, edit profile`,
    edit: 'Edit profile',
  },

  profileEdit: {
    title: 'Edit profile',
    photoA11y: 'Your profile photo',
    pickPhoto: 'Choose a profile photo',
    photo: 'Profile photo',
    removePhoto: 'Remove photo',
    photoHint: 'Helps your friends recognize you.',
    name: 'Your name',
    username: 'Your username',
    usernameTaken: 'That username is taken',
    checking: 'Checking…',
    usernameFree: 'That username is available',
    usernameTooShort: 'Use at least 3 characters',
    usernameTooLong: 'Use 20 characters or fewer',
    usernameChars: 'Use letters, numbers, dots and underscores',
    nameRequired: 'Enter your name',
    nameTooLong: 'Use 40 characters or fewer',
  },

  notifications: {
    title: 'Notifications',
    rules: {
      dikenLimit: 'Diken speaks up at most twice a day',
      quietHours: 'Quiet hours 23:30–08:00',
      roastHarshOnly: 'Roasts only if roast mode is on',
    },
    preferences: 'PREFERENCES',
    pokeDetail: 'Lets you know when friends hype you up or roast you.',
    reminderDetail: "Diken reminds you of today's tasks at the time you pick.",
    reminderTime: 'Reminder time',
    whatWhen: 'WHAT YOU GET AND WHEN',
    copy: {
      reminder: {
        when: 'Daily reminder (your chosen time)',
        title: 'Diken',
        body: "Water, anyone? Today's tasks are waiting for you.",
      },
      dayEnding: {
        when: '2 hours before the day ends',
        title: 'Diken',
        body: "The day's almost over and 2 tasks are left. I'm getting thirsty here.",
      },
      hype: { when: 'A friend hyped you up', title: 'Selin hyped you up', body: '"We\'re finishing this together"' },
      roast: { when: 'A friend roasted you', title: 'Ece roasted you', body: '"Even a cactus grows faster than you"' },
      finished: {
        when: 'A friend finished a challenge',
        title: 'Mert finished',
        body: '10 days no sugar, done. Want to send congrats?',
      },
      streakLost: {
        when: 'Streak lost (next morning 09:00)',
        title: 'Diken',
        body: 'Yesterday slipped by. You have 24 hours to water me.',
      },
      weekly: {
        when: 'Weekly recap (Sunday 19:00)',
        title: 'Your week',
        body: "You finished 5 of 7 days. You're 2nd in your group.",
      },
    },
  },

  blocked: {
    title: 'Blocked',
    emptyTitle: "You haven't blocked anyone.",
    emptyBody: 'When you block someone, they show up here and you can unblock them.',
    lead: "People you block can't see your profile or poke you.",
    unblock: 'Unblock',
    unblockA11y: (name) => `Unblock ${name}`,
    unblocked: (name) => `Unblocked: ${name}`,
  },

  deleteAccount: {
    title: 'Delete account',
    heading: 'Thinking of leaving?',
    body: "If you delete your account, all of this is gone for good. This can't be undone.",
    streakAndGarden: (days) => `Your ${days}-day streak and your garden`,
    streakAndGardenNone: 'Your streak and your garden',
    friends: 'Your friends and groups',
    photos: 'Your photo proofs and messages',
    confirmWord: 'DELETE',
    confirmLabel: 'Type DELETE to confirm',
    submit: 'Permanently delete my account',
    stay: "Never mind, I'm staying",
  },
};
