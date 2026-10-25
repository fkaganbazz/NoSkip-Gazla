# Yasal metinler ve yardım (taslak)

Bu klasördeki metinler **taslaktır**. Uygulamanın gerçekte ne topladığına göre koddan çıkarıldı (Supabase şeması,
istemci, sunucu fonksiyonları), ama hukuki danışmanlık değildir. Yayından önce bir avukata kontrol ettir; özellikle KVKK
aydınlatma metni, yurt dışına aktarım ve VERBİS kaydı.

| Dosya | Sitede | Uygulamada |
|---|---|---|
| `kosullar.md` | `/kosullar` | Ayarlar → Kullanım koşulları, giriş ekranındaki bağlantı |
| `gizlilik.md` | `/gizlilik` | Ayarlar → Gizlilik politikası, giriş ekranı |
| `kvkk.md` | `/kvkk` | Ayarlar → KVKK aydınlatma metni |
| `yardim.md` | `/yardim` | Ayarlar → Yardım |
| `en/terms.md` | `/en/terms` | İngilizce: Terms of use |
| `en/privacy.md` | `/en/privacy` | İngilizce: Privacy policy |
| `en/help.md` | `/en/help` | İngilizce: Help |

Mağaza metinleri ve App Privacy / Data Safety beyanları: `docs/magaza/metinler.md`; giriş e-postası metinleri:
`docs/magaza/eposta.md`. Google Play ayrıca web'de bir hesap silme sayfası ister (`/hesap-sil`, `/en/delete-account`).

## Doldurulacak yer tutucular
- `[YAYINCI]`: şirket unvanı (ör. KRATS … Ltd. Şti.) ya da bireysel yayıncının adı soyadı
- `[ADRES]`: tebligat adresi
- `[MERSİS / VERGİ NO]`: şirketse
- `[DESTEK E-POSTASI]`: ör. destek@<alan adı>
- `[ALAN ADI]`: web sitesi
- `[TARİH]`: yürürlük tarihi
- `[BÖLGE]`: Supabase projesinin bölgesi (öneri: Frankfurt, AB)
- İngilizce metinlerde aynıları: `[PUBLISHER]`, `[ADDRESS]`, `[SUPPORT EMAIL]`, `[DOMAIN]`, `[DATE]`, `[REGION]`
- Saklama süreleri: yedeklerden düşme `[7]` gün (Supabase Pro günlük yedekleri), Sentry kayıtları `[90]` gün — proje
  ayarlarına göre düzelt.

## Metinleri değiştirince kontrol et
- Uygulamaya yeni bir veri, izin, SDK ya da üçüncü taraf eklenirse Gizlilik ve KVKK metnini, App Store "App Privacy" ve Google
  Play "Data Safety" beyanlarını güncelle (`docs/magaza/metinler.md`).
- Yaş sınırı sunucuda `app.min_age()` = 13. Değişirse Koşullar'ı güncelle.
