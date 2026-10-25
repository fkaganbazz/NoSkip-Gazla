/** Seri koptu (app/streak-lost/[challengeId].tsx, StreakLost.dc.html) */
import { common } from './common';

/** "Mert", "Mert ve Can", "Mert, Can ve Selin", "Mert, Can ve 2 kişi daha" */
function joinNames(names: string[], max = 3) {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length <= max) return `${names.slice(0, -1).join(', ')} ve ${names[names.length - 1]}`;
  return `${names.slice(0, max - 1).join(', ')} ve ${names.length - (max - 1)} kişi daha`;
}

export const streakLost = {
  /** Bekleyen kurtarma yok (süresi doldu ya da başka yerden kurtarıldı) */
  nothingToSave: 'Kurtarılacak seri yok',

  /** Üstteki hap: kalan süre / kurtarıldı */
  pill: {
    remaining: (time: string) => `Kurtarmak için ${time}`,
    remainingA11y: (time: string) => `Kurtarmak için ${time} kaldı`,
    saved: 'Seri kurtarıldı',
  },

  lostTitle: 'Serin koptu',
  savedTitle: 'Diken sulandı!',
  /** Kaçırılan gün dünse `missedOn` null: "Dün "Plank" günü kaçtı. 12 günlük serin tehlikede." */
  lostSub: (title: string, days: number, missedOn: Date | null) =>
    `${missedOn ? common.dates.dayMonth(missedOn) : common.dates.yesterday} "${title}" günü kaçtı. ${days} günlük serin tehlikede.`,
  savedAdSub: (days: number) => `${days} günlük serin kaldığı yerden devam ediyor. Bugünü unutma.`,
  savedFreeSub: (days: number) => `Ücretsiz hakkını kullandın. Serin ${days}. günden devam ediyor.`,
  /** Aynı challenge'da serisi süren arkadaşlar: "Can hâlâ devam ediyor" */
  friendsContinue: (names: string[]) => `${joinNames(names)} hâlâ devam ediyor`,

  /** Reklam yüklenemedi tostu */
  adFailedFree: 'Reklam şu an yüklenemedi. Ücretsiz hakkını kullanabilirsin.',
  adFailed: 'Reklam şu an yüklenemedi. Biraz sonra tekrar dene.',

  /** Butonlar */
  watchAd: "Reklam izle, Diken'i sula",
  watchAdA11y: "Reklam izle, Diken'i sula, 30 saniye",
  adBadge: '30 sn',
  useFree: 'Ücretsiz hakkımı kullan',
  freeAvailable: 'Ayda 1 hak · bu ay 1 hakkın var',
  freeUsed: 'Ayda 1 hak · bu ayın hakkı kullanıldı',
  restart: 'Baştan başla',
};
