/** Onboarding: karşılama, challenge seçimi, profil, bildirim izni (app/(onboarding)/, src/features/onboarding) */
export const onboarding = {
  /** Karşılama — Main.dc.html */
  welcome: {
    title: "Seri senden, laf Diken'den.",
    lead: "Arkadaşlarınla 7, 10 ya da 30 günlük challenge'lara gir. Birbirinizi gazlayın, günü kaçıranı Diken dürtsün.",
    start: 'Başlayalım',
    haveAccount: 'Zaten hesabım var',
    /** Diken'in balonu */
    bubble: 'Ben Diken. Seni dürtmeye geldim.',
  },

  /** İlk challenge'ını seç — PickChallenge.dc.html */
  pick: {
    title: "İlk challenge'ını seç",
    body: "Sonra istediğin kadar ekleyebilirsin. Arkadaşların da aynı challenge'a katılabilir.",
    custom: 'Kendim oluşturacağım',
  },

  /** Şablon karosundaki kategori adı ("Yeme-içme · 7 gün") */
  categories: {
    detox: 'Detoks',
    social_courage: 'Sosyal cesaret',
    sport: 'Spor',
    food_drink: 'Yeme-içme',
    reading: 'Okuma',
    money: 'Para',
    quirky: 'Tuhaf',
  },

  /** Seni nasıl çağıralım? — Profile.dc.html */
  profile: {
    title: 'Seni nasıl çağıralım?',
    body: 'Arkadaşların seni kullanıcı adınla bulur.',
    nameLabel: 'Adın',
    avatar: {
      label: 'Profil fotoğrafın',
      add: 'Profil fotoğrafı ekle',
      change: 'Profil fotoğrafını değiştir',
      title: 'Profil fotoğrafı',
      note: 'İstersen sonra da ekleyebilirsin.',
    },
    username: {
      label: 'Kullanıcı adın',
      short: 'En az 3 karakter olmalı',
      available: 'Bu kullanıcı adı boşta',
      unavailable: 'Bu kullanıcı adı alınmış ya da kullanılamıyor',
    },
    birthYear: {
      label: 'Doğum yılın',
      /** Ekran okuyucu: "Doğum yılın, 1998" */
      a11yLabel: (year: number | null) => `Doğum yılın${year ? `, ${year}` : ''}`,
      a11yHint: 'Yıl listesini açar',
      placeholder: 'Seç',
      note: 'Profilinde görünmez, sadece yaş kontrolü için sorulur.',
    },
  },

  /** Seni dürtmeme izin ver — NotifPermission.dc.html */
  notifications: {
    title: 'Seni dürtmeme izin ver.',
    body: 'Söz, sadece gün bitmek üzereyken ve arkadaşların seni dürttüğünde yazarım.',
    allow: 'Bildirimlere izin ver',
    notNow: 'Şimdi değil',
    /** Örnek bildirim */
    previewTime: '21:30',
    previewBody: 'Gün bitiyor, 2 görevin duruyor. Susuz kaldım burada.',
    previewA11y: (body: string) => `Örnek bildirim: Diken, ${body}`,
  },

  /** Veri katmanı dışı (beklenmedik) hata */
  genericError: 'Bir şeyler ters gitti. Bağlantını kontrol edip tekrar dene.',
  /** Bekleyen davete katılılamadı (tost); neden veri katmanından */
  inviteJoinFailed: (reason: string) => `Davete katılamadın: ${reason}`,
};
