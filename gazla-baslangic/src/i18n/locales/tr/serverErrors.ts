/**
 * Sunucu hataları: anahtar SQL'deki `raise exception '…' using errcode = '…', hint = '<anahtar>'` ifadesinin
 * `hint`'i (PostgREST `error.hint`; Edge Function'larda gövdedeki `hint`). Türkçe metinler SQL mesajıyla
 * birebir aynı; biçimli mesajlarda (`%`) değer sabit (en çok 20 challenge) ya da yok (saat dilimi).
 * Yeni bir `raise` eklerken anahtarını buraya ve İngilizce sözlüğe de yaz (supabase/README.md "Dil").
 * Anahtarı bilinmeyen hata: Türkçede sunucunun mesajı, İngilizcede `common.somethingWentWrong`.
 */
export const serverErrors = {
  // Profil ve oturum
  not_signed_in: 'Oturum açman gerekiyor',
  profile_required: 'Önce profilini tamamla',
  account_unavailable: 'Şu an hesabını oluşturamıyoruz.',
  username_reserved: 'Bu kullanıcı adı kullanılamaz',
  display_name_reserved: 'Bu görünen ad kullanılamaz',
  invalid_timezone: 'Geçersiz saat dilimi',

  // Arkadaşlık ve şikayet
  user_not_found: 'Kullanıcı bulunamadı',
  friend_request_self: 'Kendine istek gönderemezsin',
  friend_request_limit: 'Bu kişiye bugün yeterince istek gönderdin',
  friend_request_not_found: 'İstek bulunamadı',
  report_self: 'Kendini şikayet edemezsin',
  report_limit: 'Bugün çok fazla şikayet gönderdin',
  photo_not_found: 'Fotoğraf bulunamadı',
  contacts_limit: 'Rehberden en fazla 500 kişi aranabilir',
  contacts_daily_limit: 'Rehberden bulmayı bugün çok denedin. Yarın tekrar dene.',

  // Dürtme
  poke_self: 'Kendini dürtemezsin',
  poke_not_allowed: 'Bu kişiyi dürtemezsin',
  roast_not_allowed: 'Sert modu kapalı; sadece gaz verebilirsin',
  poke_message_invalid: 'Geçersiz mesaj',
  poke_limit: 'Bugün bu kişiyi yeterince dürttün',

  // Challenge, davet, katılma
  challenge_not_found: 'Challenge bulunamadı',
  template_not_found: 'Şablon bulunamadı',
  challenge_finished: 'Bu challenge bitti',
  max_active_challenges: 'Aynı anda en fazla 20 challenge sürdürebilirsin',
  start_date_out_of_range: 'Başlangıç günü bugün ile 7 gün sonrası arasında olmalı',
  duration_not_allowed: 'Bu challenge için bu süre seçilemez',
  challenge_fields_required: 'Ad, süre ve tamamlama şekli gerekli',
  not_a_member: "Bu challenge'da değilsin",
  invite_not_allowed: "Bu challenge'a davet edemezsin",
  invite_friends_only: 'Yalnızca arkadaşlarını davet edebilirsin',
  invite_not_found: 'Davet bulunamadı',
  invite_link_failed: 'Davet linki oluşturulamadı, tekrar dene',
  invite_link_not_found: 'Davet linki bulunamadı',
  invite_link_invalid: 'Davet linki geçersiz',
  rejoin_not_allowed: "Ayrıldığın challenge'a tekrar katılamazsın",
  group_full: 'Grup dolu',

  // İşaretleme
  day_closed: 'Bu gün artık işaretlenemez',
  day_out_of_range: 'Challenge bu gün sürmüyor',
  past_day_locked: 'Geçmiş günler değiştirilemez',
  task_check_only: 'Bu görev tek dokunuşla işaretlenir',
  task_number_only: 'Bu görev sayı ile işaretlenir',
  task_photo_only: 'Bu görev fotoğrafla işaretlenir',
  not_number_task: 'Bu görev sayı ile işaretlenmiyor',
  invalid_value: 'Geçersiz değer',
  photo_required: 'Fotoğraf kanıtı gerekli',
  photo_used: 'Bu fotoğraf başka bir gün için gönderildi',

  // Seri kurtarma
  rescue_unavailable: 'Bu gün için kurtarma yapılamaz',
  free_rescue_used: 'Bu ayın ücretsiz kurtarma hakkı kullanıldı',
  no_pending_rescue: 'Bekleyen bir kurtarma yok',
  invalid_reward_id: 'Geçersiz ödül kimliği',
  reward_used: 'Bu ödül zaten kullanıldı',

  // Hesap silme (Edge Function delete-account)
  session_invalid: 'Oturumun geçersiz. Yeniden giriş yapıp tekrar dene.',
  delete_account_unavailable: 'Hesap şu an silinemiyor. Biraz sonra tekrar dene.',
  delete_account_files_failed: 'Fotoğrafların silinemedi. Biraz sonra tekrar dene.',
  delete_account_failed: 'Hesap silinemedi. Biraz sonra tekrar dene.',
  request_not_supported: 'Bu istek desteklenmiyor.',
};
