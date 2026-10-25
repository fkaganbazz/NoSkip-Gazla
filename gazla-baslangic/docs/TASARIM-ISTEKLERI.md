# Gazla / NoSkip: tasarım istekleri

Bu dosya başka bir sohbete ya da tasarımcıya verilmek için yazıldı; tek başına yeterli. Teslim edilecek her dosyanın adı
ve ölçüsü aşağıda. Öncelik sırası: **1–3** (beta öncesi şart) → **4–6** → **7** (mağaza gönderiminden önce) → **8**.

## Ürün ve marka

**Ürün.** Gazla (Türkçe) / NoSkip (diğer diller) aynı uygulamanın iki adı.
- Arkadaşlarla 7, 10 ya da 30 günlük challenge: her gün işaretle, seriyi koru, işaretlemeyen arkadaşını dürt.
- iOS ve Android.

**Maskot Diken.** Saksıda bir kaktüs.
- Dış çizgi gece moru, gövde Diken yeşili, saksı turuncu.
- Ruh halleri: mutlu, selam (el sallar), laf (kollar bağlı, kaş kaldırmış), coşku, gurur, endişe, şaşkın, uykulu, solgun.
- Büyüme evreleri: filiz, genç, tam, çiçekli.
- Aksesuarlar: bant, gözlük.

**Ton.** Şakacı, takılan ama kırıcı olmayan bir dil. Örnekler: "Su yok mu su?", "Gaz ver", "Laf sok", "Dürt".

**Geliştirici.** KRATS. Logo: siyah "KRATS" yazısı.

**Renkler** (bunların dışına çıkma):

| Rol | Açık | Koyu mod |
|---|---|---|
| Aksiyon yeşili (buton, üstünde beyaz metin) | `#1F7A45` | `#3BAE6A` (üstünde koyu metin) |
| Diken yeşili | `#3BAE6A` | |
| Ana metin (gece moru) | `#24163F` | |
| Gövde metni | `#3F3358` | |
| İkincil metin | `#5B4A7A` | `#B7AACF` |
| Turuncu (üstündeki metin hep gece moru) | `#FF5A1F` | |
| Sarı | `#FFC83D` | |
| Hata | `#B42318` | |
| Zemin | `#FFF8F2` | `#150E26` |
| Kart / yüzey | `#FFFFFF` | `#211538` |
| Çizgi | `#EFE6DC` | `#33264F` |
| Buton gölgesi | `#165C34` | |

**Yazı tipleri** (Google Fonts):
- Başlıklar: **Baloo 2 ExtraBold (800)**
- Metin: **Nunito** 600 / 700 / 800

**Kurallar:**
- Emoji yok. İkonlar dolgusuz çizgi (stroke) SVG, yuvarlak uçlu.
- Butonlar: köşe 18, altında 4 px düz (bulanıksız) gölge.
- Kart köşesi 22, çipler tam yuvarlak, kenar boşluğu 20.

**Referans dosyalar** (repo `gazla-baslangic/` altında; sohbete ekle):
- `design/png/Diken.png`, `design/png/Moods.png`: maskot ve ruh halleri.
- `design/Diken.dc.html`: Diken'in SVG kaynağı. Vektörü buradan al, yeniden çizme.
- `design/png/Tokens.png`, `design/png/Components.png`: renk, yazı, buton kuralları.
- `design/png/Main.png`, `Today.png`, `InviteLanding.png`, `Garden.png`, `ShareCard.png`: uygulamanın görünümü.
- `marketing/instagram/noskip-yakinda-gonderi-1080x1350.png`, `noskip-yakinda-hikaye-1080x1920.png`: onaylanmış son
  pazarlama dili. Yeni görseller bunlarla aynı dilde olmalı.
- KRATS logosu.

**Teslim kuralları:**
- Her iş için vektör kaynak (SVG ya da Figma) + aşağıdaki PNG çıktıları.
- Hepsi tek klasöre: `design/teslim/`. Dosya adları tablolardaki gibi olmalı.
- Metin içeren her şey iki dilde: TR (marka adı Gazla) ve EN (marka adı NoSkip).

---

## 1. Uygulama ikonu (öncelik 1)

