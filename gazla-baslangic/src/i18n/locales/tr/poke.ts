import { toAccusative, toDative } from '@/i18n/trGrammar';

/** Dürt alt sayfası (app/poke/[userId].tsx). Ton seçici `t.common.hype` / `t.common.roast`; mesajlar src/content/pokes.ts */
export const poke = {
  unavailable: 'Bu kişiyi şu an dürtemezsin.',
  /** Sayfanın erişilebilirlik etiketi */
  sheetLabel: (name: string) => `${name} için dürt`,
  /** Başlık: bugünkü duruma göre */
  title: {
    pending: (name: string) => `${name} bugün hâlâ yok`,
    done: (name: string) => `${name} bugünü tamamladı`,
  },
  streak: (n: number) => `${n} gün seri`,
  toneLabel: 'Mesaj türü',
  /** Ton seçicinin altındaki açıklama */
  note: {
    harshOff: (name: string) => `${name} sert modu açmamış, sadece gaz verebilirsin.`,
    harshOn: (name: string) => `${name} sert modu açtı, laf sokabilirsin.`,
    hypeAlways: 'Gaz mesajları herkese her zaman açık.',
  },
  /** Günlük hak bitince */
  limitReached: (name: string, limit: number) => `Bugün ${toAccusative(name)} ${limit} kez dürttün, yarın yine dene.`,
  send: (name: string) => `${toDative(name)} gönder`,
  /** Gönderince "Geri al" tostu */
  sent: (name: string) => `${toDative(name)} gönderildi`,
  /** Diken'in balonu */
  diken: {
    harshOn: (name: string) => `${name} sert modu açmış. Acıma.`,
    harshOff: (name: string) => `${name} sert modu açmamış. Gazla bari.`,
  },
};
