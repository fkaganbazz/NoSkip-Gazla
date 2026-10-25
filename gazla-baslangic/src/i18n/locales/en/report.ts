import type { report as tr } from '../tr/report';

export const report: typeof tr = {
  question: {
    user: (name) => `What happened with ${name}?`,
    generic: 'What happened?',
    photo: 'What happened in this photo?',
    challenge: 'What happened in this challenge?',
  },
  intro: {
    named: (name) => `Your report stays private. ${name} won't see who reported it.`,
    generic: 'Your report stays private. No one sees who reported it.',
  },
  reasons: {
    harassment: 'Harassment or bullying',
    inappropriate_photo: 'Inappropriate photo',
    spam_or_fake: 'Spam or fake account',
    dangerous_challenge: 'A dangerous challenge',
    other: 'Something else',
  },
  detailsLabel: 'Add details (optional)',
  detailsPlaceholder: 'Briefly describe what happened',
  alsoBlock: {
    named: (name) => `Also block ${name}`,
    generic: 'Also block this person',
  },
  reviewNote: 'Our team reviews reports within 24 hours.',
  submit: 'Send report',
  thanks: {
    title: 'Thanks',
    body: 'We got your report. Our team will review it within 24 hours.',
    blocked: (name) => `You blocked ${name}.`,
    blockedGeneric: 'You blocked this person.',
  },
};
