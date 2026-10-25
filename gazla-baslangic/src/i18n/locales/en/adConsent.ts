import type { adConsent as tr } from '../tr/adConsent';

export const adConsent: typeof tr = {
  title: 'Ads keep Diken free',
  lead: "Here's how it works, up front:",
  points: {
    noAds: 'Never any ads when you check in.',
    rescue: 'You only watch a streak rescue ad when you want to.',
    personalized: "If you allow it, ads are picked based on your interests. If you don't, you'll see the same number of ads.",
  },
  note: 'Your phone will ask for permission on the next screen. You can change your choice anytime in Settings.',
  manage: 'Manage ad preferences',

  privacyOptions: {
    notRequiredWeb: "Ads aren't shown on the web version.",
    notRequiredIos:
      'There are no extra ad preferences to manage in your region. You can change tracking permission in iPhone Settings.',
    notRequiredAndroid:
      "There are no extra ad preferences to manage in your region. You can manage your ad ID in your phone's settings.",
    failed: "Couldn't open ad preferences right now. Try again in a bit.",
  },
};
