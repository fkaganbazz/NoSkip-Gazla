import type { common as tr } from '../tr/common';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const common: typeof tr = {
  appName: 'NoSkip',
  mascot: 'Diken',

  close: 'Close',
  back: 'Back',
  cancel: 'Cancel',
  continue: 'Continue',
  done: 'Done',
  save: 'Save',
  saved: 'Saved',
  send: 'Send',
  share: 'Share',
  copy: 'Copy',
  copied: 'Copied',
  delete: 'Delete',
  undo: 'Undo',
  retry: 'Try again',
  accept: 'Accept',
  join: 'Join',
  options: 'Options',
  settings: 'Settings',
  openSettings: 'Open Settings',
  skipForNow: 'Skip for now',
  report: 'Report',
  block: 'Block',
  poke: 'Poke',
  hype: 'Hype up',
  roast: 'Roast',

  loading: 'Loading',
  loadFailed: "Couldn't load right now. Check your connection and try again.",
  offline: "No internet connection. Try again once you're back online.",
  somethingWentWrong: 'Something went wrong',

  days: (n) => (n === 1 ? '1 day' : `${n} days`),
  dayN: (n) => `Day ${n}`,
  people: (n) => (n === 1 ? '1 person' : `${n} people`),

  dates: {
    months: MONTHS,
    weekdays: WEEKDAYS,
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    dayMonth: (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}`,
    weekdayDayMonth: (d) => `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`,
    minutesShort: (n) => `${n}m`,
    hoursShort: (n) => `${n}h`,
  },
};
