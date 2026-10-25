/** Bugün sekmesi (app/(tabs)/index.tsx, src/features/today) */
export const today = {
  /** Saate göre selamlama (05–12, 12–18, diğer saatler) */
  greeting: {
    morning: 'Günaydın',
    afternoon: 'İyi günler',
    evening: 'İyi akşamlar',
    /** "İyi akşamlar, Deniz" */
    withName: (greeting: string, name: string) => `${greeting}, ${name}`,
  },

  /** Üst satır: aktivite zili */
  header: {
    activity: 'Aktivite',
    activityUnread: (n: number) => `Aktivite, ${n} yeni`,
  },

  /** Kahraman kartı: Diken'in su durumu */
  hero: {
    doneTitle: 'Diken kana kana içti',
    doneSub: (days: number) => `Bugün tamam. Serin ${days} gün oldu.`,
    thirstyTitle: 'Diken susadı',
    stillThirstyTitle: 'Diken hâlâ susuz',
    almostTitle: 'Az kaldı, bırakma',
    almostSub: 'Tek görev kaldı. Diken bardağı görüyor.',
    /** "2 görev kaldı. Günün bitmesine 4 sa 58 dk var." */
    countdown: (remaining: number, timeLeft: string) => `${remaining} görev kaldı. Günün bitmesine ${timeLeft} var.`,
  },

  /** Bölüm başlıkları */
  sections: {
    tasks: 'Bugünkü görevler',
    tasksDone: (done: number, total: number) => `${done}/${total} tamam`,
    friends: 'Arkadaşların',
    friendsWaiting: (n: number) => `${n} kişi bekliyor`,
  },

  /** Görev kartının alt satırı: "Gün 12/30 · Grup 4 kişi", "Dün · Gün 4/30 · Fotoğraf kanıtı" */
  taskMeta: {
    day: (index: number, total: number) => `Gün ${index}/${total}`,
    /** Sayı tipi, henüz girilmedi: "Bugün 70 sn" (birim challenge'dan, boş olabilir) */
    todayTarget: (value: string, unit: string) => `Bugün ${value} ${unit}`.trim(),
    photoProof: 'Fotoğraf kanıtı',
    group: (n: number) => `Grup ${n} kişi`,
  },

  /** Alt tostlar (çevrimdışı işaretleme kuyruğu) */
  toasts: {
    offline: 'Çevrimdışısın. İşaretlemelerin bağlanınca gönderilir.',
    offlinePending: (n: number) => `Çevrimdışısın. ${n} işaretleme kaydedildi, bağlanınca gönderilir.`,
  },

  /** Boş hali (EmptyToday.dc.html) */
  empty: {
    greeting: (name: string) => `Merhaba, ${name}`,
    title: 'Burası çöl gibi',
    body: "Aktif challenge'ın yok. Diken sıkıntıdan uyuyakaldı.",
    findChallenge: 'Challenge bul',
    createOwn: 'Kendin oluştur',
  },
};
