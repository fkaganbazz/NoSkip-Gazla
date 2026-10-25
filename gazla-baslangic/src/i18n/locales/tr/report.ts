import { toAccusative } from '@/i18n/trGrammar';

/** Şikayet et (app/report/[userId].tsx, src/features/report). Başlık `t.common.report`, "Tamam" `t.common.done` */
export const report = {
  /** Soru başlığı: kişi, fotoğraf ya da challenge şikayeti */
  question: {
    user: (name: string) => `${name} hakkında ne oldu?`,
    generic: 'Ne oldu?',
    photo: 'Bu fotoğrafta ne oldu?',
    challenge: "Bu challenge'da ne oldu?",
  },
  intro: {
    named: (name: string) => `Şikayetin gizli kalır. ${name} bunu kimin bildirdiğini görmez.`,
    generic: 'Şikayetin gizli kalır. Kimin bildirdiğini kimse görmez.',
  },
  /** Nedenler (report_reason enum'u; sıra ReasonList.tsx'te) */
  reasons: {
    harassment: 'Hakaret veya zorbalık',
    inappropriate_photo: 'Uygunsuz fotoğraf',
    spam_or_fake: 'Spam veya sahte hesap',
    dangerous_challenge: 'Tehlikeli bir challenge',
    other: 'Başka bir şey',
  },
  detailsLabel: 'Ayrıntı ekle (isteğe bağlı)',
  detailsPlaceholder: 'Ne olduğunu kısaca yaz',
  alsoBlock: {
    named: (name: string) => `${toAccusative(name)} de engelle`,
    generic: 'Bu kişiyi de engelle',
  },
  reviewNote: 'Ekibimiz şikayetleri 24 saat içinde inceler.',
  submit: 'Şikayeti gönder',
  /** Gönderildi durumu */
  thanks: {
    title: 'Teşekkürler',
    body: 'Şikayetin bize ulaştı. Ekibimiz 24 saat içinde inceleyecek.',
    blocked: (name: string) => `${toAccusative(name)} engelledin.`,
    blockedGeneric: 'Bu kişiyi engelledin.',
  },
};
