import type { create as tr } from '../tr/create';

export const create: typeof tr = {
  title: 'New challenge',

  name: {
    label: 'Challenge name',
    placeholder: '20-minute evening walk',
    tooShort: (min) => `Name must be at least ${min} characters`,
    tooLong: (max) => `Name can be at most ${max} characters`,
  },

  duration: {
    label: 'Duration',
    custom: 'Custom',
    decrease: 'One day less',
    increase: 'One day more',
  },

  taskLabel: 'How do you complete it?',
  taskTypes: {
    check: { title: 'Check in', desc: 'Finish the day with a single tap' },
    number: { title: 'Enter a number', desc: 'Minutes, steps, pages and so on' },
    photo: { title: 'Photo proof', desc: 'The group sees it and reacts' },
  },

  number: {
    unit: 'Unit',
    unitPlaceholder: 'min',
    target: 'Target',
    increment: 'Daily +',
  },

  reminder: {
    label: 'Reminder',
    daily: (time) => `Daily at ${time}`,
    off: 'Off',
    offLong: 'Reminder off',
    earlier: (minutes) => `${minutes} minutes earlier`,
    later: (minutes) => `${minutes} minutes later`,
  },

  visibility: {
    label: 'Who can see it',
    options: {
      invited: { title: 'Invited only', desc: 'Only people you invite can see it' },
      friends: { title: 'My friends', desc: 'Your friends see it on your profile and can join' },
    },
  },

  start: {
    label: 'Starts',
  },

  invite: {
    add: 'Add friends',
    none: 'Invite your friends',
    summary: (names) => `${names} will be invited`,
    noFriends: 'You can share the invite link once the challenge is created',
  },

  submit: 'Start challenge',
};
