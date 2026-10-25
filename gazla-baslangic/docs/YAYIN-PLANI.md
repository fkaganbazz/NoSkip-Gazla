# Yayın planı: adım adım

Durum: Kod tamam (`docs/ILERLEME.md` 37/37). Uygulama örnek veriyle (mock) çalışıyor, hiçbir hesaba bağlı değil ve
telefonda denenmedi. Aşağıdaki sırayla ilerle. Her adımın sonundaki **Bana söyle** kısmını sohbete yaz.

**Gizli değerler:** Token, şifre ve özel anahtar sohbete asla yazılmaz. Bunları oturum başlığındaki ortam menüsünden
(Edit) **Network secrets** bölümüne, o bölüm yoksa ortam değişkeni (environment variable) olarak ekle; adını aşağıda
yazdım. Yeni oturum açılınca okunur. Kimlik numaraları (ID) ve adresler gizli değildir, sohbete yazılabilir.

Tasarım işleri ayrı bir dosyada: `docs/TASARIM-ISTEKLERI.md` (başka sohbette yaptırmak için). Tasarım, aşağıdaki
adımlarla aynı anda yürüyebilir.

---

## Adım 1: Kararlar (bugün, hesap açmadan önce)
1. **Tek uygulama mı, iki uygulama mı?** Öneri: tek uygulama. Telefon Türkçeyse "Gazla", diğer dillerde "NoSkip" adıyla
   görünür; mağazada da dil başına ayrı ad ve açıklama olur. İki ayrı uygulama her işi iki katına çıkarır.
2. **Uygulama kimliği (bundle id / paket adı):** Şu an `app.gazla`. Mağazaya çıktıktan sonra **değiştirilemez**. Marka
   global olarak NoSkip olacaksa daha nötr bir kimlik (örn. `com.krats.noskip`) düşün.
3. **Yayıncı bireysel mi, şirket (KRATS) mi?**
   - Şirket olarak yayınlamak için Apple ve Google D-U-N-S numarası ister. Ücretsizdir ama birkaç gün ile birkaç hafta
     arasında sürebilir; o yüzden hemen başvur.
   - Bireysel Google Play hesabında üretime çıkmadan önce **12 kişiyle 14 gün kapalı test** zorunludur. Şirket hesabında
     bu şart yok.
4. **Alan adı:** gazla.app mı, noskip.app mı, ikisi mi? Davet linkleri tek alan adından çalışır. Öneri: tek alan adı;
   Türkçe ve İngilizce sayfalar aynı sitede.
5. **iPad:** Öneri: kapat. iPad için tasarım yok, açık kalırsa mağaza iPad ekran görüntüsü de ister.

**Bana söyle:** 5 kararın cevabını.

## Adım 2: Hesaplar (onayı uzun sürenleri önce aç)
| Hesap | Ücret | Not |
|---|---|---|
| Apple Developer Program | 99 $/yıl | developer.apple.com/programs. Bireysel hesap genelde 1–2 günde onaylanır. |
| Google Play Console | 25 $, bir kez | play.google.com/console. Kimlik doğrulaması birkaç gün sürer. |
| Expo | Ücretsiz | expo.dev. Bulut derleme (EAS). |
| Supabase | Ücretsiz başlar | Yayında Pro önerilir (25 $/ay): ücretsiz proje 1 hafta kullanılmazsa durdurulur ve günlük yedek yok. |
| AdMob | Ücretsiz | admob.google.com. Ödeme profilini de doldur. |
| Sentry | Ücretsiz katman | sentry.io. Çökme takibi. |
| E-posta gönderimi (Resend ya da Postmark) | Ücretsiz katman yeterli | Supabase'in kendi e-posta servisi yalnızca proje ekibine ve saatte birkaç e-posta gönderir. E-postayla giriş için şart. |

**Bana söyle:** Apple Team ID (developer.apple.com → Membership) ve Expo kullanıcı adın.

## Adım 3: Alan adı ve e-posta
1. Alan adını satın al (Cloudflare, Namecheap vb.).
2. Destek adresini aç: `destek@<alan>` (Google Workspace, Zoho Mail ya da iCloud+ özel alan adı).
3. Resend'de (ya da Postmark'ta) alan adını doğrula: verdiği DNS kayıtlarını alan adına ekle.
4. Ücretsiz barındırma hesabı aç: Cloudflare Pages, Vercel ya da Netlify. Site dosyalarını ben hazırlayacağım.