**Konsept:** Diken'in yüzü ve üst gövdesi, **yazısız** (marka adı dile göre değiştiği için ikon iki markada ortak).
- 2–3 seçenek çıkar; biri seçilecek.
- 29 px ve 48 px'te de okunmalı: ince çizgi ve küçük detay olmasın.

| Dosya | Ölçü | Kural |
|---|---|---|
| `icon.png` | 1024×1024 | Opak (saydamlık yok), köşeler kare (iOS kendisi yuvarlar), arka plan kenara kadar dolu. |
| `icon-dark.png` | 1024×1024 | iOS koyu mod ikonu: saydam arka plan, yalnızca Diken. İsteğe bağlı, önerilir. |
| `icon-tinted.png` | 1024×1024 | iOS renklendirilmiş ikon: siyah zemin üstünde gri tonlu Diken. İsteğe bağlı. |
| `android-icon-foreground.png` | 1024×1024 | Saydam. Diken ortadaki **~620 px çaplı dairenin** içinde kalmalı (Android ikonu daire, damla, kare gibi farklı biçimlerde kırpar). |
| `android-icon-background.png` | 1024×1024 | Opak. Düz renk ya da hafif desen. |
| `android-icon-monochrome.png` | 1024×1024 | Tek renk (siyah) siluet, saydam zemin, aynı güvenli alan (Android 13 temalı ikon). |
| `play-store-icon.png` | 512×512 | Opak, 32-bit PNG, en fazla 1 MB. `icon.png` ile aynı tasarım. |
| `favicon.png`, `favicon-512.png` | 48×48, 512×512 | Web sitesi için. |
| `icon.svg` | — | Vektör kaynak. Arka plan ve Diken ayrı katmanlarda olmalı. |

İsteğe bağlı: iOS 26 cam görünümü için Apple Icon Composer (macOS) ile hazırlanmış `AppIcon.icon` klasörü. Yoksa iOS 26
normal ikonu kullanır.

## 2. Açılış ekranı (splash)

| Dosya | Ölçü | Kural |
|---|---|---|
| `splash-icon.png` | 1024×1024 | Saydam zemin. Ekranın ortasında 200 pt genişlikte gösterilir. |
| `splash-icon-dark.png` | 1024×1024 | Yalnızca `splash-icon.png` koyu zeminde okunmuyorsa. |

- Arka plan rengini uygulama verir, görselde arka plan olmasın: açık modda `#FFF8F2`, koyu modda `#150E26`.
- İçerik: ikondaki Diken, yazısız.

## 3. Android bildirim ikonu

