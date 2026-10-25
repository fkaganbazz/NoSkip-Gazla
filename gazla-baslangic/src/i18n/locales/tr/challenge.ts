import type { ChallengeCategory } from '@/data';
import { toAccusative } from '@/i18n/trGrammar';

export const challenge = {
  /** Detay ekranı (app/challenge/[id].tsx) */
  detail: {
    options: 'Challenge seçenekleri',
    /** Bilgi çipi: "Hatırlatma 20:00" */
    reminderChip: (time: string) => `Hatırlatma ${time}`,
    /** İlerleme kartı başlığı: "Gün 12/30" */
    progress: (day: number, total: number) => `Gün ${day}/${total}`,
    daysLeft: (n: number) => `${n} gün kaldı`,
    lastDay: 'Son gün',
    startsTomorrow: 'Yarın başlıyor',
    /** date: "28 Eylül" */
    startsOn: (date: string) => `${date} başlıyor`,
    finished: 'Bitti',
    // Alt buton
    seeSummary: 'Özeti gör',
    completePhoto: 'Fotoğrafla tamamla',
    completeNumber: 'Bugünkü değeri gir',
    completeCheck: 'Bugünü tamamla',
    /** "Ece'yi dürt" (alt buton ve grup satırındaki Dürt'ün erişilebilirlik adı) */
    pokeName: (name: string) => `${toAccusative(name)} dürt`,
    inviteFriends: 'Arkadaş davet et',
  },

  /** "…" seçenek sayfası */
  menu: {
    leave: "Challenge'dan ayrıl",
    leaveTitle: "Challenge'dan ayrıl?",
    leaveMessage: 'Bu challenge artık Bugün listende görünmez ve grup sıralamasından çıkarsın.',
    leaveConfirm: 'Ayrıl',
    changeReminder: 'Hatırlatma saatini değiştir',
    invite: 'Arkadaş davet et',
  },

  /** Detaydaki kategori çipi */
  categories: {
    detox: 'Dijital detoks',
    social_courage: 'Sosyal cesaret',
    sport: 'Spor',
    food_drink: 'Yeme-içme',
    reading: 'Okuma',
    money: 'Para',
    quirky: 'Tuhaf ve eğlenceli',
  } satisfies Record<ChallengeCategory, string>,

  /** İlerleme kartı (ProgressCard) */
  progress: {
    doneToday: 'Bugün tamam',
    legend: {
      done: 'Tamamlandı',
      saved: 'Reklamla kurtarıldı',
      today: 'Bugün',
    },
    /** Takvim hücresinin erişilebilirlik adı: "Gün 3, tamamlandı" */
    cell: (n: number, state: string | null) => `Gün ${n}${state ? `, ${state}` : ''}`,
    cellState: {
      done: 'tamamlandı',
      saved: 'kurtarıldı',
      today: 'bugün, tamamlandı',
      todayOpen: 'bugün, bekliyor',
    },
  },

  /** Grup sıralaması (BoardCard) */
  board: {
    title: 'Grup',
    byStreak: 'Seriye göre',
    you: 'Sen',
    /** "12 gün · bugün bekliyor" */
    waiting: (streak: number) => `${streak} gün · bugün bekliyor`,
    broken: 'Seri koptu, yeniden başladı',
  },

  /** Hatırlatma saati sayfası (ReminderSheet) */
  reminderSheet: {
    title: 'Hatırlatma saati',
    /** time null: grupta hatırlatma yok */
    groupTime: (time: string | null) => `Grubun saati (${time ?? 'kapalı'})`,
    groupTimeDetail: 'Kişisel saatin silinir, grupla aynı saatte hatırlatılırsın.',
  },

  /** Ad listesi (challenge/logic.ts joinNames): "Mert, Can ve Selin", "Mert, Can ve 2 kişi daha" */
  names: {
    /** rest: virgülle birleştirilmiş ilk adlar */
    pair: (rest: string, last: string) => `${rest} ve ${last}`,
    more: (n: number) => `${n} kişi daha`,
  },

  /** Challenge bitti (app/challenge/[id]/finished.tsx) */
  finished: {
    badge: (done: number, required: number) => `${done}/${required} GÜN`,
    title: 'Efsane!',
    sub: (title: string) => `"${title}" challenge'ını bitirdin.`,
    /** sub'ın sonuna (başında boşluk) */
    bloomed: ' Diken çiçek açtı.',
    stats: {
      days: 'gün',
      rescues: (_n: number) => 'kurtarma',
      rank: 'grupta sıra',
    },
    /** Sıra: "1." */
    rank: (n: number) => `${n}.`,
    gardenBloomed: 'Bahçene çiçekli bir kaktüs eklendi',
    gardenNew: 'Bahçene yeni bir kaktüs eklendi',
    shareStory: "Story'de paylaş",
    sharePreparing: 'Paylaşım görseli hazırlanıyor',
    pickNew: 'Yeni challenge seç',
    downloaded: 'Paylaşım görseli indirildi.',
    shareFailed: 'Paylaşım açılamadı. Tekrar dene.',
  },
};