**Bana söyle:** Alan adını ve destek e-postasını.

## Adım 4: Expo / EAS
1. expo.dev'de yeni proje oluştur (adı: gazla ya da noskip).
2. expo.dev → Account settings → Access tokens bölümünden bir token oluştur. Ortam ayarlarına `EXPO_TOKEN` adıyla ekle.
   Böylece derlemeleri ben buradan başlatabilirim.
3. İlk iOS derlemesinde imza sertifikalarının oluşturulması için bir kez kendi bilgisayarında
   `npx eas-cli build -p ios --profile development` çalıştırıp Apple hesabınla giriş yapman gerekebilir (Mac gerekmez,
   Node yeterli). O adıma gelince seni yönlendiririm.

**Bana söyle:** EAS proje ID'sini (expo.dev → proje sayfası → ID).

## Adım 5: Supabase
1. Yeni proje oluştur. Bölge: **Frankfurt (eu-central-1)**; Türkiye'ye yakın ve AB içinde. Veritabanı şifresini sakla.
2. Ortam ayarlarına ekle:
   - `SUPABASE_ACCESS_TOKEN` (supabase.com → Account → Access Tokens)
   - `SUPABASE_DB_PASSWORD`
   - `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API)
3. Auth → SMTP ayarlarına Resend/Postmark bilgilerini sen gir (şifre bana gelmesin).
4. Gerisini ben yaparım: tabloları yüklemek, sunucu fonksiyonlarını dağıtmak, zamanlanmış işler, sırlar, giriş dönüş
   adresleri (`gazla://auth/callback`) ve testlerin gerçek projede çalıştırılması.

**Bana söyle:** "Supabase eklendi" ve proje adresi (`https://<kod>.supabase.co`).

