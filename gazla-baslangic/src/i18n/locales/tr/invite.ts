/** Davet: karşılama (app/invite/[code].tsx), arkadaşlarını çağır (onboarding adımı + modal), rehber ve kullanıcı adı araması */
export const invite = {
  /** Davet karşılama — InviteLanding.dc.html */
  landing: {
    title: (inviter: string) => `${inviter} seni bir challenge'a çağırıyor`,
    /** Diken'in balonu */
    dikenLine: 'Kaçıran sen olma da.',
    joinAndStart: 'Katıl ve başla',
    notNow: 'Şimdilik değil',
    membersJoined: (n: number) => `${n} kişi katıldı`,
    yourTurn: 'Sıra sende',
    endedTitle: 'Bu challenge bitti',
    endedBody: "Bu davetin challenge'ı sona erdi. Yeni bir tane başlatıp arkadaşlarını sen çağır.",
    invalidTitle: 'Bu davet linki geçersiz',
    invalidBody: 'Linkin süresi dolmuş ya da yanlış kopyalanmış olabilir. Davet edenden yeni bir link iste.',
    goHome: 'Ana sayfaya dön',
    /** Kart alt bilgisi: "10 gün · İşaretle · Yarın başlıyor" */
    taskTypes: {
      check: 'İşaretle',
      number: 'Sayı gir',
      photo: 'Fotoğraf kanıtı',
    },
    started: 'Başladı',
    startsToday: 'Bugün başlıyor',
    startsTomorrow: 'Yarın başlıyor',
    startsInDays: (n: number) => `${n} gün sonra başlıyor`,
  },

  /** Arkadaşlarını çağır — InviteFriends.dc.html */
  friends: {
    title: 'Tek başına sıkıcı. Arkadaşlarını çağır.',
    body: 'Katılan her arkadaşın seni gazlar. Günü kaçırırsan da laf sokar.',
    groupSolo: 'Grupta şimdilik sadece sen',
    groupCount: (n: number) => `Grupta ${n} kişi`,
    linkLabel: 'Davet linkin',
    copyA11y: 'Davet linkini kopyala',
    copied: 'Davet linki kopyalandı',
    copyFailed: 'Link kopyalanamadı. Paylaş ile gönderebilirsin.',
    linkFailed: 'Davet linki şu an oluşturulamadı.',
    sendAsMessage: 'Mesajla gönder',
    findInContacts: 'Rehberden bul',
    searchByUsername: 'Kullanıcı adıyla ara',
    /** Paylaşım sayfasına / mesaja giden metin */
    shareMessage: (title: string, url: string) => `Gazla'da "${title}" challenge'ına katıl, birlikte gazlayalım: ${url}`,
    /** Modal: davet edilecek challenge yok */
    noChallengeTitle: 'Önce bir challenge başlat',
    noChallengeBody:
      "Arkadaşlarını bir challenge'a çağırırsın. Birini seç ya da kendin oluştur, sonra davet linkin hazır.",
    createChallenge: 'Challenge oluştur',
  },

  /** Kullanıcı adıyla ara (alt sayfa) */
  search: {
    title: 'Arkadaş ekle',
    placeholder: 'Kullanıcı adıyla ara',
    prompt: 'Arkadaşının kullanıcı adını yaz.',
    noResults: 'Bu kullanıcı adıyla kimse yok.',
  },

  /** Kişi satırları (arama ve rehber sonuçları) */
  people: {
    friendSub: (username: string) => `@${username} · Arkadaşın`,
    acceptA11y: (name: string) => `${name} isteğini kabul et`,
  },

  /** Rehberden bul (alt sayfa) */
  contacts: {
    title: 'Rehberden bul',
    privacy: 'E-posta adresleri telefonundan çıkmaz; eşleştirmek için yalnızca özetleri gönderilir.',
    limited: 'Yalnızca paylaşmayı seçtiğin kişilere baktık.',
    pickMore: 'Kişi seç',
    askBody:
      'Arkadaşlarını bulmak için rehberine bakmamız gerekiyor. İzin verirsen yalnızca e-posta adreslerinin özetlerini karşılaştırırız.',
    deniedBody: 'Rehber izni kapalı. Arkadaşlarını bulmak için Ayarlar’dan Kişiler iznini açabilirsin.',
    allow: 'İzin ver',
    noEmails: 'Rehberinde e-posta adresi olan kimse yok',
    noMatches: 'Rehberinden henüz kimse Gazla’da değil',
    emptyBody: 'Davet linkini gönder, katılınca birlikte başlarsınız.',
    shareLink: 'Davet linkini paylaş',
    readFailed: 'Rehberine şu an bakamadık. Tekrar dener misin?',
  },
};
