import type { auth as tr } from '../tr/auth';

export const auth: typeof tr = {
  callback: {
    backToSignIn: 'Back to sign in',
  },

  signIn: {
    title: 'Keep your streak, create an account',
    body: 'So your friends can find you. Switch phones and your streak and garden come with you.',
    continueWithApple: 'Continue with Apple',
    continueWithGoogle: 'Continue with Google',
    continueWithEmail: 'Continue with email',
    emailLabel: 'Your email',
    emailSent: 'We sent a sign-in link to your email. Open it on this device to continue.',
    sendLink: 'Send link',
    // KVKK aydınlatma metni yalnızca Türkçe (legalLinkFor): Türkiye'deki kullanıcılar için olduğu söylenir
    legal: 'By continuing, you agree to our {terms} and {privacy}. For users in Turkey, see our {kvkk}.',
    legalLinks: {
      terms: 'Terms of Use',
      privacy: 'Privacy Policy',
      kvkk: 'KVKK notice (in Turkish)',
    },
  },
};
