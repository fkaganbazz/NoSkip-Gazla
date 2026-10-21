# İlerleme

Durum: ⬜ yapılmadı · 🟨 kısmen · ✅ tasarımla birebir ve kabul kriterleri tamam

Her ekran bittiğinde bu tabloyu güncelle. ✅ vermeden önce ekranın ekran görüntüsünü al ve `design/png` ile yan yana karşılaştır; farkları "Not" sütununa yaz.

Son durum tespiti: 2026-10-18 (İstek 0); ortak bileşenler 2026-10-21 (İstek 1); ekran davranış ve kabul eksikleri 2026-10-21 (Madde 2). Statik web derlemesiyle (açık/koyu) doğrulandı; paketler ve sunucu (Madde 3) 2026-10-21. Native davranışlar tip denetimi ve birim testleriyle doğrulandı; simülatör/cihazda denenecekler `docs/NATIVE-KONTROL.md`. Web (390×844, 2x, açık/koyu) ekran görüntüleri `design/png` ile karşılaştırıldı; web'e özgü farklar (status bar, formSheet'in tam sayfa açılması) sayılmadı. Route'lar EKRANLAR.md başlıklarındaki yollara taşındı (Madde 4, 2026-10-21; web'de tüm yollar ve uygulama içi gezinme tıklanarak doğrulandı). Hook adları spesifikasyondan farklı olup işlevi aynı olanlar eksik sayılmadı, yalnızca not edildi.

