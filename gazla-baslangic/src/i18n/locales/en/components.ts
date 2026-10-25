import type { components as tr } from '../tr/components';

export const components: typeof tr = {
  friendRow: {
    pokeA11y: (name) => `Poke ${name}`,
    hypeA11y: (name) => `Hype up ${name}`,
    acceptA11y: (name) => `Accept ${name}'s request`,
    dismissRequest: 'Delete request',
    withdrawRequest: 'Withdraw request',
    add: 'Add',
    addA11y: (name) => `Send ${name} a friend request`,
    sent: 'Sent',
    bubbleDone: (name) => `${name}, done today`,
    bubblePending: (name) => `${name}, not yet, poke`,
    invite: 'Invite',
  },

  onboardingStep: (step, total) => `Step ${step} of ${total}`,

  streakChip: {
    a11y: (days) => `${days}-day streak`,
    label: (days) => `${days}-DAY STREAK`,
  },

  dropMeter: (filled, total) => `${filled}/${total} watered`,

  taskCard: {
    numberDone: 'done, change the value',
    numberTodo: 'enter the value',
    photoDone: 'done, open photo proof',
    photoTodo: 'check in with a photo',
    checkDone: 'done, undo',
    checkTodo: 'check in for today',
  },

  dikenMoods: {
    mutlu: 'happy',
    selam: 'waving',
    laf: 'roasting',
    cosku: 'excited',
    gurur: 'proud',
    endise: 'worried',
    saskin: 'surprised',
    uykulu: 'sleepy',
    solgun: 'wilted',
  },

  placeholder: (design) => `This screen will be built from ${design} in an upcoming step.`,
};
