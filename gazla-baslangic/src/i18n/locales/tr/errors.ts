/**
 * İstemcinin ürettiği hata metinleri (veri katmanı `src/data`): giriş ve Supabase Auth hataları, reklam
 * ödülü, dürtme geri alma, örnek verinin (mock) kontrolleri. Sunucunun hataları `serverErrors`'ta.
 * Hata oluşturulduğu anda okunur (`getT().errors…`); `ApiError.message` o anki dildedir.
 */
export const errors = {
  /** Giriş: src/data/authRedirect.ts (Supabase Auth hata kodları), src/data/supabase/nativeAuth.ts */
  auth: {
    notCompleted: 'Giriş tamamlanmadı. Tekrar dene.',
    cancelled: 'Giriş iptal edildi',
    linkExpired: 'Bu giriş bağlantısının süresi dolmuş. Yeni bir bağlantı iste.',
    linkInvalid: 'Bu bağlantı artık geçerli değil. Giriş bağlantısını bu cihazdan yeniden iste ve aynı cihazda aç.',
    tooManyAttempts: 'Çok sık denedin. Birkaç dakika sonra tekrar dene.',
    emailInvalid: 'Geçerli bir e-posta yaz',
    emailNotAuthorized: 'Bu adrese şu an e-posta gönderilemiyor. Apple ya da Google ile devam et.',
    emailProviderDisabled: 'E-postayla giriş şu an kapalı. Apple ya da Google ile devam et.',
    providerDisabled: 'Bu giriş yolu şu an kapalı. Başka bir yolla devam et.',
    signupDisabled: 'Şu an yeni hesap açılamıyor. Biraz sonra tekrar dene.',
    userBanned: 'Bu hesap kullanıma kapatıldı.',
    emailSendFailed: 'E-posta gönderilemedi. Biraz sonra tekrar dene.',
    appleFailed: 'Apple ile giriş tamamlanamadı. Tekrar dene.',
    googleFailed: 'Google ile giriş tamamlanamadı. Tekrar dene.',
    googleInProgress: 'Giriş zaten sürüyor.',
    googlePlayServices: 'Google ile giriş için Google Play Hizmetleri gerekli.',
  },
  /** Reklamla kurtarma: SSV henüz gelmedi (istemci kısa aralıklarla yeniden sorar) */
  adRewardPending: 'Reklam ödülü henüz doğrulanmadı. Birazdan tekrar dene.',
  /** Dürtme 30 saniye içinde geri alınmadı */
  pokeUndoExpired: 'Geri alma süresi doldu',
  /** Örnek verinin (mock) istemci kontrolleri; Supabase'te karşılıkları CHECK kısıtı ve benzersizlik */
  validation: {
    usernameTaken: 'Bu kullanıcı adı alınmış',
    graceHours: 'Tolerans 0, 1 ya da 2 saat olabilir',
    invalidTime: 'Geçersiz saat',
    durationRange: 'Süre 3 ile 60 gün arasında olmalı',
  },
};