## Ortak bileşenler
| Bileşen | Durum | Not |
|---|---|---|
| Tema (renk, yazı, boşluk, köşe, açık/koyu) | ✅ | Tokens ile birebir (`src/theme`); ekranlarda sabit renk yok. Koyu modda okunur hata metni için `colors.dangerText` (#F97066, koyu yüzeyde 6.1:1); kendi profil avatarı `selfAvatarTints`. |
| Diken (9 ifade, 4 aşama, 2 aksesuar) | ✅ | `src/components/Diken.tsx`; `/dev/diken` 9 ifade × 4 aşama × aksesuar matrisi. |
| TabBar | ✅ | `src/components/TabBar.tsx`; 56×30 aktif hap, + → Create; açık/koyu birebir. |
| Button (5 varyant, dolu gölge) | ✅ | `ui/Button.tsx`: primary, secondary, orange, danger, text (+ ink, onGreen, onDark, apple, google); lg/lgCompact/md/mdCompact/sm; 4 px dolu gölge, basılınca 2 px iner ve gölge 2 px; Android'de alt katman. Ekranlardaki kopyalar kaldırıldı. |
| IconButton, OnboardingHeader | ✅ | IconButton: geri/kapat/seçenekler ya da ikon, etiket zorunlu, tonlar, boy + hitSlop. `OnboardingHeader` ortak (yarım segment, izin tonu). |
| Chip, Segmented, Toggle, Radio, Checkbox | ✅ | `ui/controls.tsx`; Chip boy/ton/tint/ikon, Segmented md/lg + koyu kontrast + web aria; ekran kopyaları kaldırıldı. |
| TaskCard, FriendRow, Avatar | ✅ | `TaskCard`, `FriendRow`/`FriendList`/`FriendBubble`, `Avatar` (halka yaptı/bekliyor/davet, rozet, self) + `AvatarStack`/`AddAvatar`; tüm ekranlar bunları kullanıyor. |
| StreakChip, DropMeter, ProgressBar | ✅ | Ayrı ortak bileşenler; Bugün hero kartı ve görev kartı bunları kullanıyor. |
| Sheet, SpeechBubble, SectionLabel, Toast, CategoryTile | ✅ | `Sheet` (@gorhom/bottom-sheet, köşe 28, 44×5 tutamaç, karartma .55, sayfa üstü Diken slotu), `ActionSheet`, `SpeechBubble` (kuyruk yönleri), `SectionLabel` (.6, tonlar), `Toast` + `useToast` (ikonlu), `CategoryTile` (kategori → renk). Ayrıca `SearchField`, `CountBadge`. Hepsi `/dev/components`'te. Web'de doğrulandı; native simülatörde henüz açılmadı. |

## Ekranlar
| # | Ekran | Dosya | Durum | Not |
|---|---|---|---|---|
| 1.1 | Karşılama | Main | ✅ | Görsel birebir, Diken panele oturuyor. Route `(onboarding)/welcome.tsx` (grubun ilk ekranı; oturum yokken `/` ve çıkış buraya düşer). |
| 1.2 | İlk challenge | PickChallenge | ✅ | Görsel birebir, varsayılan 2. karo; "Kendim oluşturacağım": giriş → profil → Create → davet → bildirim. |
| 1.3 | Hesap aç | SignIn | ✅ | Resmi Apple (iOS, AppleAuthenticationButton) ve Google (native GoogleSigninButton) butonları, Supabase signInWithIdToken; Android/web'de ortak butonlar + OAuth; iptal sessiz, hata tostu; yasal bağlantılar. |
| 1.4 | Profil | Profile | ✅ | Kullanıcı adı kontrolü (400 ms), yıl seçici, avatar; yaş reddinde nötr mesaj; ad 700; bekleyen davet varsa profilden sonra katılıp bildirim iznine geçiyor. |
| 1.5 | Arkadaş davet | InviteFriends | ✅ | Kopyala expo-clipboard; Rehberden bul (izin, yalnızca e-posta özeti, find_contacts, Ekle/Kabul et, boş durum + paylaş, red → Ayarlar, iOS 18 seçili kişiler; web'de gizli); Kullanıcı adıyla ara; link https://<alan>/d/<kod>. |
| 1.6 | Bildirim izni | NotifPermission | ✅ | Görsel birebir; izin + Expo push token + register_push_token, Android kanalları (Genel/Diken/Arkadaşlar); bildirime dokununca ilgili ekran (useNotificationsBootstrap). EAS projectId gerekli (`eas init`). |
| 2.1 | Bugün (+ boş durum) | Today, EmptyToday | ✅ | Görsel birebir; kart gövdesi tipe göre (Detay / 2.4 / 2.3); sağ buton: işaretle tipi iyimser işaretle/geri al, fotoğraf/sayı kendi ekranını açar; iskelet, hata + Tekrar dene, çevrimdışı koyu tost (kuyruk MMKV, soğuk açılış önbellekten); Tamamlama → Seri koptu → Challenge bitti anları sırayla ve bir kez. |
| 2.2 | Tamamlama anı | Completion | ✅ | Görsel birebir; açılışta expo-haptics başarı titreşimi; Diken giriş + iki küçük zıplama, konfeti süzülerek (reanimated; hareketi azalt'ta durağan); ilk tamamlanan günden sonra bir kez reklam izni ön ekranı. |
| 2.3 | Sayı gir | NumberEntry | ✅ | Ortak Sheet; Diken + balon sayfanın üstünde; Dün/En iyin/Grupta en iyi useNumberStats'tan; Kaydet → kapanır, hepsi bittiyse 2.2. Route `checkin/number?challengeId=&date=`. |
| 2.4 | Fotoğraf kanıtı | PhotoProof | ✅ | Önce canlı kamera (expo-camera; deklanşör, ön/arka); izin iste / yeniden iste / Ayarlar, galeri yedeği; önizleme birebir; Gönder 1080 px JPEG %80 küçültme + checkin (çevrimdışı kuyruk); "Kimler görecek ›" grup sayfası. Route `checkin/photo?challengeId=&date=`. |
| 2.5 | Challenge detayı | Detail | ✅ | Açık/koyu (DetailDark) birebir; "…" menüsü spec sırasında (ayrıl, hatırlatma saati, davet, şikayet); hatırlatma saati 30 dk adımlarla ya da grubun saatine dönüş (setMyReminder), çip etkin saati gösteriyor; gün/durum sunucudan (dayIndex/status); bitmiş challenge'da "Dürt" yok. |
| 2.6 | Challenge bitti | Finished | ✅ | Görsel birebir; bittiği gün Bugün açılışında bir kez otomatik açılır (sunucuda finish_seen_at), açılınca görüldü işaretlenir; bitmemiş challenge'da detaya yönlendirir; Bahçem'den bitmiş challenge'lar açılır. ("Story'de paylaş" görüntü paylaşımı 2.7 / Madde 3.) |
| 2.7 | Story kartı | ShareCard | ✅ | Ekran değil: kart Finished'ın arkasında çizili, view-shot ile 1080×1920 PNG → expo-sharing (Instagram dahil); web'de PNG indir/paylaş; önizleme /dev/share-card. |
| 3.1 | Arkadaşlar | Friends | ✅ | Görsel birebir; istek/aramada "N ortak", kısa challenge adı, boş durumda büyüyen davet kartı ("Henüz arkadaşın yok"), Paylaş → sistem paylaşımı. |
| 3.2 | Dürt | Poke | ✅ | Açık/koyu birebir; Diken + balon sayfanın üstünde (ortak Sheet); Laf sok sert mod kapalıysa pasif + açıklama; günde 3 sınırında buton pasif; mesajlar `src/content/pokes.ts`. |
| 3.3 | Aktivite | Activity | ✅ | Açık/koyu birebir; 30'arlık sayfalama + gösterge; Tebrik et hazır gaz mesajını doğrudan gönderiyor; Karşılık ver, Kabul et/Sil, Tümü okundu; başlık tek satır. |
| 3.4 | Arkadaş profili + işlemler | FriendProfile | ✅ | Profil ve işlem sayfası açık/koyu birebir; dürt, çıkar, engelle (onaylı), şikayet; "Arkadaşlarım" görünürlüklü challenge'lara Katıl. Route `user/[id]`. |
| 3.5 | Şikayet | Report | ✅ | Birebir; tek seçim, 500 karakter, "…'i de engelle" varsayılan, 24 saat notu, teşekkür durumu. Route `report/[userId]`; içerik sorguda: `?target=photo&contentId=<check-in>`, `?target=challenge&challengeId=<id>` (kişi = kurucu; kendi challenge'ında satır yok). Davet koduyla (kişisiz) şikayet için route yok: InviteLanding'de giriş noktası yok, veri katmanı (`inviteCode`) hazır. |
| 3.6 | Davet linki | InviteLanding | ✅ | Katıl ve başla: oturumsuz kod saklanır → giriş → profil sonrası katılım; oturumlu katıl → Bugün; geçersiz kod durumu; `/d/<kod>` → davet ekranı. Kalan (Madde 3): native universal link ayarı. |
| 4.1 | Keşfet | Explore | ✅ | Görünüm birebir; Popüler popülerlik sırasıyla; AdMob banner 320×50 + REKLAM etiketi, yalnızca reklam izni tamamsa, yüklenene kadar yer kaplamaz, yüklenemezse alan kapanır; web'de yok. Cihazda deneme kontrol listesi: `docs/NATIVE-KONTROL.md`. |
| 4.2 | Challenge önizleme | ChallengePreview | ✅ | Görünüm birebir; Arkadaşlarla → oluştur + davet modalı (kapatınca detay); Tek başıma → Bugün; hata/çevrimdışı mesajı. Route `challenge/preview/[templateId]`. |
| 4.3 | Challenge oluştur | Create | ✅ | Create.png ile birebir; görünürlük (Davetliler/Arkadaşlarım), başlangıç Bugün/Yarın, ad 3–60 hata + pasif buton; form ortak CreateScreen (onboarding de kullanıyor). |
| 5.1 | Bahçem | Garden | ✅ | Başlık, istatistik, raflar birebir (aşama sunucudan, bandana/gözlük veriden); Rozetler n/12 (kazanılan renkli, kilitli gri + kilit). trophy/moon ikonları tasarımda yok (çizildi, onay gerekli). |
| 5.2 | Ayarlar | Settings | ✅ | Görünüm birebir (açık/koyu, 390×1420); gün bitişi 0/1/2; iyimser anahtarlar; destek/yasal bağlantılar; Reklam tercihleri UMP gizlilik seçenekleri formunu açar (gerekmiyorsa ön ekran). |
| 5.3 | Hesabı sil | DeleteAccount | ✅ | Görünüm birebir ("SİL" alanı 16/800, aralık 1); onay yalnızca tam "SİL"; `delete-account` Edge Function (Storage proofs/avatars + auth kullanıcısı), bitince oturum kapanır ve karşılamaya döner. |
| 6.1 | Seri koptu | StreakLost | ✅ | Kayıp/kurtarıldı birebir; AdMob rewarded (SSV userId + customData, Edge Function admob-ssv), 8 sn zaman aşımı → ücretsiz hak öne çıkar; yalnızca EARNED_REWARD'da kurtarma; Baştan başla decline_rescue. Route `streak-lost/[challengeId]`: Bugün ilk bekleyenle açar, Devam/Baştan başla sonrası sıradaki bekleyene `replace` (yoksa kapanır); Diken bildirimi `/streak-lost/<id>` (eski `/streak-lost` Bugün'e eşlenir). |
| 6.2 | Reklam izni | AdConsent | ✅ | Görsel birebir; ilk gün bitince bir kez; Devam → UMP formu (gerekirse) → iOS ATT → SDK başlar; Yönet → UMP gizlilik seçenekleri. |
| 7 | Koyu mod (tüm ekranlar) | TodayDark, DetailDark | ✅ | TodayDark ve DetailDark birebir; tüm ekranlar koyuda kontrol edildi. Kırmızı metin `colors.dangerText` (#F97066, koyu yüzeyde 6.1:1), seçili segment koyuda net; her zaman koyu ekranlar (PhotoProof) ve alt sayfaları `scheme="dark"`. |
