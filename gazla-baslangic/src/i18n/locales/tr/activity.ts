import { accusativeSuffix, toDative } from '@/i18n/trGrammar';

/** Aktivite (app/activity.tsx, src/features/activity). Zaman etiketleri `t.common.dates` */
export const activity = {
  title: 'Aktivite',
  markAllRead: 'Tümü okundu',
  empty: 'Henüz bir hareket yok. Arkadaşların seni dürttüğünde ya da davet ettiğinde burada görünür.',
  loadingMore: 'Daha eski bildirimler yükleniyor',
  loadMoreFailed: 'Daha eskiler yüklenemedi.',
  /** "Tebrik et" sonrası tost ("Geri al" ile) */
  congratsSent: (name: string) => `${toDative(name)} tebrik gönderildi`,
  /** Gün grupları */
  groups: {
    today: 'BUGÜN',
    yesterday: 'DÜN',
    older: 'DAHA ÖNCE',
  },
  /** Satır başlıkları, bildirim türüne göre (logic.ts) */
  rows: {
    pokeRoast: (name: string) => `${name} sana laf soktu`,
    pokeHype: (name: string) => `${name} sana gaz verdi`,
    finished: (name: string, challenge: string) => `${name} "${challenge}"${accusativeSuffix(challenge)} bitirdi`,
    finishedUnknown: (name: string) => `${name} bir challenge'ı bitirdi`,
    friendRequest: (name: string) => `${name} arkadaşlık isteği gönderdi`,
    challengeInvite: (name: string) => `${name} seni bir challenge'a ekledi`,
  },
  /** Diken'in bildirimlerinde sunucudan metin gelmezse */
  dikenFallback: {
    daily_reminder: 'Bugünkü görevlerin seni bekliyor.',
    day_ending: 'Günün bitmesine az kaldı.',
    streak_broken: 'Serin koptu. 24 saat içinde kurtarabilirsin.',
    weekly_summary: 'Haftalık özetin hazır.',
    streak_milestone: 'Serin büyüyor. Böyle devam.',
  },
  /** Satır butonları (ActivityRow.tsx); Kabul et / Sil / Katıl `t.common` */
  actions: {
    acceptLabel: (name: string) => `${name} isteğini kabul et`,
    declineLabel: (name: string) => `${name} isteğini sil`,
    reply: 'Karşılık ver',
    replyLabel: (name: string) => `${name} kişisine karşılık ver`,
    congrats: 'Tebrik et',
    congratsDone: 'Tebrik edildi',
    congratsLabel: (name: string) => `${name} kişisini tebrik et`,
    congratsDoneLabel: (name: string) => `${name} tebrik edildi`,
    declineInvite: 'Reddet',
  },
  unread: 'Okunmadı',
};
