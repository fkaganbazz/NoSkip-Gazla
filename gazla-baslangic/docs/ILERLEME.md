# İlerleme

Durum: ⬜ yapılmadı · 🟨 kısmen · ✅ tasarımla birebir ve kabul kriterleri tamam

Her ekran bittiğinde bu tabloyu güncelle. ✅ vermeden önce ekranın ekran görüntüsünü al ve `design/png` ile yan yana karşılaştır; farkları "Not" sütununa yaz.

Son durum tespiti: 2026-10-18 (İstek 0); ortak bileşenler 2026-10-21 (İstek 1). Web (390×844, 2x, açık/koyu) ekran görüntüleri `design/png` ile karşılaştırıldı; web'e özgü farklar (status bar, formSheet'in tam sayfa açılması) sayılmadı. Route ve hook adları spesifikasyondan farklı olup işlevi aynı olanlar eksik sayılmadı, yalnızca not edildi.

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
| 1.1 | Karşılama | Main | ✅ | Görsel birebir, Diken panele oturuyor. Route `welcome.tsx` yerine `(onboarding)/index.tsx`. |
| 1.2 | İlk challenge | PickChallenge | 🟨 | Görsel birebir; varsayılan seçim 1. karo (kabul: 2. karo). "Kendim oluşturacağım" Create'e değil girişe gidiyor. |
| 1.3 | Hesap aç | SignIn | 🟨 | Düzen ve e-posta akışı var. Resmi Apple/Google bileşenleri yok (paketler kurulu değil). Yasal bağlantılar tıklanamıyor, alt çizgi yok. |
| 1.4 | Profil | Profile | 🟨 | Debounce'lu kullanıcı adı kontrolü, yıl seçici, avatar çalışıyor. Yaş reddi mesajı yaş sınırını söylüyor (spec: nötr). Ad alanı 600 ağırlık (tasarım 700). |
| 1.5 | Arkadaş davet | InviteFriends | 🟨 | Kart, link kutusu, Kopyala + toast, Mesajla/Paylaş var. "Rehberden bul" yok; onboarding'de "Kullanıcı adıyla ara" ve geri butonu yok. Link `gazla://invite/KOD` (spec env alan adlı `https://…/d/<kod>`). expo-clipboard yok. |
| 1.6 | Bildirim izni | NotifPermission | 🟨 | Görsel birebir. expo-notifications yok: izin istenmiyor, push token yazılmıyor. |
| 2.1 | Bugün (+ boş durum) | Today, EmptyToday | 🟨 | Görsel birebir; iyimser işaretleme, hero/Diken anında değişiyor, son görev → Completion, boş durum çalışıyor. Kart gövdesi tipten bağımsız hep Detay'a gidiyor (spec: foto → 2.4, sayı → 2.3). İskelet, hata durumu (hata olunca boş durum gösteriliyor), çevrimdışı toast/kuyruk yok. |
| 2.2 | Tamamlama anı | Completion | 🟨 | Görsel birebir. expo-haptics titreşimi ve Diken zıplama animasyonu (reanimated) yok. |
| 2.3 | Sayı gir | NumberEntry | 🟨 | Sayı, −/+, kısayollar, hedef hapı çalışıyor. "Grupta en iyi" yok, "Dün/En iyin" mock'ta görünmüyor. Diken sayfanın üstünde değil içinde. Native formSheet (spec @gorhom/bottom-sheet). |
| 2.4 | Fotoğraf kanıtı | PhotoProof | 🟨 | Önizleme hali tasarıma uyuyor. expo-camera yerine image-picker (canlı kamera yok); 1080 px / %80 sıkıştırma yok. "Kimler görecek" satırında › yok. |
| 2.5 | Challenge detayı | Detail | 🟨 | Açık ve koyu (DetailDark) birebir; takvim, grup, Dürt, alt buton doğru. "…" menüsünde "Hatırlatma saatini değiştir" yok. |
| 2.6 | Challenge bitti | Finished | 🟨 | Görsel birebir. Bittiği gün Bugün açılışında otomatik gösterilmiyor; bitmemiş challenge'da da "bitirdin" diye açılabiliyor. |
| 2.7 | Story kartı | ShareCard | 🟨 | Kart içeriği birebir. view-shot ile 1080×1920 PNG ve expo-sharing / Instagram Stories yok; yalnızca metin paylaşılıyor. |
| 3.1 | Arkadaşlar | Friends | 🟨 | Görünüm ve akış çok yakın; arama, kabul/sil, bölümler çalışıyor. İstekte "N ortak" yok (veri yok). Boş durumda davet kartı büyümüyor. |
| 3.2 | Dürt | Poke | 🟨 | Kişi satırı, Segmented, 2×3 karo, geri al tostu doğru. Üstteki Diken + balon yok. Sert mod kapalıysa "Laf sok" pasif değil gizli; günlük 3 sınırında buton önceden pasif olmuyor. Mesajlar `src/content/pokes.ts` yerine API'den. |
| 3.3 | Aktivite | Activity | 🟨 | Görünüm çok yakın, Tümü okundu / Karşılık ver / Kabul et çalışıyor. Sayfalama (30'ar) yok; "Tebrik et" doğrudan göndermiyor; bir başlık satır kırıyor. |
| 3.4 | Arkadaş profili + işlemler | FriendProfile | ✅ | Profil ve işlem sayfası açık/koyu birebir; dürt, çıkar, engelle (onaylı), şikayet çalışıyor. Route `user/[id]` yerine `friend/[id]`. Koyuda kırmızı "Engelle/Şikayet et" düşük kontrastlı (bkz. 7). |
| 3.5 | Şikayet | Report | ✅ | Birebir; tek seçim, 500 karakter, "…'i de engelle" varsayılan işaretli, teşekkür durumu. Route `report/[userId]` yerine `report?targetType=&targetId=`. |
| 3.6 | Davet linki | InviteLanding | 🟨 | Görsel yakın, geçersiz kod durumu var. Oturumsuzken kod saklanmıyor, girişten sonra katılım tamamlanmıyor; katılınca Bugün yerine detaya gidiyor. Diken/balon satırı ortalı (tasarımda sola dayalı). |
| 4.1 | Keşfet | Explore | 🟨 | Görünüm birebir, arama/çipler/boş sonuç çalışıyor. Banner yalnızca yer tutucu (AdMob yok, "yüklenmezse kapanır" yok). |
| 4.2 | Challenge önizleme | ChallengePreview | 🟨 | Görünüm birebir; "Tek başıma başla" çalışıyor. "Arkadaşlarla" oluştur + davet yerine Create'i açıyor. Route `template/[id]`. |
| 4.3 | Challenge oluştur | Create | 🟨 | Form çalışıyor (özel süre, sayı ayarları, hatırlatma, arkadaş seçimi). Görünürlük seçimi (Davetliler/Arkadaşlarım) yok; tasarım dışı şablon çipleri ve Başlangıç satırı var; ad 3 karakter alt sınırı denetlenmiyor. |
| 5.1 | Bahçem | Garden | 🟨 | Başlık, istatistik, raflar birebir. Rozetler bölümü yok (useBadges ve backend yok). |
| 5.2 | Ayarlar | Settings | 🟨 | Görünüm yakın, toggle'lar ve alt sayfalar çalışıyor. Gün bitişi 0/1/2 seçilemiyor; destek/yasal bağlantılar ve mailto yok; tasarım dışı "Dil" satırı; Reklam tercihleri UMP yerine ön ekranı açıyor. |
| 5.3 | Hesabı sil | DeleteAccount | 🟨 | Görünüm birebir, silince karşılamaya dönüyor (mock). Onay büyük/küçük harfe duyarsız ("sil", "SIL" de kabul; spec tam "SİL"). `supabase/functions/delete-account` yok. |
| 6.1 | Seri koptu | StreakLost | 🟨 | Kayıp ve kurtarıldı halleri birebir; Bugün açılışında otomatik açılıyor, ücretsiz hak çalışıyor. AdMob rewarded, 8 sn zaman aşımı ve SSV yok; "Baştan başla" yalnızca kapatıyor. |
| 6.2 | Reklam izni | AdConsent | 🟨 | Görsel çok yakın (başlık kırılımı farklı). İlk gün sonrası otomatik gösterilmiyor; Devam ile UMP/ATT yok; "Yönet" UMP yerine Ayarlar'a gidiyor. |
| 7 | Koyu mod (tüm ekranlar) | TodayDark, DetailDark | 🟨 | TodayDark ve DetailDark birebir; tüm route'lar koyuda açılıyor. Koyuda kırmızı (#B42318) metin koyu yüzeyde zor okunuyor (Ayarlar "Hesabı sil", işlem sayfası "Engelle/Şikayet et", ~2.3:1). Seçili Segmented hapı zayıf ayrılıyor. |
