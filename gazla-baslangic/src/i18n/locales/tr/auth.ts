export const auth = {
  /** Giriş dönüşü (app/auth/callback.tsx) hata ekranı */
  callback: {
    backToSignIn: 'Girişe dön',
  },

  /** Hesabını aç (app/(onboarding)/sign-in.tsx, ProviderButtons) */
  signIn: {
    title: 'Serin kaybolmasın, hesabını aç',
    body: 'Arkadaşların seni bulabilsin. Telefon değiştirsen de serin ve bahçen seninle gelsin.',
    continueWithApple: 'Apple ile devam et',
    continueWithGoogle: 'Google ile devam et',
    continueWithEmail: 'E-posta ile devam et',
    emailLabel: 'E-posta adresin',
    emailSent: 'Giriş bağlantısını e-postana gönderdik. Bağlantıyı bu cihazda açınca devam edersin.',
    sendLink: 'Bağlantı gönder',
    /** Yasal metin: {terms}, {privacy}, {kvkk} yerine bağlantılar (`legalLinks`) gelir; sıra dile göre değişebilir */
    legal: "Devam ederek {terms}'nı ve {privacy}'nı kabul edersin. Verilerini nasıl işlediğimizi {kvkk}'nde anlatıyoruz.",
    legalLinks: {
      terms: 'Kullanım Koşulları',
      privacy: 'Gizlilik Politikası',
      kvkk: 'KVKK Aydınlatma Metni',
    },
  },
};
