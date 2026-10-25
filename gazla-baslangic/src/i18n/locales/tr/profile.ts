import { toAccusative } from '@/i18n/trGrammar';

/** Arkadaş profili (app/user/[id].tsx) ve listeleri (src/features/friends/SharedChallenges, JoinableChallenges) */
export const profile = {
  notViewable: 'Bu profil görüntülenemiyor.',
  /** Ad altındaki satır: "@ece.y · 2 ortak challenge" */
  sharedCount: (username: string, n: number) => `@${username} · ${n} ortak challenge`,
  /** Üçlü istatistik kartlarının etiketleri */
  stats: {
    streak: 'gün seri',
    completed: 'tamamlanan',
    harshMode: 'sert mod',
    on: 'Açık',
    off: 'Kapalı',
  },
  sections: {
    shared: "ORTAK CHALLENGE'LAR",
    joinable: "KATILABİLECEĞİN CHALLENGE'LAR",
  },
  /** Katılınca tost */
  joined: (title: string) => `"${title}" challenge'ına katıldın`,
  /** "Seçenekler" işlem sayfası */
  menu: {
    label: (name: string) => `${name} için işlemler`,
    poke: (name: string) => `${toAccusative(name)} dürt`,
    remove: 'Arkadaşlıktan çıkar',
    removeTitle: (name: string) => `${name} arkadaşlıktan çıkarılsın mı?`,
    removeMessage: 'İstersen sonra yeniden arkadaşlık isteği gönderebilirsin.',
    blockTitle: (name: string) => `${toAccusative(name)} engelle?`,
    blockMessage: "Engellediğin kişi seni bulamaz ve dürtemez. Engeli Ayarlar'dan kaldırabilirsin.",
  },
  /** Ortak challenge satırı: ilerleme "11/30" ya da başlamadıysa */
  shared: {
    notStarted: 'Başlamadı',
  },
  /** Katılınabilir challenge satırı: "7 gün · 2 kişi · yarın başlıyor" */
  joinable: {
    startsToday: 'bugün başlıyor',
    startsTomorrow: 'yarın başlıyor',
    startsIn: (days: number) => `${days} gün sonra başlıyor`,
    joinLabel: (title: string) => `${title} challenge'ına katıl`,
  },
};
