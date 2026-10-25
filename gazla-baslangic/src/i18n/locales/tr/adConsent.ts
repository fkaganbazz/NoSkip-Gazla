/** Reklam izni ön ekranı (app/ad-consent.tsx, AdConsent.dc.html) ve reklam tercihleri bilgi metinleri */
export const adConsent = {
  title: "Reklamlar Diken'i ücretsiz tutuyor",
  lead: 'Nasıl çalıştığını baştan söyleyelim:',
  /** Maddeler (ConsentPoints) */
  points: {
    noAds: 'Günlük işaretlemede asla reklam yok.',
    rescue: 'Seri kurtarma reklamını sen istediğinde izlersin.',
    personalized: 'İzin verirsen reklamlar ilgi alanına göre seçilir. Vermezsen reklam sayısı değişmez.',
  },
  note: "Sonraki ekranda telefonun izin soracak. Kararını istediğin zaman Ayarlar'dan değiştirebilirsin.",
  manage: 'Reklam tercihlerini yönet',

  /** "Reklam tercihlerini yönet" (6.2) kısa bilgi metinleri */
  privacyOptions: {
    /** UMP gizlilik seçenekleri formu bu kullanıcı için yok (AB/İngiltere dışı) ya da web */
    notRequiredWeb: 'Web sürümünde reklam gösterilmiyor.',
    notRequiredIos:
      "Bölgende ayrıca yönetilecek reklam tercihi yok. İzleme iznini iPhone Ayarlar'ından değiştirebilirsin.",
    notRequiredAndroid:
      'Bölgende ayrıca yönetilecek reklam tercihi yok. Reklam kimliğini telefonunun ayarlarından yönetebilirsin.',
    /** Form açılamadı (çoğunlukla ağ yok) */
    failed: 'Reklam tercihleri şu an açılamadı. Biraz sonra tekrar dene.',
  },
};
