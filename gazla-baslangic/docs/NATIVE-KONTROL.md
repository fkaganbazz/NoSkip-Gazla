# Native kontrol listesi (iOS simülatör / Android emülatör / cihaz)

Web derlemesinde, tip denetiminde ve birim testlerinde doğrulandı; aşağıdakiler yalnızca gerçek native ortamda denenebilir.
Yeni native modüller eklendiği için önce development build'i yeniden derle: `npm run ios` / `npm run android`.

## Ön koşullar
- `.env` (örnek `.env.example`): Supabase, Google istemci kimlikleri + iOS URL şeması, AdMob uygulama/birim kimlikleri
  (boşsa Google test kimlikleri), `EAS_PROJECT_ID` (`eas init`; yoksa push token adımı atlanır), web/davet alan adı.
- Supabase: Edge Function'lar dağıtıldı, Vault sırları, pg_cron/pg_net, notifications webhook (`supabase/README.md` "Kurulum").
- Google girişi: Supabase Google sağlayıcısında "Skip nonce check" açık; Android için SHA-1'li Android istemcisi.
- Evrensel link: alan adında AASA (`/.well-known/apple-app-site-association`) ve `assetlinks.json` yayımlı.

## Giriş ve onboarding (1.1–1.6)
- [ ] iOS: resmi Apple butonu açıkta siyah, koyuda beyaz, köşe 18, yükseklik 54, metin Türkçe; iptal sessiz; ilk girişte ad öneri olarak geliyor.
- [ ] Google butonu (iOS/Android) tam genişlik, koyu temada koyu; giriş → profil adımı; iptal sessiz. Android'de Apple: ortak buton + tarayıcı.
- [ ] E-postayla giriş: bağlantı e-postası geliyor; aynı telefonda dokununca uygulama açılıyor ve profil adımına (hesap varsa Bugün'e) geçiyor (uygulama açıkken ve kapalıyken). Süresi dolmuş bağlantı: neden + "Girişe dön". Android'de Apple (tarayıcı): giriş sonrası uygulamaya dönüyor, "bulunamadı" ekranı görünmüyor.
- [ ] Bildirim izni: Android 13+ izin penceresi ve Ayarlar'da üç Türkçe kanal (Genel, Diken, Arkadaşlar); iOS izin penceresi; reddedince Bugün.
- [ ] Gerçek cihazda token `push_tokens`'a yazılıyor; çıkışta siliniyor. Simülatörde token adımı atlanıyor, çökme yok.
- [ ] Rehberden bul: izin, reddedince "Ayarları aç" ve dönüşte yeniden bakma, iOS 18 "seçili kişiler", eşleşenlere Ekle/Kabul et.
- [ ] Kopyala → yapıştırınca davet linki.

## Günlük döngü (2.x)
- [ ] Completion: cihazda titreşim; Diken zıplaması ve konfeti akıcı; "Hareketi azalt" açıkken durağan.
- [ ] Fotoğraf: kamera izni (iste / yeniden iste / Ayarlar), canlı görüntü, ön/arka geçiş, Android'de yuvarlak köşeler; simülatörde galeri yedeği.
- [ ] Gönderilen fotoğraf Storage'da uzun kenar ≤ 1080 JPEG; HEIC → JPEG; uçak modunda kuyruğa girip bağlantı gelince yükleniyor.
- [ ] Story paylaşımı: paylaşım sayfası (Instagram "Hikaye"), kaydedilen görsel 1080×1920 ve keskin; VoiceOver gizli karta ulaşmıyor.
- [ ] Alt sayfalar (Dürt, Sayı gir, seçenek sayfaları): `transparentModal` + @gorhom/bottom-sheet jestleri, klavye sayfayı itiyor, Diken sayfanın üstünde.
- [ ] Çevrimdışı: uçak modunda işaretle → koyu tost; uygulamayı kapat-aç → önbellekten açılıyor; bağlantı gelince kuyruk gönderiliyor.

## Bildirimler
- [ ] Ön planda bildirim banner olarak çıkıyor; dokununca `data.url` açılıyor (açık, arka planda, kapalıyken; onboarding sırasında dokunulan bitişte açılıyor).
- [ ] Dürt/istek push'u doğru kanalda; dürtme bildirimleri kapalıyken dürtme push'u gelmiyor.
- [ ] Diken hatırlatması kullanıcının saatinde; 23:30–08:00 arası gelmiyor; günde en fazla 2.
- [ ] Ayarlar'da dürtme/hatırlatma açılınca izin isteniyor (onboarding'i atlayan hesap).

## Reklam ve izin (4.1, 5.2, 6.1, 6.2)
- [ ] Geliştirmede Google test birimleri; gerçek cihaz için `EXPO_PUBLIC_ADS_TEST_DEVICE_IDS`.
- [ ] AB testi (`EXPO_PUBLIC_ADS_DEBUG_GEOGRAPHY=EEA`, AdMob'da GDPR mesajı yayımlı): temiz kurulumda Keşfet'te banner yok → ilk gün biter → ön ekran → Devam → UMP formu → (iOS) ATT → Keşfet'te "REKLAM" etiketli test banner'ı.
- [ ] Ayarlar → Reklam tercihleri → gizlilik seçenekleri formu (AB); AB dışı → ön ekran.
- [ ] iOS ATT Türkçe metni; "İzin Verme" sonrası reklamlar yine geliyor (kişiselleştirilmemiş).
- [ ] Uçak modunda Keşfet'in altında boşluk kalmıyor (banner alanı kapanıyor).
- [ ] Seri koptu: "Reklam izle" → test videosu → ödül → "Diken sulandı!"; ödülden önce kapatınca değişiklik yok; uçak modunda 8 sn içinde "yüklenemedi" ve ücretsiz hak öne çıkıyor.
- [ ] SSV: AdMob'da rewarded birimin SSV adresi = `admob-ssv` Edge Function (Google test birimleri SSV çağrısı göndermez; gerçek birim + test cihazı gerekir).
- [ ] Bugün, işaretleme akışı ve Completion'da hiç reklam yok.

## Hesap ve bağlantılar
- [ ] Hesabı sil: Storage'da `proofs/{uid}` ve `avatars/{uid}` boşalıyor, kullanıcı siliniyor, karşılama ekranı.
- [ ] `https://<alan>/d/<kod>` uygulamayı davet ekranında açıyor (iOS + Android, autoVerify).
- [ ] Ayarlar'daki Yardım/KVKK/Gizlilik/Koşullar uygulama içi tarayıcıda; "Bize yaz" e-posta uygulaması.
