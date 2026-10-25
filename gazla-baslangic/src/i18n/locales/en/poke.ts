import type { poke as tr } from '../tr/poke';

export const poke: typeof tr = {
  unavailable: "You can't poke this person right now.",
  sheetLabel: (name) => `Poke ${name}`,
  title: {
    pending: (name) => `${name} hasn't checked in yet`,
    done: (name) => `${name} is done for today`,
  },
  streak: (n) => `${n}-day streak`,
  toneLabel: 'Message type',
  note: {
    harshOff: (name) => `${name} has roast mode off, so it's hype only.`,
    harshOn: (name) => `${name} has roast mode on. Roast away.`,
    hypeAlways: 'Hype messages are always open to everyone.',
  },
  limitReached: (name, limit) =>
    limit === 1
      ? `You already poked ${name} today. Try again tomorrow.`
      : `You poked ${name} ${limit} times today. Try again tomorrow.`,
  send: (name) => `Send to ${name}`,
  sent: (name) => `Sent to ${name}`,
  diken: {
    harshOn: (name) => `${name} turned on roast mode. No mercy.`,
    harshOff: (name) => `${name} has roast mode off. Hype them up, then.`,
  },
};
