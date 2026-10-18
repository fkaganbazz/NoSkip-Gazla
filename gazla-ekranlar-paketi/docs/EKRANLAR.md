# Ekran spesifikasyonu (v1.0)

Her ekran için üç kaynak var ve üçü birlikte kullanılır:
1. **Görsel:** `design/png/<Ekran>.png` (2x). Görünüşün tek doğru kaynağı budur. Önce buna bak.
2. **Ölçüler:** `design/<Ekran>.dc.html`. Renk, boşluk, köşe ve yazı boyutlarını buradaki inline style'lardan al (px değerleri RN'de aynı sayı).
3. **Davranış:** bu dosya. Route, durumlar, etkileşimler, veri hook'u ve kabul kriterleri.

Telefon çerçevesi 390×844. Üstte 56 px, altta güvenli alan; status bar çizme, `SafeAreaView` kullan.

---

## 0. Ortak bileşenler (`src/components/`)

Ekranlara başlamadan önce bunların hepsi var olmalı. Hiçbir ekran bunların yerine kendi kopyasını yazmaz.

| Bileşen | Kaynak | Notlar |
|---|---|---|
| `Diken` | Diken.dc.html, Moods.png | Props: `mood` (mutlu, selam, laf, cosku, gurur, endise, saskin, uykulu, solgun), `stage` (filiz, genc, tam, cicek), `gear` (yok, bant, gozluk), `size` (genişlik; yükseklik = size×1.25). react-native-svg, viewBox 240×300. HTML'deki `display="{{v.x}}"` grupları koşullu render olur. Poz ifadeyle gelir: mutlu→relaxed, selam→wave, laf→cross (kollar kavuşuk, gövdenin ÖNÜNDE çizilir), cosku/gurur/saskin→up, endise/uykulu→droop. `solgun` her aşamada eğik zeytin gövde + çatlak saksı. `genc`'te kısa kol tomurcukları, `filiz`'de kol yok. Yüz kayması: genc translate(0,34); filiz translate(120,204) scale(.62) translate(-120,-122); solgun translate(126,126) rotate(12) translate(-120,-122). |
| `TabBar` | TabBar.dc.html | 5 öğe: Bugün, Keşfet, ortada yükseltilmiş + (Create'e gider), Arkadaşlar, Bahçem. Aktif öğe: ikon arkasında 56×30 yeşil hap. Açık/koyu. Expo Router `tabBar` prop'u ile özel bileşen olarak. |
| `Button` | Components.png | variant: primary (#1F7A45, beyaz metin, gölge #165C34), secondary (beyaz, 2px #E3D8CC kenar, gölge #E3D8CC), orange (#FF5A1F, metin #24163F, gölge #C2410C), danger (#B42318, gölge #7A1810), text. Yükseklik 56, köşe 18, **altta 4px dolu gölge** (blur değil: `shadowOffset {0,4}`, `shadowRadius 0`, Android'de alt katman view). Basılınca 2px aşağı kayar, gölge 2px olur. |
| `IconButton` | — | 44×44 daire, beyaz zemin, 1px #EFE6DC kenar. Geri, kapat, seçenekler. `accessibilityLabel` zorunlu. |
| `OnboardingHeader` | PickChallenge.png | Geri butonu + 4 segmentli ilerleme çubuğu (8px, köşe 4, dolu #1F7A45, boş #E3D8CC) + "n/4". |
| `Chip`, `Segmented`, `Toggle`, `Radio`, `Checkbox` | Components.png | Segmented: #EFE6DC kap, seçili beyaz hap. Toggle 52×32. Radio seçili = 7px yeşil kenar. |
| `TaskCard` | Today.png | 72 yükseklik, köşe 22. Sol 44px kategori karosu, başlık 15/800 (tek satır, kesilir), meta 13/700, 6px ilerleme çubuğu. Sağda 52px aksiyon: yapıldı (dolu yeşil + beyaz tik), işaretle (3px yeşil kenar, soluk tik), fotoğraf (kamera ikonu), sayı (+ ikonu). |
| `FriendRow`, `Avatar` | Friends.png | Avatar halkası: yaptı = düz #3BAE6A, bekliyor = kesikli #FF7A3D. Fotoğraf yoksa baş harf + kategori renginde zemin. |
| `StreakChip`, `DropMeter`, `ProgressBar` | Today.png | Seri hapı gece moru zemin + filiz ikonu. Damla: dolu #1F7A45, boş beyaz/yeşil kenar. |
| `Sheet` | Poke.png, NumberEntry.png | Alt sayfa: köşe 28, 44×5 tutamaç, arka plan rgba(36,22,63,.55). @gorhom/bottom-sheet. |
| `SpeechBubble` | Main.png, NotifPermission.png | Beyaz balon, 18 köşe, alt gölge, yönlü kuyruk. |
| `SectionLabel` | Friends.png | 13/800, harf aralığı .6, büyük harf, #5B4A7A (veya duruma göre yeşil/turuncu). |
| `Toast` | Components.png | Koyu (çevrimdışı) ve yeşil (başarılı + "Geri al"). |
| `CategoryTile` | PickChallenge.png | Kategori → zemin/ikon rengi: detoks #EDE7F6/#4B3A78, sosyal #FFE3D2/#9A3412, spor #DDF3E4/#1F6B40, yeme #FFF1C7/#8A5A00, okuma #FFE3EC/#A3275A, para #D9F2EF/#0F6B63, tuhaf #E0EEFF/#1E4F9A. |

İkonlar: dc.html dosyalarındaki inline SVG path'leri birebir kopyala (24×24, stroke 2–2.6, yuvarlak uç). Kütüphaneden benzerini koyma.

---

## 1. İlk açılış

### 1.1 Karşılama — `app/(onboarding)/welcome.tsx` · Main
- Tam ekran #1F7A45 zemin, iki iç içe daire (#23874D, #2A9156), dağınık sarı yıldızlar.
- Üstte logo satırı (filiz ikonu + "Gazla", Baloo 32 krem). Sol üstte konuşma balonu "Ben Diken. Seni dürtmeye geldim."
- Ortada `Diken mood=selam size=250`. Alt panel krem, üst köşeler 32: başlık, açıklama, "Başlayalım" (→1.2), "Zaten hesabım var" (→1.3).
- Kabul: Diken panelin üst kenarına oturur, saksının altı panelle hafif örtüşür.

### 1.2 İlk challenge — `pick-challenge.tsx` · PickChallenge
- OnboardingHeader 1/4. 2 sütun × 3 satır karo (134 yükseklik). Seçili karo: yeşil kenar + 2px dış halka + sağ üstte yeşil tikli rozet.
- Veri: `useChallengeTemplates({ featured: true })` (6 adet).
- "Devam" seçimi saklar (yerel durum) → 1.3. "Kendim oluşturacağım" → Create.
- Kabul: tek seçim, varsayılan 2. karo.

### 1.3 Hesap aç — `sign-in.tsx` · SignIn
- OnboardingHeader 2/4 (2. segment yarım). `Diken mood=mutlu size=184`, altında seçilen challenge hapı.
- Butonlar: Apple (siyah), Google (beyaz kenarlı), "E-posta ile devam et" (metin). **Apple ve Google için resmi bileşenler** (`expo-apple-authentication`, Google Sign-In). Tasarımdaki logosuz çizim yer tutucudur.
- Alt yazı: Kullanım Koşulları, Gizlilik Politikası, KVKK Aydınlatma Metni bağlantıları (WebBrowser ile açılır).
- Başarılı giriş → 1.4 (profil yoksa) veya Bugün.

### 1.4 Profil — `profile.tsx` · Profile
- OnboardingHeader 2/4 (dolu). Avatar 84 + kamera rozeti (expo-image-picker, Storage `avatars/`).
- Alanlar: Adın, Kullanıcı adın (@ öneki; yazarken 400 ms debounce ile benzersizlik kontrolü; "Bu kullanıcı adı boşta" yeşil veya "alınmış" kırmızı), Doğum yılı (yıl seçici). Doğum yılı yaş sınırını ekranda **söylemez**; 13 altıysa sunucu kaydı reddeder ve nötr bir mesaj gösterilir.
- Veri: `useProfile().create()`. Kullanıcı adı: küçük harf, a-z0-9._, 3–20 karakter.

### 1.5 Arkadaş davet — `invite.tsx` · InviteFriends
- OnboardingHeader 3/4. Challenge kartı, davet linki kutusu (kesikli kenar, "Kopyala" → expo-clipboard + toast), "Mesajla gönder" ve "Paylaş" (Share API), "Rehberden bul", "Kullanıcı adıyla ara".
- Davet linki: `useInvite().createLink(challengeId)` → `https://<alan-adi>/d/<kod>` (alan adı env değişkeni).
- "Devam" ve "Şimdilik atla" → 1.6.

### 1.6 Bildirim izni — `notifications.tsx` · NotifPermission
- Zemin #EEF8F1, OnboardingHeader 4/4. Balon + `Diken mood=laf size=220` + örnek bildirim kartı.
- "Bildirimlere izin ver" → expo-notifications izin isteği, token'ı `profiles.push_token`'a yaz → Bugün. "Şimdi değil" → Bugün.

---

## 2. Günlük döngü

### 2.1 Bugün — `app/(tabs)/index.tsx` · Today (+ EmptyToday)
- Başlık: tarih (13/700) + "İyi akşamlar, {ad}" (saate göre günaydın/iyi günler/iyi akşamlar). Sağda zil (→Aktivite) ve okunmamış sayısı rozeti.
- Hero kart (#DDF3E4, 164 yükseklik): seri hapı, başlık, alt metin, damla sayacı; sağ altta `Diken gear=bant(seri≥10) mood=…`.
  - 0–1 tamam: mood endise, "Diken susadı"/"Diken hâlâ susuz", "N görev kaldı. Günün bitmesine X sa Y dk var."
  - 2 tamam (3'ten): mood mutlu, "Az kaldı, bırakma"
  - hepsi tamam: mood cosku, "Diken kana kana içti", seri +1
  - Aşama seriye göre: 1–6 filiz, 7–9 genc, 10–29 tam+bant, 30+ cicek+gozluk.
- "Bugünkü görevler" + "n/m tamam". `TaskCard` listesi:
  - kart gövdesine dokun: işaretle tipi → Detay; fotoğraf tipi → 2.4; sayı tipi → 2.3
  - sağ butona dokun: işaretle tipi anında işaretler/geri alır (iyimser); fotoğraf/sayı tipi ilgili ekranı açar
  - son görev tamamlanınca 2.2 Tamamlama anı açılır
- "Arkadaşların": yatay avatar şeridi, bekleyenlerin altında turuncu "Dürt" (→3.2), sonda "Davet et".
- Boş durum (aktif challenge yok): EmptyToday.png — çöl sahnesi, `Diken mood=uykulu`, "Burası çöl gibi", "Challenge bul" (→Keşfet), "Kendin oluştur" (→Create).
- Veri: `useTodayTasks()`, `useCheckin()`, `useStreak()`, `useFriendsToday()`, `useUnreadCount()`.
- Durumlar: yükleniyor (iskelet kartlar), boş, hata (yeniden dene), çevrimdışı (koyu toast; işaretleme kuyruğa girer).
- Kabul: işaretleme 1 dokunuş, ağ beklemeden UI günceller; hero metni ve Diken ifadesi anında değişir; arkadaş şeridi alt menünün + butonuyla çakışmaz.

### 2.2 Tamamlama anı — `app/completion.tsx` (tam ekran modal) · Completion
- #1F7A45 zemin, konfeti, `Diken mood=cosku gear=bant size=232`, "Bugün tamam!", seri kartı (büyük sayı + son 7 günün tikleri, bugün sarı halkalı), "X ve Y da bugünü tamamladı".
- "Süper" kapatır. "{bekleyenler}'i gazla" → 3.2. Hafif titreşim (expo-haptics) ve Diken için küçük zıplama animasyonu (reanimated).

### 2.3 Sayı gir — `app/checkin/number.tsx` (sheet) · NumberEntry
- Başlık satırı, büyük sayı (Baloo 84) ve −/+ (5'er), "+5 / +10 / +30" kısayolları, hedef durumu hapı (hedefe X kaldı / tam hedefinde / X geçtin), "Dün / En iyin / Grupta en iyi" satırı. Sayfanın üstünde `Diken mood=laf` ve balon.
- "Kaydet" → `useCheckin().submitNumber(value)` → hepsi bittiyse 2.2, değilse kapanır.

### 2.4 Fotoğraf kanıtı — `app/checkin/photo.tsx` · PhotoProof
- Koyu ekran. Önce kamera (expo-camera), çekimden sonra tasarımdaki **önizleme** hali: foto, "Bugün · SS:DD" etiketi, not alanı, "Kimler görecek: Grup (n kişi)", "Tekrar çek" ve "Gönder".
- Gönder: görseli sıkıştır (1080 px, JPEG %80), Storage `proofs/{userId}/{checkinId}.jpg`, sonra checkin. Yükleme sırasında buton yükleniyor durumunda.

### 2.5 Challenge detayı — `app/challenge/[id].tsx` · Detail
- Başlık (karo + ad), çipler (süre, kategori, kişi sayısı, hatırlatma). İlerleme kartı: "Gün x/y", "z gün kaldı", "Bugün tamam" hapı, 10 sütunlu takvim (tamam yeşil+tik, reklamla kurtarılan turuncu damla, bugün sarı halkalı, gelecek gri numaralı), lejant.
- Grup kartı: seriye göre sıralı üyeler; bekleyenin yanında "Dürt". Alt sabit buton: bekleyen biri varsa "{ad}'i dürt", yoksa "Bugünü tamamla"/tamamlandı durumu.
- Sağ üst "…": Challenge'dan ayrıl, hatırlatma saatini değiştir, arkadaş davet et.
- Veri: `useChallenge(id)`, `useChallengeCalendar(id)`, `useChallengeMembers(id)`.

### 2.6 Challenge bitti — `app/challenge/[id]/finished.tsx` · Finished
- Krem zemin, sarı halka, konfeti, `Diken mood=gurur stage=cicek gear=gozluk`, "30/30 GÜN" hapı, "Efsane!", 3 istatistik karosu, "Bahçene çiçekli bir kaktüs eklendi" (→Bahçem).
- "Story'de paylaş" → 2.7; "Yeni challenge seç" → Keşfet. Challenge bittiği gün Bugün açılışında otomatik gösterilir.

### 2.7 Story paylaşım kartı · ShareCard (360×640 tasarım = 1080×1920 çıktı)
- Ekran değil, görüntüye çevrilen bir view: `react-native-view-shot` ile 1080×1920 PNG, sonra `expo-sharing` / Instagram Stories paylaşımı.
- İçerik: logo, Diken efsane, "{gün} GÜN", challenge adı, "{ad} başardı. Sıra sende.", "Gazla'da beni bul · @{kullanıcı}".

---

## 3. Sosyal

### 3.1 Arkadaşlar — `app/(tabs)/friends.tsx` · Friends
- Başlık + arkadaş ekle butonu (gece moru daire). Arama kutusu (kullanıcı adına göre, debounce).
- Davet kartı (#DDF3E4, sağda küçük `Diken mood=selam`), "Paylaş".
- Bölümler: İSTEKLER (Kabul et / sil), BUGÜN BEKLEYENLER (turuncu başlık, "Dürt"), BUGÜNÜ TAMAMLAYANLAR (yeşil başlık, "Gaz ver"). Satıra dokun → 3.4.
- Veri: `useFriendRequests()`, `useFriendsToday()`, `useUserSearch(q)`.
- Kabul: "Kabul et" tek satırda kalır; liste boşsa davet kartı büyür ve "Henüz arkadaşın yok" metni çıkar.

### 3.2 Dürt — `app/poke/[userId].tsx` (sheet) · Poke
- Üstte kişi satırı (kesikli halkalı avatar, "{ad} bugün hâlâ yok", challenge + seri). Segmented "Gaz ver / Laf sok".
- "Laf sok" sadece alıcının `hard_mode = true` ise aktif; değilse sekme pasif ve "{ad} sert modu açmamış" yazar.
- 2×3 hazır mesaj karosu, seçili karo gece moru kenar + tik. Mesajlar sabit listeden (`src/content/pokes.ts`, id ile); serbest metin yok.
- "{ad}'e gönder" → `usePoke().send({ toUserId, messageId })`. Aynı kişiye günde en fazla 3 dürt (sunucu kuralı); sınırda buton pasif.

### 3.3 Aktivite — `app/activity.tsx` · Activity
- Gruplar: BUGÜN, DÜN, DAHA ÖNCE. Okunmamışlarda solda turuncu nokta.
- Tipler: laf sokma/gaz verme (alıntı balonu + "Karşılık ver" → 3.2), challenge bitirme ("Tebrik et" → hazır gaz mesajı), arkadaşlık isteği (Kabul et / Sil), Diken sistem mesajı (uygulama ikonlu avatar), challenge'a eklenme.
- "Tümü okundu". Veri: `useActivity()` (sayfalı, 30'ar), `useMarkAllRead()`.

### 3.4 Arkadaş profili — `app/user/[id].tsx` · FriendProfile
- Avatar 88, ad, @kullanıcı · ortak challenge sayısı; 3 istatistik; ortak challenge listesi.
- Sağ üst "…" → tasarımdaki **işlem sayfası**: "{ad}'i dürt", "Arkadaşlıktan çıkar", "Engelle" (kırmızı, onay ister), "Şikayet et" (kırmızı → 3.5), ayrı kartta "Vazgeç".
- Engelle: `useBlock().block(id)` → arkadaşlık silinir, birbirlerini aramada ve listelerde görmezler, dürt alamazlar.

### 3.5 Şikayet et — `app/report/[userId].tsx` · Report
- Neden (tek seçim): Hakaret veya zorbalık, Uygunsuz fotoğraf, Spam veya sahte hesap, Tehlikeli bir challenge, Başka bir şey. İsteğe bağlı açıklama (500 karakter). "Ece'yi de engelle" (varsayılan işaretli). "Ekibimiz şikayetleri 24 saat içinde inceler."
- `useReport().submit({ userId, reason, details, alsoBlock })`. İçerik şikayeti için `contentId` (fotoğraf) de desteklenir.

### 3.6 Davet linkiyle gelen — `app/invite/[code].tsx` · InviteLanding
- Deep link + yükleme sonrası ertelenmiş link. Davet edenin avatarı ve notu, "{ad} seni bir challenge'a çağırıyor", challenge kartı (katılanlar), `Diken mood=cosku` + balon.
- "Katıl ve başla": oturum yoksa 1.3'e gider, girişten sonra katılımı tamamlar; varsa doğrudan katılır → Bugün. "Şimdilik değil".
- Veri: `useInvite(code)`; geçersiz/süresi dolmuş kod için hata durumu.

---

## 4. Keşfet ve oluştur

### 4.1 Keşfet — `app/(tabs)/explore.tsx` · Explore
- Başlık, arama, yatay kaydırılan kategori çipleri, haftanın challenge'ı kartı (gece moru, `Diken mood=saskin`), "Popüler" listesi, en altta **banner reklam** (AdMob 320×50, "REKLAM" etiketli; yüklenmezse alan kapanır).
- Veri: `useChallengeTemplates({ category, q })`, `useFeaturedTemplate()`.

### 4.2 Challenge önizleme — `app/challenge/preview/[templateId].tsx` · ChallengePreview
- Üst renkli alan (kategori rengi) + illüstrasyon + Diken. Başlık, çipler, açıklama, "nasıl işler" 3 satırı, süre seçici (7/10/30, şablonun izin verdikleri), "{ad} ve N kişi şu an yapıyor".
- "Arkadaşlarla" → challenge oluşturup 1.5 benzeri davet ekranı; "Tek başıma başla" → oluştur → Bugün.

### 4.3 Challenge oluştur — `app/create.tsx` (modal) · Create
- Ad (zorunlu, 3–60), süre (7/10/30/Özel: 3–60 gün), tamamlama türü (İşaretle / Sayı gir + birim ve günlük hedef / Fotoğraf kanıtı), hatırlatma saati, görünürlük (Davetliler / Arkadaşlarım), arkadaş seçimi.
- "Challenge'ı başlat" → `useCreateChallenge()`; başlangıç tarihi yarın veya bugün seçilebilir.

---

## 5. Profil ve ayarlar

### 5.1 Bahçem — `app/(tabs)/garden.tsx` · Garden
- Avatar, "{ad}'in bahçesi", @kullanıcı, ayarlar dişlisi (→5.2). 3 istatistik (aktif seri, tamamlanan, en uzun seri).
- Raflar: tamamlanan her challenge bir saksı. Aşama süreye göre (7→genc, 10→tam+bant, 30→cicek, en uzun seri olan → cicek+gozluk). Son boş yer kesikli "+" (→Keşfet). 3'lü raflar, gerekirse dikey kaydırma.
- Rozetler: kazanılanlar renkli, kilitliler gri kilitli.
- Veri: `useGarden()`, `useBadges()`.

### 5.2 Ayarlar — `app/settings/index.tsx` · Settings (390×1420, kaydırmalı)
- Profil kartı → profil düzenleme. CHALLENGE VE BİLDİRİMLER: Sert mod (toggle), Dürtme bildirimleri (toggle), Günlük hatırlatma (saat), Gün bitişi toleransı (0/1/2 saat). GÖRÜNÜM: Açık/Koyu/Sistem. GİZLİLİK VE GÜVENLİK: Beni kimler bulabilir, Engellenen kullanıcılar (listesi ve engel kaldırma), Reklam tercihleri (UMP formunu yeniden açar). DESTEK VE YASAL: Yardım, Bize yaz (mailto), KVKK, Gizlilik, Koşullar. Çıkış yap, Hesabı sil (kırmızı → 5.3). Sürüm satırı.
- Toggle'lar iyimser kaydedilir: `useUpdateSettings()`.

### 5.3 Hesabı sil — `app/settings/delete-account.tsx` · DeleteAccount
- `Diken mood=solgun`, silinecekler listesi, "Onaylamak için SİL yaz" alanı; buton yalnızca metin tam "SİL" olduğunda aktif.
- `useDeleteAccount()` → Edge Function: auth kullanıcısı, profil, checkin'ler, Storage dosyaları silinir. Bitince oturum kapanır, karşılamaya döner. (Apple'ın zorunluluğu.)

---

## 6. Gelir ve izinler

### 6.1 Seri koptu — `app/streak-lost/[challengeId].tsx` · StreakLost
- Ertesi gün ilk açılışta, kurtarma süresi (24 saat) dolmamışsa gösterilir.
- Kayıp hali: "Kurtarmak için X sa Y dk" hapı, `Diken mood=solgun`, metin, "X ve Y hâlâ devam ediyor", butonlar:
  - "Reklam izle, Diken'i sula · 30 sn" → AdMob **rewarded**. Sadece `EARNED_REWARD` olayında `useRescueStreak().rescue({ via: 'ad' })`. Ödül sunucuda doğrulanır (AdMob SSV, Edge Function).
  - "Ücretsiz hakkımı kullan · Ayda 1 hak" → `via: 'free'`; hak yoksa pasif.
  - Reklam yüklenemezse (yükleme hatası/zaman aşımı 8 sn) ücretsiz hak öne çıkarılır.
  - "Baştan başla".
- Kurtarıldı hali (aynı ekranda): zemin #EEF8F1, `Diken mood=cosku gear=bant`, "Diken sulandı!", "Devam".

### 6.2 Reklam izni ön ekranı — `app/ad-consent.tsx` · AdConsent
- İlk günü tamamladıktan sonra bir kez. 3 madde, "Devam" → önce UMP (AB/İngiltere için izin formu), sonra iOS'ta ATT sistemi isteği. "Reklam tercihlerini yönet" → UMP gizlilik seçenekleri.
- Ön ekranda ödül, zorlama veya sistem uyarısını taklit eden düğme yok (Apple kuralı).

---

## 7. Koyu mod
TodayDark.png ve DetailDark.png referanstır. Ayrı ekran yazma; tema token'larıyla aynı ekranlar koyu çalışmalı. Koyu token'lar Tokens.png'de. Diken renkleri değişmez.

---

## Veri hook'ları (`src/data/`)
Her hook `{ data, isLoading, isError, refetch }` döner ve önce mock'tan, sonra Supabase'ten beslenir. Tipler `src/types/database.ts`'ten (supabase gen types).

useProfile, useUsernameCheck, useChallengeTemplates, useFeaturedTemplate, useTodayTasks, useCheckin (iyimser + çevrimdışı kuyruk), useStreak, useChallenge, useChallengeCalendar, useChallengeMembers, useCreateChallenge, useInvite, useFriendsToday, useFriendRequests, useUserSearch, usePoke, useActivity, useUnreadCount, useMarkAllRead, useBlock, useReport, useGarden, useBadges, useUpdateSettings, useRescueStreak, useDeleteAccount.
