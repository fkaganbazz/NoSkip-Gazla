/** İşaretleme ekranları: sayı gir (app/checkin/number.tsx), fotoğraf kanıtı (app/checkin/photo.tsx), src/features/checkin */
export const checkin = {
  /** Erişilebilirlik etiketinde birimin açık adı ("sn" → "saniye"); listede olmayan birim olduğu gibi okunur */
  unitNames: { sn: 'saniye', dk: 'dakika', sa: 'saat' } as Record<string, string>,
  /** Görev bugün listede yok (süresi geçti, challenge bitti) */
  notMarkable: 'Bu görev bugün işaretlenemiyor.',
  undoDay: 'Bugünü geri al',

  /** Sayı gir (NumberEntry.dc.html) */
  number: {
    sheetLabel: 'Sayı gir',
    sheetLabelFor: (title: string) => `${title}: sayı gir`,
    /** Diken'in balonu (hedefli görev) */
    dikenBubble: (target: string) => `${target} yeter, abartma. Ama abartırsan saygı duyarım.`,
    /** Başlık altı: "3. gün · Bugünkü hedef 70 sn" */
    todayTarget: (target: string, unit: string) => `Bugünkü hedef ${target} ${unit}`,
    decrease: (amount: string, unit: string) => `${amount} ${unit} azalt`,
    increase: (amount: string, unit: string) => `${amount} ${unit} artır`,
    add: (amount: string, unit: string) => `${amount} ${unit} ekle`,
    /** Hedef hapı */
    target: {
      over: (diff: string, unit: string) => `Hedefi ${diff} ${unit} geçtin`,
      exact: 'Tam hedefinde',
      under: (diff: string, unit: string) => `Hedefe ${diff} ${unit} kaldı`,
    },
    /** Alttaki üç kutu */
    stats: {
      yesterday: 'Dün',
      best: 'En iyin',
      groupBest: 'Grupta en iyi',
      /** Değeri olmayan kutunun erişilebilirlik metni ("Dün: yok") */
      none: 'yok',
    },
    undoHint: 'Bugünkü kayıt silinir, görev yapılmadı olur',
  },

  /** Fotoğraf kanıtı (PhotoProof.dc.html) */
  photo: {
    photoProof: 'Fotoğraf kanıtı',
    galleryFailed: 'Galeri açılamadı. Tekrar dene.',
    cameraFailed: 'Kamera açılamadı. Galeriden seçebilirsin.',
    captureFailed: 'Fotoğraf çekilemedi. Tekrar dene.',
    /** Sol buton */
    retake: 'Tekrar çek',
    pickAnother: 'Başka seç',
    pickFromGallery: 'Galeriden seç',
    pickPhoto: 'Fotoğraf seç',
    takenPhoto: 'Çektiğin fotoğraf',
    pickedPhoto: 'Seçtiğin fotoğraf',
    /** Çekilen fotoğrafın üstündeki zaman damgası: "Bugün · 22:31" */
    stamp: (time: string) => `Bugün · ${time}`,
    sentPhoto: (action: string) => `Bugün gönderdiğin fotoğraf. ${action}`,
    takeNew: 'Yenisini çek',
    pickNew: 'Yenisini seç',
    noteLabel: 'Not ekle (isteğe bağlı)',
    /** "Kimler görecek: Grup (2 kişi)" satırı */
    audience: 'Kimler görecek: ',
    audienceGroup: (n: number) => `Grup (${n} kişi)`,
    audienceLabel: (n: number) => `Kimler görecek: Grup, ${n} kişi`,
    audienceHint: 'Grubun üyelerini gösterir',
    sending: 'Gönderiliyor',
    undoHint: 'Bugünkü fotoğraf kanıtı silinir, görev yapılmadı olur',
    /** Kamera izni çerçevesi */
    permission: {
      preparing: 'Kamera hazırlanıyor',
      takePhoto: 'Fotoğraf çek',
      needed: 'Fotoğraf çekmek için kamera izni gerekiyor. Galeriden de seçebilirsin.',
      blocked: 'Kamera izni kapalı. Ayarlar’dan açabilir ya da galeriden seçebilirsin.',
      blockedWeb: 'Kamera izni kapalı. Tarayıcı ayarlarından açabilir ya da galeriden seçebilirsin.',
      allow: 'İzin ver',
    },
    /** Canlı kamera (CameraPane) */
    camera: {
      preview: 'Kamera görüntüsü',
      flip: 'Kamerayı çevir',
      toFront: 'Ön kameraya geç',
      toBack: 'Arka kameraya geç',
      shutter: 'Fotoğraf çek',
    },
    /** "Kimler görecek" alt sayfası (GroupSheet) */
    group: {
      title: 'Kimler görecek',
      lead: "Fotoğrafını ve notunu bu challenge'daki herkes görür.",
      you: (username: string) => `Sen · @${username}`,
    },
  },
};
