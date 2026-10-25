const BACK_VOWELS = 'aıou';
const VOWELS = 'aeıioöuü';

/** Türkçe tamlayan eki: Deniz'in, Can'ın, Ece'nin, Mert'in, Selin'in, Utku'nun */
function possessive(name: string) {
  const lower = name.toLocaleLowerCase('tr');
  const last = [...lower].reverse().find((ch) => VOWELS.includes(ch)) ?? 'e';
  const vowel = BACK_VOWELS.includes(last) ? (last === 'o' || last === 'u' ? 'u' : 'ı') : last === 'ö' || last === 'ü' ? 'ü' : 'i';
  const buffer = VOWELS.includes(lower.charAt(lower.length - 1)) ? 'n' : '';
  return `${name}'${buffer}${vowel}n`;
}

/** Bahçem (app/(tabs)/garden.tsx, src/features/garden). Rozet adları ve açıklamaları veri katmanından */
export const garden = {
  /** Profil satırı (GardenHeader.tsx) */
  header: {
    title: (name: string) => `${possessive(name)} bahçesi`,
    sub: (username: string, harshMode: boolean) => `@${username} · Sert mod ${harshMode ? 'açık' : 'kapalı'}`,
  },
  /** İstatistik kartları (StatRow.tsx) */
  stats: {
    currentStreak: 'Aktif seri',
    completed: 'Tamamlanan',
    longestStreak: 'En uzun seri',
  },
  /** Raflar (GardenShelves.tsx) */
  shelves: {
    /** Raf etiketi: "7 gün kahvesiz" */
    plantLabel: (days: number, title: string) => `${days} gün ${title}`,
    plantA11y: (title: string) => `${title}, tamamlandı`,
    next: 'Sıradaki',
    findNew: 'Yeni challenge bul',
    empty: 'Bitirdiğin her challenge rafına yeni bir kaktüs ekler.',
  },
  /** Rozet ızgarası (Badges.tsx) */
  badges: {
    title: 'Rozetler',
    countA11y: (earned: number, total: number) => `${total} rozetten ${earned} tanesi kazanıldı`,
    locked: 'Kilitli',
    lockedA11y: (title: string, description: string) => `${title}, kilitli. ${description}`,
    earnedA11y: (title: string, description: string) => `${title} rozeti. ${description}`,
    loadFailed: 'Rozetler yüklenemedi.',
  },
};
