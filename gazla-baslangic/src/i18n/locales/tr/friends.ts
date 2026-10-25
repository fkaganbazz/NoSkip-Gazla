/** Arkadaşlar sekmesi (app/(tabs)/friends.tsx) ve davet kartı, satır alt metinleri (src/features/friends) */
export const friends = {
  screen: {
    title: 'Arkadaşlar',
    addFriend: 'Arkadaş ekle',
    searchPlaceholder: 'Kullanıcı adıyla ara',
    noResults: 'Bu kullanıcı adıyla kimse yok.',
    /** Satır erişilebilirlik etiketi */
    profileLabel: (name: string) => `${name} profili`,
    /** Web'de paylaşım yokken davet metni panoya kopyalanınca */
    inviteCopied: 'Davet metni kopyalandı',
  },
  /** Bölüm başlıkları */
  sections: {
    requests: 'İSTEKLER',
    pending: 'BUGÜN BEKLEYENLER',
    done: 'BUGÜNÜ TAMAMLAYANLAR',
    idle: 'BUGÜN GÖREVİ OLMAYANLAR',
  },
  /** Satır alt metinleri (logic.ts): "11 gün seri · telefonsuz sabah", "@kerem.a · 3 ortak" */
  rows: {
    streak: (n: number) => `${n} gün seri`,
    activeChallenges: (n: number) => `${n} challenge`,
    mutual: (n: number) => `${n} ortak`,
  },
  /** "Arkadaşını davet et" kartı (InviteCard.tsx) ve paylaşım metni (share.ts) */
  invite: {
    title: 'Arkadaşını davet et',
    sub: 'Linkle gelen, doğrudan grubuna katılır.',
    emptyTitle: 'Henüz arkadaşın yok',
    emptySub: 'Arkadaşını davet et ya da kullanıcı adıyla ara. Linkle gelen, doğrudan grubuna katılır.',
    shareLabel: 'Arkadaş davetini paylaş',
    message: (username: string | null | undefined, url: string) =>
      username
        ? `Gazla'da birlikte challenge yapalım. Uygulamayı indir, Arkadaşlar'da beni @${username} diye ara: ${url}`
        : `Gazla'da birlikte challenge yapalım. Uygulamayı indir: ${url}`,
  },
};
