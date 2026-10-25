/** An ekranları: tamamlama anı (app/completion.tsx), seri kartı, paylaşım kartı ve story paylaşımı (src/features/moments) */
import { toAccusative } from '@/i18n/trGrammar';

/** "Mert", "Mert ve Can", "Mert, Can ve Selin", "Mert, Can ve 2 kişi daha" */
function joinNames(names: string[], max = 3) {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length <= max) return `${names.slice(0, -1).join(', ')} ve ${names[names.length - 1]}`;
  return `${names.slice(0, max - 1).join(', ')} ve ${names.length - (max - 1)} kişi daha`;
}

/** "de/da" bağlacı son ünlüye göre: "Mert ve Can da", "Selin de" */
function alsoParticle(text: string) {
  const vowels = [...text.toLocaleLowerCase('tr-TR')].filter((ch) => 'aeıioöuü'.includes(ch));
  const last = vowels[vowels.length - 1];
  return last && 'aıou'.includes(last) ? 'da' : 'de';
}

export const moments = {
  /** Seri kartındaki kısa gün adları (Pazar'dan başlar; bugün `common.dates.today`) */
  weekdayShort: ['Pa', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'],

  /** Bugün tamam (Completion.dc.html) */
  completion: {
    title: 'Bugün tamam!',
    sub: 'Diken kana kana su içti. Yarın yine bekliyor.',
    great: 'Süper',
    /** "Mert ve Can da bugünü tamamladı." */
    friendsDone: (names: string[]) => {
      const joined = joinNames(names);
      return `${joined} ${alsoParticle(joined)} bugünü tamamladı.`;
    },
    /** Bekleyen arkadaşları dürtme bağlantısı: "Ece'yi gazla", "Ece ve Selin'i gazla", "Ece, Selin ve diğerlerini gazla" */
    hypeUp: (names: string[]) =>
      names.length <= 2
        ? `${joinNames([...names.slice(0, -1), toAccusative(names[names.length - 1])])} gazla`
        : `${names[0]}, ${names[1]} ve diğerlerini gazla`,
  },

  /** Seri kartı (Completion) */
  streakCard: {
    label: 'günlük seri',
    a11y: (n: number) => `${n} günlük seri`,
    dayState: {
      empty: 'boş',
      saved: 'kurtarıldı',
      done: 'tamam',
    },
  },

  /** Paylaşım kartı (ShareCard.dc.html) ve görsel üretilemezse paylaşılan metin */
  share: {
    /** Kartın büyük yazısı: "30 GÜN" */
    bigDays: (n: number) => `${n} GÜN`,
    sub: (name: string) => `${name} başardı. Sıra sende.`,
    handle: (username: string) => `Gazla'da beni bul · @${username}`,
    a11y: (days: number, title: string, name: string) => `${days} gün, ${title}. ${name} başardı. Sıra sende.`,
    dialogTitle: "Story'de paylaş",
    /** "30 GÜN · başlık. Ad başardı. Sıra sende. Gazla'da beni bul · @kullanıcı" */
    message: (days: number, title: string, name: string, username: string) =>
      `${days} GÜN · ${title}. ${name} başardı. Sıra sende. Gazla'da beni bul · @${username}`,
  },
};