## Adım 6: Apple ve Google ile giriş
**Apple** (developer.apple.com → Certificates, IDs & Profiles):
1. Identifiers → App ID oluştur (Adım 1'deki uygulama kimliği) ve "Sign in with Apple"ı aç.
2. Android'de Apple girişi tarayıcıdan çalışır. Bunun için bir **Services ID** ve bir **Sign in with Apple anahtarı
   (.p8)** oluştur, sonra Supabase → Authentication → Providers → Apple'a sen gir. Adımları o noktada ayrıntılı veririm.

**Google** (console.cloud.google.com):
1. Yeni proje → OAuth izin ekranı: uygulama adı, logo, gizlilik linki (site hazır olunca).
2. Kimlik bilgileri → üç OAuth istemcisi:
   - **Web uygulaması**
   - **iOS** (uygulama kimliği)
   - **Android** (paket adı + SHA-1). SHA-1 ilk EAS derlemesinden sonra çıkar, ben söylerim.
3. Supabase → Authentication → Providers → Google:
   - Web istemci kimliği ve gizli anahtarını sen gir.
   - Client IDs alanına iOS kimliğini de ekle (virgülle).
   - **"Skip nonce check"** seçeneğini aç.

**Bana söyle:** Google Web ve iOS istemci kimliklerini (`...apps.googleusercontent.com`, gizli değil).

## Adım 7: AdMob
1. iOS ve Android uygulamalarını ekle ("henüz mağazada değil" seçeneğiyle).
2. Her biri için bir **banner** ve bir **ödüllü (rewarded)** birim aç (toplam 4 birim).
3. Privacy & messaging bölümünde GDPR mesajı oluşturup yayımla (TR + EN). iOS için IDFA açıklama mesajı isteğe bağlı.
4. Ödüllü birimlerin "Sunucu tarafı doğrulama" adresini Adım 5'ten sonra ben vereceğim.

**Bana söyle:** 2 uygulama kimliği (`ca-app-pub-…~…`) ve 4 birim kimliği (`ca-app-pub-…/…`). Gizli değiller.

## Adım 8: Sentry
1. React Native projesi oluştur.
2. Ortam ayarlarına `SENTRY_AUTH_TOKEN` ekle (hata kayıtlarının okunur olması için).

**Bana söyle:** DSN adresini.

## Adım 9: İlk deneme sürümü ve telefonda test
1. **Ben:** Tüm değerleri bağlarım ve deneme sürümünü (development build) derlerim.
2. **Sen:** iPhone'unu kaydedersin (linki ben veririm) ve uygulamayı yüklersin.
3. **Sen:** `docs/NATIVE-KONTROL.md` listesini baştan sona dener, sorunları ekran görüntüsüyle bana yazarsın.

## Adım 10: Web sitesi
- Tasarım hazırsa siteyi ben kurarım: ana sayfa, davet sayfası (`/d/<kod>`), yasal sayfalar, davet linklerinin
  uygulamayı açması için gereken dosyalar ve `app-ads.txt`. Sen barındırma hesabına bağlarsın.
- Yasal metinlerin (Koşullar, Gizlilik, KVKK, Yardım; TR + EN) taslakları hazır → `docs/yasal/`. KVKK metnini bir avukata kontrol ettirmeni ve VERBİS
  kaydı gerekip gerekmediğini sormanı öneririm.

## Adım 11: Beta
1. **iOS:** TestFlight. Ekip içi test hemen başlar; dışarıdan test için kısa bir Apple incelemesi gerekir.
2. **Android:** Play Console → Kapalı test. Bireysel hesapta **en az 12 kişi 14 gün** katılmalı. Bu, üretime çıkıştaki
   en uzun bekleme; mümkün olan en erken günde başlat.
3. Arkadaşlarınla en az bir gerçek 7 günlük challenge yapın.

## Adım 12: Mağaza ve gönderim
- **Mağaza metinleri** (ad, alt başlık, açıklama, anahtar kelimeler; TR + EN): taslak hazır → `docs/magaza/metinler.md`.
- **Ekran görüntüleri ve öne çıkan görsel:** tasarım (`docs/TASARIM-ISTEKLERI.md` §7).
- **Apple App Privacy ve Google Data Safety formları:** neyin işaretleneceğini ben listelerim (rehber özetleri,
  fotoğraf, reklam kimliği…), sen girersin.
- **Yaş sınıflandırma anketi ve kategori:** öneri "Sağlık ve Fitness" ya da "Yaşam Tarzı".
- **Apple incelemesi için demo hesap:** test hesabını ve örnek veriyi ben hazırlarım.
- **Google Play hesap silme adresi:** web sitesinde `/hesap-sil` sayfası olmalı (Play bunu zorunlu tutuyor).
- **Gönder.** Apple incelemesi genelde 1–2 gün sürer.

---

## Sen hesaplarla uğraşırken benim yapacaklarım
1. **Giriş dönüşü hatası:** Supabase'e bağlanınca e-postayla giriş linki ve tarayıcıdan giriş (Android'de Apple) oturumu
   açamıyor. Dönüş adresini karşılayan sayfa ve PKCE akışı eksik. Bunu düzelteceğim.
2. **İngilizce:** çeviri altyapısı, bütün metinlerin İngilizcesi, dile göre uygulama adı (Gazla / NoSkip), şablon ve dürtme
   mesajlarının İngilizceleri.
3. **Sentry kurulumu:** DSN gelince açılacak şekilde.
4. **Taslak metinler:** yasal metinler, mağaza metinleri, giriş e-postası metinleri.
5. **Mağaza için ham ekran görüntüleri:** tasarım sohbetine verilecek, TR + EN, tam çözünürlükte.
6. **Küçük sunucu eklemeleri:** reklam izni sonucunun saklanması, Bahçe aksesuarları, Keşfet şablon linki.

## Tasarım (başka sohbette)
Sıra:
1. İkon + açılış ekranı + bildirim ikonu (beta öncesi şart)
2. Web sitesi + giriş e-postası + link önizleme görseli
3. Mağaza görselleri
4. Rozet ikonları

Ayrıntılar ve ölçüler `docs/TASARIM-ISTEKLERI.md` dosyasında. Bitince dosyaları `gazla-baslangic/design/teslim/` altına
koy (ya da bu sohbete ekle) ve "tasarımları yaptım" de.
