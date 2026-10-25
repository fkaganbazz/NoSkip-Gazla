# Gazla Gizlilik Politikası

Son güncelleme: [TARİH]

Bu politika, Gazla'nın (İngilizce adıyla NoSkip; "Uygulama") hangi verileri neden topladığını, kimlerle paylaştığını ve
haklarını anlatır. Veri sorumlusu: [YAYINCI], [ADRES], [DESTEK E-POSTASI]. Türkiye'deki kullanıcılar için ayrıca
KVKK Aydınlatma Metni'ne bak.

Kısaca: Uygulamanın çalışması için gereken kadar veri toplarız, satmayız. Fotoğraf kanıtların yalnızca challenge'daki
arkadaşlarına görünür. Rehberindeki e-posta adresleri sunucumuza hiç gelmez. Hesabını Uygulama içinden silebilirsin.

## 1. Topladığımız veriler

**Hesap ve profil**
- Giriş yönteminden gelen e-posta adresin (Apple ile girişte Apple'ın gizli yönlendirme adresi olabilir) ve Apple'ın ilk
  girişte verdiği ad (isteğe bağlı, yalnızca ad önerisi için).
- Kullanıcı adın, görünen adın, avatar rengin, isteğe bağlı profil fotoğrafın.
- Doğum yılın: yalnızca yaş sınırını (13) uygulamak için.
- Kullanım koşullarını kabul ettiğin tarih.

**Ayarlar**
- Saat dilimi ve dil (günlerin doğru hesaplanması ve bildirimlerin doğru saatte, doğru dilde gitmesi için), bildirim ve
  hatırlatma tercihleri, "kimler bulabilir" seçimi, gün bitişi toleransı, sert mod.

**Uygulamayı kullanırken oluşan veriler**
- Challenge'lar (ad, süre, başlangıç, hatırlatma saati, davet mesajı, kimlerin görebileceği), üyelikler ve davetler.
- İşaretlemeler: gün, sayı değeri, isteğe bağlı fotoğraf kanıtı ve not. Seriler, kurtarmalar, rozetler.
- Dürtmeler (hazır mesajın kimliği; serbest metin yoktur), arkadaşlıklar ve istekler, engellemeler.
- Şikayetler (seçtiğin neden ve yazdığın açıklama) ve Uygulama içi bildirimler.

**Rehber (yalnızca "Rehberden bul" dersen ve izin verirsen)**
- Kişilerinin e-posta adresleri telefonunda tek yönlü özete (SHA-256) çevrilir; sunucuya yalnızca bu özetler gönderilir ve
  "beni herkes bulabilir" diyen kullanıcılarla karşılaştırılır. Özetler saklanmaz; kötüye kullanımı önlemek için yalnızca
  arama sayısı ve zamanı tutulur.
- Arkadaşlarının seni bulabilmesi için kendi e-posta adresinin özeti saklanır. Ayarlar'da "Kimse bulamasın" seçersen
  rehber aramalarında görünmezsin.

**Cihaz**
- Bildirim gönderebilmek için cihazının bildirim anahtarı (push token) ve platformu (iOS/Android). Çıkış yapınca silinir.
- Tema ve dil tercihi gibi bazı ayarlar yalnızca cihazında saklanır.

**Reklam**
- Reklamları Google AdMob gösterir. Kişiselleştirilmiş reklama izin verirsen (AB'de izin formu, iOS'ta "Takip etme izni")
  Google reklam kimliğini kullanabilir; izin vermezsen kişiselleştirilmemiş reklam görürsün. Google, reklam göstermek için
  IP adresi ve cihaz bilgisi gibi verileri kendi politikasına göre işler.
- Ödüllü reklamla seri kurtardığında, ödülün gerçek olduğunu doğrulamak için Google sunucumuza kullanıcı kimliğini ve
  kurtarılan challenge/gün bilgisini gönderir.

**Hata kayıtları**
- Uygulama çökerse ya da hata olursa Sentry'ye teknik bir kayıt gönderilir: hata ayrıntısı, cihaz modeli, işletim sistemi,
  uygulama sürümü, hangi ekranda olunduğu. Ad, e-posta ya da içerik göndermeyiz; IP adresi saklanmaz.

Uygulama konumunu, mikrofonunu ya da rehberindeki adları/telefon numaralarını toplamaz. Kamera ve fotoğraflara yalnızca sen
fotoğraf çekip seçtiğinde erişir.

## 2. Verileri neden kullanıyoruz
| Amaç | Dayanak |
|---|---|
| Hesabını açmak, challenge'ları, serileri, arkadaşlıkları çalıştırmak | Sözleşmenin ifası (Kullanım Koşulları) |
| Bildirim ve hatırlatma göndermek | Cihaz izni; Ayarlar'dan kapatabilirsin |
| Rehberden arkadaş bulmak | Açık rızan (izin ve "Rehberden bul" eylemi) |
| Kişiselleştirilmiş reklam | Açık rızan; istediğin zaman geri alabilirsin |
| Ödüllü reklamı doğrulamak, kötüye kullanımı ve dolandırıcılığı önlemek, şikayetleri incelemek | Meşru menfaat, yasal yükümlülük |
| Hataları bulup düzeltmek | Meşru menfaat |

Verilerini satmayız, profil çıkarıp üçüncü kişilere vermeyiz.

## 3. Kimler görür
- **Diğer kullanıcılar:** görünen adın, kullanıcı adın, profil fotoğrafın ve avatar rengin arkadaşlarına, ortak
  challenge'lardaki kişilere ve seni arayan kullanıcılara ("kimler bulabilir" seçimine göre) görünür. Challenge'daki
  işaretleme durumun, serin ve sıran o challenge'ın üyelerine; fotoğraf kanıtların ve notların yalnızca o challenge'ın
  üyelerine görünür. Engellediğin kişiler seni göremez.
- **Hizmet sağlayıcılarımız** (yalnızca hizmeti vermek için, sözleşmeyle):
  - Supabase (veritabanı, giriş, dosya depolama; sunucular [BÖLGE])
  - Google (AdMob reklamları, Google ile giriş)
  - Apple (Apple ile giriş, iOS bildirimleri)
  - Expo / 650 Industries (bildirim gönderimi)
  - Sentry (hata kayıtları)
  - E-posta gönderim hizmeti (giriş bağlantısı e-postaları)
- **Yasal zorunluluk:** yetkili makamların hukuka uygun talebi halinde.

Bu sağlayıcıların bir kısmı ABD'dedir; verilerin Türkiye ve AB dışına aktarılabilir. Aktarımlar yürürlükteki mevzuata
uygun güvencelerle (standart sözleşmeler, açık rıza) yapılır.

## 4. Ne kadar saklıyoruz
- Hesabın açık olduğu sürece.
- Hesabını sildiğinde (Ayarlar → Hesabı sil) profilin, içeriğin, fotoğrafların, bildirim anahtarların ve ilişkili tüm
  kayıtlar hemen silinir. Yedeklerden en geç [7] gün içinde düşer. Yasal olarak saklamak zorunda olduğumuz kayıtlar
  (varsa) yalnızca o süre boyunca tutulur.
- Hata kayıtları Sentry'de en çok [90] gün tutulur.

## 5. Güvenlik
Bağlantılar şifrelidir (TLS). Veritabanında her kullanıcı yalnızca görmeye yetkili olduğu satırları görebilir (satır
düzeyinde güvenlik). Fotoğraf kanıtları herkese açık değildir; kısa süreli imzalı bağlantılarla gösterilir.

## 6. Çocuklar
Uygulama 13 yaşından küçükler için değildir. 13 yaşından küçük birinin hesap açtığını öğrenirsek hesabı sileriz.

## 7. Hakların
Verilerine erişme, düzeltme, silme, işlemeye itiraz etme, verilerini taşınabilir biçimde isteme ve rızanı geri alma
hakkın var. Profilini Uygulama içinden düzenleyebilir, hesabını silebilirsin; diğer talepler için [DESTEK E-POSTASI]
adresine yaz, en geç 30 gün içinde yanıtlarız. Türkiye'de Kişisel Verileri Koruma Kurulu'na, AB'de ülkendeki veri koruma
otoritesine şikayette bulunabilirsin.

## 8. Değişiklikler
Bu politikayı güncelleyebiliriz. Önemli değişiklikleri Uygulama içinde ya da e-postayla duyururuz.

## 9. İletişim
[YAYINCI] · [ADRES] · [DESTEK E-POSTASI]
