/**
 * Ortak bileşenler (src/components): varsayılan metinler ve ekran okuyucu etiketleri. Geri / Kapat / Vazgeç /
 * Tekrar dene ve yükleme hatası `common`'dan.
 */
export const components = {
  /** Arkadaş satırı ve Bugün şeridi (FriendRow) */
  friendRow: {
    pokeA11y: (name: string) => `${name} kişisini dürt`,
    hypeA11y: (name: string) => `${name} kişisine gaz ver`,
    acceptA11y: (name: string) => `${name} isteğini kabul et`,
    dismissRequest: 'İsteği sil',
    withdrawRequest: 'İsteği geri çek',
    add: 'Ekle',
    addA11y: (name: string) => `${name} kişisine arkadaşlık isteği gönder`,
    sent: 'Gönderildi',
    bubbleDone: (name: string) => `${name}, bugün tamam`,
    bubblePending: (name: string) => `${name}, bekliyor, dürt`,
    invite: 'Davet et',
  },

  /** Onboarding adım başlığı: "Adım 2 / 4" */
  onboardingStep: (step: number, total: number) => `Adım ${step} / ${total}`,

  /** Seri hapı */
  streakChip: {
    a11y: (days: number) => `${days} günlük seri`,
    label: (days: number) => `${days} GÜNLÜK SERİ`,
  },

  /** Su damlaları etiketi: "1/3 su" */
  dropMeter: (filled: number, total: number) => `${filled}/${total} su`,

  /** Görev kartının sağ butonu (ekran okuyucu) */
  taskCard: {
    numberDone: 'tamamlandı, değeri değiştir',
    numberTodo: 'değeri gir',
    photoDone: 'tamamlandı, fotoğraf kanıtını aç',
    photoTodo: 'fotoğrafla tamamla',
    checkDone: 'tamamlandı, geri al',
    checkTodo: 'bugünü tamamla',
  },

  /** Diken'in ruh hali (ekran okuyucu: "Diken, mutlu") */
  dikenMoods: {
    mutlu: 'mutlu',
    selam: 'el sallıyor',
    laf: 'laf sokuyor',
    cosku: 'coşkulu',
    gurur: 'gururlu',
    endise: 'endişeli',
    saskin: 'şaşkın',
    uykulu: 'uykulu',
    solgun: 'solmuş',
  },

  /** Henüz uygulanmamış ekran (PlaceholderScreen) */
  placeholder: (design: string) => `Bu ekran sıradaki adımlarda ${design} dosyasına göre uygulanacak.`,
};
