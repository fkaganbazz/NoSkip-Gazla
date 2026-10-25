import type { invite as tr } from '../tr/invite';

export const invite: typeof tr = {
  landing: {
    title: (inviter) => `${inviter} is inviting you to a challenge`,
    dikenLine: "Don't be the one who skips.",
    joinAndStart: 'Join and start',
    notNow: 'Not now',
    membersJoined: (n) => (n === 1 ? '1 person joined' : `${n} people joined`),
    yourTurn: 'Your turn',
    endedTitle: 'This challenge is finished',
    endedBody: "This invite's challenge has ended. Start a new one and invite your friends yourself.",
    invalidTitle: 'This invite link is invalid',
    invalidBody: 'The link may have expired or been copied wrong. Ask whoever invited you for a new one.',
    goHome: 'Back to home',
    taskTypes: {
      check: 'Check in',
      number: 'Enter a number',
      photo: 'Photo proof',
    },
    started: 'Started',
    startsToday: 'Starts today',
    startsTomorrow: 'Starts tomorrow',
    startsInDays: (n) => (n === 1 ? 'Starts in 1 day' : `Starts in ${n} days`),
  },

  friends: {
    title: "It's boring alone. Bring your friends.",
    body: 'Every friend who joins will hype you up. And roast you if you skip a day.',
    groupSolo: 'Just you in the group for now',
    groupCount: (n) => (n === 1 ? '1 person in the group' : `${n} people in the group`),
    linkLabel: 'Your invite link',
    copyA11y: 'Copy invite link',
    copied: 'Invite link copied',
    copyFailed: "Couldn't copy the link. You can send it with Share instead.",
    linkFailed: "Couldn't create an invite link right now.",
    sendAsMessage: 'Send as text',
    findInContacts: 'Find in contacts',
    searchByUsername: 'Search by username',
    shareMessage: (title, url) => `Join me in the "${title}" challenge on NoSkip, let's hype each other up: ${url}`,
    noChallengeTitle: 'Start a challenge first',
    noChallengeBody: 'You invite friends to a challenge. Pick one or make your own, and your invite link is ready.',
    createChallenge: 'Create a challenge',
  },

  search: {
    title: 'Add friends',
    placeholder: 'Search by username',
    prompt: "Type your friend's username.",
    noResults: 'No one has that username.',
  },

  people: {
    friendSub: (username) => `@${username} · Your friend`,
    acceptA11y: (name) => `Accept ${name}'s request`,
  },

  contacts: {
    title: 'Find in contacts',
    privacy: 'Email addresses never leave your phone. Only hashed versions are sent to find matches.',
    limited: 'We only looked at the contacts you chose to share.',
    pickMore: 'Choose contacts',
    askBody:
      'To find your friends, we need to look at your contacts. If you allow it, we only compare hashed versions of email addresses.',
    deniedBody: 'Contacts access is off. To find your friends, turn on Contacts access in Settings.',
    allow: 'Allow',
    noEmails: 'No one in your contacts has an email address',
    noMatches: 'None of your contacts are on NoSkip yet',
    emptyBody: 'Send your invite link. Once they join, you start together.',
    shareLink: 'Share invite link',
    readFailed: "We couldn't check your contacts right now. Try again?",
  },
};