| Dosya | Ölçü | Kural |
|---|---|---|
| `notification-icon.png` | 96×96 | **Yalnızca beyaz (#FFFFFF) + saydam.** |

- Android renkleri siler; ikonu sistem yeşille (`#1F7A45`) boyar.
- Çok basit bir siluet olsun (Diken silueti ya da filiz), kenarlarda ~8 px boşluk.

## 4. Web sitesi

**Genel:**
- Hem mobil (390 px) hem masaüstü (1440 px) tasarlanacak.
- TR ve EN; üstte dil seçimi.
- Teslim: sayfa başına framework'süz tek HTML + CSS dosyası (ya da Figma) ve dışa aktarılmış görseller.

**4a. Ana sayfa `/` (EN: `/en`)**
- Hero: Diken, logo ve tek cümlelik vaat. Örnek: "Don't skip. Your friends won't let you." / "Bırakmak yok. Arkadaşların
  bırakmaz."
- "Nasıl çalışır" 3 adım: challenge seç → arkadaşlarını çağır → her gün işaretle, yapmayanı dürt.
- Telefon çerçevesinde 2–3 uygulama ekranı.
- App Store ve Google Play rozetleri: Apple'ın ve Google'ın resmi rozet dosyaları, değiştirilmeden. Mağaza linkleri
  gelene kadar rozetlerin yerinde "Yakında · iOS & Android" etiketi.
- Altbilgi: Koşullar, Gizlilik, KVKK, Yardım, destek e-postası, KRATS logosu.

**4b. Davet sayfası `/d/<kod>`**
Davet linkine tıklayan kişide uygulama yüklü değilse bu sayfa açılır. Referans: `design/png/InviteLanding.png`
(uygulamanın içindeki hali).
- Davet eden kişinin avatarı (baş harf + renkli daire) ve adı: "Deniz seni bir challenge'a çağırıyor".
- Challenge kartı: ikon, ad, süre ("30 gün"), başlangıç günü, katılan sayısı ve avatar yığını.
- Büyük indirme butonları (iOS / Android) ve "Uygulama yüklüyse aç" bağlantısı.
- Kısa "Gazla nedir?" bölümü, 3 madde.
- Durumlar:
  - geçerli davet
  - süresi dolmuş ya da geçersiz kod ("Bu davet artık geçerli değil" + indirme butonları)

**4c. Yasal ve yardım sayfası şablonu**
- Adresler:
  - TR: `/kosullar`, `/gizlilik`, `/kvkk`, `/yardim`
  - EN: `/en/terms`, `/en/privacy`, `/en/help`
- Uzun metin için okunaklı tek sütun (en fazla ~680 px), başlık hiyerarşisi, içindekiler listesi, "son güncelleme" tarihi.
- Yardım sayfasında SSS için açılır-kapanır sorular.
- Metinler ayrıca yazılacak; tasarımı örnek metinle yap.

**4d. 404 sayfası:** Diken "şaşkın" ruh halinde, ana sayfaya dönüş butonu.

**4e. Hesap silme sayfası `/hesap-sil` (EN: `/en/delete-account`)**
Google Play, uygulamayı yeniden kurmadan hesap silme talebi yapılabilecek bir web sayfası ister.
- Uygulama içinden silme adımları (Ayarlar → Hesabı sil), 3 adımlık görsel ya da numaralı liste.
- Uygulamaya erişemeyenler için: destek e-postasına hangi bilgilerle yazılacağı (hesabın e-postası, kullanıcı adı).
- Neyin silindiği (profil, challenge'lar, fotoğraflar, bildirim anahtarları) ve ne kadar sürede.
- Yasal sayfa şablonuyla (4c) aynı yerleşim olabilir.

## 5. Link önizleme görseli (Open Graph)

| Dosya | Ölçü |
|---|---|
| `og-tr.png`, `og-en.png` | 1200×630 |

- Site ve davet linki WhatsApp, iMessage ya da X'te paylaşılınca çıkan kart.
- İçerik: logo, Diken, kısa slogan.
- WhatsApp kare kırpabilir: logo ve Diken ortadaki 630×630 alanda da okunmalı.

## 6. Giriş e-postası

E-postayla girişte gönderilen "giriş linki" e-postası.
- İki şablon: ilk kayıt ve sonraki girişler. Tasarım aynı, yalnızca metin değişir. Her biri TR + EN.
- Teslim: HTML e-posta.
  - 600 px genişlik, tablo tabanlı yerleşim, CSS satır içinde (inline).
  - Web fontu yüklenmezse Arial/Helvetica'ya düşsün.
  - Koyu modda da okunmalı.
- Butonun bağlantısı tam olarak `{{ .ConfirmationURL }}` olmalı. Bu sunucunun yerleştirdiği değişken, değiştirme.
- İçerik:
  - logo ve Diken (PNG; siteden yüklenecek)
  - başlık: "Gazla'ya giriş yap" / "Sign in to NoSkip"
  - tek cümle açıklama ve buton
  - "Bu e-postayı sen istemediysen yok sayabilirsin."
  - altta KRATS ve destek adresi
- Konu satırları: "Gazla giriş linkin" / "Your NoSkip sign-in link".

## 7. Mağaza görselleri (gönderimden önce)

**Kaynak:** Ham ekran görüntüleri hazır: `marketing/magaza-ham/` (örnek veriyle, tam çözünürlükte):
`appstore-<tr|en>-<1-6>.png` 1290×2796 ve `play-<tr|en>-<1-6>.png` 1080×1920, kare sırası aşağıdaki listeyle aynı. Bu iş
onları çerçeveleyip üstüne başlık koymak. Stil `marketing/instagram` görselleriyle aynı olmalı.

| Mağaza | Dosyalar | Ölçü | Adet |
|---|---|---|---|
| App Store (iPhone 6.9") | `appstore-tr-1.png` … `appstore-en-6.png` | 1290×2796 | 5–6 kare, dil başına |
| Google Play telefon | `play-tr-1.png` … `play-en-6.png` | 1080×1920 | 5–6 kare, dil başına |
| Google Play öne çıkan görsel | `play-feature-tr.png`, `play-feature-en.png` | 1024×500 | 1, dil başına; yazı kenarlardan uzak |

iPad desteği açık kalırsa ayrıca 2064×2752 iPad kareleri gerekir (karar bekliyor; öneri iPad'i kapatmak).

Kare önerisi (başlıklar iyileştirilebilir):
1. Bugün ekranı: "Arkadaşlarınla challenge, her gün" / "Daily challenges with friends"
2. Dürt: "Yapmayanı dürt" / "Poke the slackers"
3. Diken / seri: "Diken seni izliyor" / "Diken is watching"
4. Fotoğraf kanıtı: "Yaptığını göster" / "Prove it with a photo"
5. Bahçe ve rozetler: "Her challenge bahçene bir kaktüs" / "Grow your cactus garden"
6. Keşfet: "7, 10, 30 günlük hazır challenge'lar" / "Ready-made 7, 10, 30-day challenges"

## 8. Rozetler

Uygulamada 12 rozet var. 3'ü tasarımda vardı (İlk 30 gün, Laf ustası, Erkenci). Kalan 9'un adı ve koşulu uygulama
tarafından önerildi ve **onay bekliyor**.
- Uygulama sahibi listeyi onaylasın ya da değiştirsin.
- Her rozet için bir İngilizce ad önerilsin.

| # | Rozet | Koşul | İkon | Renk |
|---|---|---|---|---|
| 1 | İlk 30 gün | Genel serin 30 güne ulaştı | yıldız | sarı |
| 2 | Laf ustası | 10 kez laf soktun | konuşma balonu | turuncu |
| 3 | Erkenci | 5 gün sabah 8'den önce işaretledin | güneş | nane |
| 4 | Yüz gün | Genel serin 100 güne ulaştı | seri (alev) | sarı |
| 5 | Maratoncu | 3 kez 30 günlük bir challenge'ı bitirdin | takvim | turuncu |
| 6 | Bahçıvan | Bahçende 10 kaktüs var | filiz | nane |
| 7 | Şampiyon | En az 3 kişilik bir grupta challenge'ı birinci bitirdin | **kupa (yeni)** | sarı |
| 8 | Gaz pedalı | Arkadaşlarına 25 kez gaz verdin | el | turuncu |
| 9 | Son dakika | Serini kurtarma süresinin son saatinde kurtardın | saat | nane |
| 10 | Gece kuşu | Gece yarısından sonra dünün görevini tamamladın | **ay (yeni)** | sarı |
| 11 | Sosyal kaktüs | 10 arkadaşın oldu | arkadaşlar | turuncu |
| 12 | Objektif | 30 fotoğraf kanıtı gönderdin | kamera | nane |

**Çizilecek ikonlar:** `badge-trophy.svg` (kupa) ve `badge-moon.svg` (ay).
- 24×24 viewBox, dolgusuz.
- Uçlar ve birleşimler yuvarlak.
- `design/png/Garden.png`'deki rozet ikonlarıyla (yıldız, güneş, konuşma balonu) aynı çizgi kalınlığı ve görsel ağırlık.

## İsteğe bağlı
- Gazla (TR) Instagram "yakında" görselleri: NoSkip görsellerinin Türkçesi, aynı ölçüler (1080×1350 ve 1080×1920).
- App Store önizleme videosu (15–30 sn).

## Teslim kontrol listesi
- [ ] 1. İkon: `icon.png`, `icon-dark.png`, `icon-tinted.png`, `android-icon-{foreground,background,monochrome}.png`,
      `play-store-icon.png`, `favicon.png`, `favicon-512.png`, `icon.svg`
- [ ] 2. `splash-icon.png` (+ gerekirse `splash-icon-dark.png`)
- [ ] 3. `notification-icon.png`
- [ ] 4. Web: ana sayfa, davet sayfası (2 durum), yasal/yardım şablonu, 404, hesap silme sayfası. Mobil + masaüstü, TR + EN.
- [ ] 5. `og-tr.png`, `og-en.png`
- [ ] 6. Giriş e-postası HTML'i (TR + EN)
- [ ] 7. Mağaza: App Store 1290×2796 ve Play 1080×1920 kareleri, `play-feature-{tr,en}.png`
- [ ] 8. `badge-trophy.svg`, `badge-moon.svg` ve onaylanmış rozet listesi (TR + EN adlar)
