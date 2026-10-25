/**
 * Ayarlar: ana ekran (app/settings/index.tsx), Bildirimler, Engellenenler, Hesabı sil, profil düzenleme sayfası
 * (src/features/settings). Bölüm etiketleri büyük harfle yazılır (SectionLabel de büyütür).
 */
export const settings = {
  /** Ayarlar ana ekranı */
  index: {
    sections: {
      challengeNotifications: 'CHALLENGE VE BİLDİRİMLER',
      appearance: 'GÖRÜNÜM',
      privacy: 'GİZLİLİK VE GÜVENLİK',
      support: 'DESTEK VE YASAL',
    },
    harshMode: 'Sert mod',
    harshModeDetail: 'Arkadaşların sana laf sokabilir. Kapalıyken sadece gaz verebilirler.',
    pokePush: 'Dürtme bildirimleri',
    dailyReminder: 'Günlük hatırlatma',
    dayEnd: 'Gün bitişi',
    /** Görünüm seçicisinin ekran okuyucu adı */
    theme: 'Tema',
    language: 'Dil',
    discoverability: 'Beni kimler bulabilir',
    blocked: 'Engellenen kullanıcılar',
    adPreferences: 'Reklam tercihleri',
    /** Gizlilik seçenekleri formu açılamadı (ad-consent ekranındaki metinle aynı) */
    adPreferencesFailed: 'Reklam tercihleri şu an açılamadı. Biraz sonra tekrar dene.',
    help: 'Yardım ve SSS',
    writeToUs: 'Bize yaz',
    kvkk: 'KVKK Aydınlatma Metni',
    privacy: 'Gizlilik Politikası',
    terms: 'Kullanım Koşulları',
    signOut: 'Çıkış yap',
    signingOut: 'Çıkış yapılıyor…',
    deleteAccount: 'Hesabı sil',
    /** "Gazla 1.0.0 · Diken selam söylüyor" */
    footer: (app: string, version: string) => `${app} ${version} · Diken selam söylüyor`,
    profileUpdated: 'Profilin güncellendi.',
    pageOpenFailed: 'Sayfa açılamadı. Biraz sonra tekrar dene.',
    mailOpenFailed: (email: string) => `E-posta uygulaması açılamadı. Bize ${email} adresinden yazabilirsin.`,
    /** "Bize yaz" e-postasının konusu */
    supportSubject: 'Gazla destek',
    dayEndDescription: (timezone: string) =>
      `Gece yarısından sonra dünkü görevlerini ne kadar süre daha işaretleyebileceğini seç. Saat dilimine göre hesaplanır: ${timezone}.`,
  },

  /** Görünüm seçici */
  theme: {
    light: 'Açık',
    dark: 'Koyu',
    system: 'Sistem',
  },

  /** Dil seçimi (dil adları her dilde kendi dilinde: Türkçe, English) */
  language: {
    system: 'Sistem',
    systemDetail: 'Telefonunun diline göre',
  },

  discoverability: {
    everyone: 'Herkes',
    everyoneDetail: 'Kullanıcı adınla arayan herkes seni bulabilir.',
    nobody: 'Hiç kimse',
    nobodyDetail: 'Aramada çıkmazsın. Arkadaşların seni davet bağlantınla ekler.',
  },

  /** Gün bitişi toleransı (0/1/2 saat) */
  dayEnd: {
    midnight: 'Gece yarısı',
    midnightDetail: "Gün 00:00'da biter.",
    plusOne: '+1 saat',
    plusOneDetail: "Dünü 01:00'e kadar işaretleyebilirsin.",
    plusTwo: '+2 saat',
    plusTwoDetail: "Dünü 02:00'ye kadar işaretleyebilirsin.",
    /** Ayarlar satırındaki açıklama */
    rowMidnight: 'Gün gece yarısında biter. Saat dilimine göre hesaplanır.',
    rowGrace: (hours: number) =>
      `Gece yarısından sonra ${hours} saat daha işaretleyebilirsin. Saat dilimine göre hesaplanır.`,
  },

  /** Hatırlatma kapalıyken satır değeri */
  off: 'Kapalı',
  saveFailed: 'Şu an kaydedilemedi. Bağlantını kontrol edip tekrar dene.',
  pushDenied: 'Bildirim izni kapalı. Telefonunun ayarlarından açabilirsin.',

  /** Ayarlar üstündeki profil kartı */
  profileCard: {
    a11y: (name: string) => `${name}, profili düzenle`,
    edit: 'Profili düzenle',
  },

  /** Profili düzenle sayfası */
  profileEdit: {
    title: 'Profili düzenle',
    photoA11y: 'Profil fotoğrafın',
    pickPhoto: 'Profil fotoğrafı seç',
    photo: 'Profil fotoğrafı',
    removePhoto: 'Fotoğrafı kaldır',
    photoHint: 'Arkadaşların seni daha kolay tanır.',
    name: 'Adın',
    username: 'Kullanıcı adın',
    usernameTaken: 'Bu kullanıcı adı alınmış',
    checking: 'Kontrol ediliyor…',
    usernameFree: 'Bu kullanıcı adı boşta',
    usernameTooShort: 'En az 3 karakter olmalı',
    usernameTooLong: 'En fazla 20 karakter olabilir',
    usernameChars: 'Harf, rakam, nokta ve alt çizgi kullanabilirsin',
    nameRequired: 'Adını yazmalısın',
    nameTooLong: 'En fazla 40 karakter olabilir',
  },

  /** Bildirimler ekranı (Notifications.dc.html) */
  notifications: {
    title: 'Bildirimler',
    rules: {
      dikenLimit: 'Diken günde en fazla 2 kez konuşur',
      quietHours: 'Sessiz saatler 23:30–08:00',
      roastHarshOnly: 'Laf sokma sadece sert mod açıksa',
    },
    preferences: 'TERCİHLER',
    pokeDetail: 'Arkadaşların gaz verince ya da laf sokunca haber verir.',
    reminderDetail: 'Diken seçtiğin saatte bugünkü görevlerini hatırlatır.',
    reminderTime: 'Hatırlatma saati',
    whatWhen: 'NE ZAMAN NE GELİR',
    /** Örnek bildirimler (kişi adları tasarımdaki örnekler) */
    copy: {
      reminder: {
        when: 'Günlük hatırlatma (seçilen saat)',
        title: 'Diken',
        body: 'Su yok mu su? Bugünkü görevlerin seni bekliyor.',
      },
      dayEnding: {
        when: 'Gün bitimine 2 saat kala',
        title: 'Diken',
        body: 'Gün bitiyor, 2 görevin duruyor. Susuz kaldım burada.',
      },
      hype: { when: 'Arkadaşın gaz verdi', title: 'Selin sana gaz verdi', body: '"Beraber bitireceğiz"' },
      roast: { when: 'Arkadaşın laf soktu', title: 'Ece sana laf soktu', body: '"Kaktüs bile senden hızlı büyüyor"' },
      finished: {
        when: 'Arkadaşın challenge bitirdi',
        title: 'Mert bitirdi',
        body: '10 gün şekersiz tamam. Tebrik etmek ister misin?',
      },
      streakLost: {
        when: 'Seri koptu (ertesi sabah 09:00)',
        title: 'Diken',
        body: 'Dün kaçtı. Beni sulamak için 24 saatin var.',
      },
      weekly: {
        when: 'Haftalık özet (Pazar 19:00)',
        title: 'Haftan',
        body: "7 günün 5'ini tamamladın. Grupta 2. sıradasın.",
      },
    },
  },

  /** Engellenenler */
  blocked: {
    title: 'Engellenenler',
    emptyTitle: 'Engellediğin kimse yok.',
    emptyBody: 'Birini engellediğinde burada görünür; engeli buradan kaldırabilirsin.',
    lead: 'Engellediğin kişiler profilini göremez ve seni dürtemez.',
    unblock: 'Engeli kaldır',
    unblockA11y: (name: string) => `${name} engelini kaldır`,
    unblocked: (name: string) => `Engel kaldırıldı: ${name}`,
  },

  /** Hesabı sil (DeleteAccount.dc.html) */
  deleteAccount: {
    title: 'Hesabı sil',
    heading: 'Gitmek mi istiyorsun?',
    body: 'Hesabını silersen bunlar kalıcı olarak silinir. Bu işlem geri alınamaz.',
    streakAndGarden: (days: number) => `${days} günlük serin ve bahçen`,
    streakAndGardenNone: 'Serin ve bahçen',
    friends: 'Arkadaşların ve grupların',
    photos: 'Fotoğraf kanıtların ve mesajların',
    /** Onay kelimesi: yazılan metin tam olarak bu olmalı */
    confirmWord: 'SİL',
    confirmLabel: 'Onaylamak için SİL yaz',
    submit: 'Hesabımı kalıcı olarak sil',
    stay: 'Vazgeç, kalıyorum',
  },
};
