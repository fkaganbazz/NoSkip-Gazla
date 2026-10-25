import type { errors as tr } from '../tr/errors';

export const errors: typeof tr = {
  auth: {
    notCompleted: "Sign-in didn't finish. Try again.",
    cancelled: 'Sign-in cancelled',
    linkExpired: 'This sign-in link has expired. Ask for a new one.',
    linkInvalid: "This link isn't valid anymore. Request a new sign-in link on this device and open it here.",
    tooManyAttempts: 'Too many tries. Try again in a few minutes.',
    emailInvalid: 'Enter a valid email',
    emailNotAuthorized: "We can't send email to this address right now. Continue with Apple or Google.",
    emailProviderDisabled: 'Email sign-in is off right now. Continue with Apple or Google.',
    providerDisabled: 'This sign-in option is off right now. Try another way.',
    signupDisabled: "New accounts can't be created right now. Try again in a bit.",
    userBanned: 'This account has been disabled.',
    emailSendFailed: "Couldn't send the email. Try again in a bit.",
    appleFailed: "Apple sign-in didn't finish. Try again.",
    googleFailed: "Google sign-in didn't finish. Try again.",
    googleInProgress: 'Sign-in is already in progress.',
    googlePlayServices: 'Google sign-in needs Google Play Services.',
  },
  adRewardPending: "The ad reward isn't verified yet. Try again in a moment.",
  pokeUndoExpired: 'Too late to undo',
  validation: {
    usernameTaken: 'This username is taken',
    graceHours: 'Grace can be 0, 1 or 2 hours',
    invalidTime: 'Invalid time',
    durationRange: 'Length must be between 3 and 60 days',
  },
};
