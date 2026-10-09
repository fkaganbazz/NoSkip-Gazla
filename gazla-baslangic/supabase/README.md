# Supabase — Gazla veri modeli

CLAUDE.md'deki veri modelinin Postgres şeması: tablolar, RLS, seri motoru (SQL), istemcinin
çağırdığı RPC'ler, Storage politikaları ve referans veri. Tüm tablolarda RLS açık; istemci
tablolara yalnızca politikası olan yerlerde doğrudan dokunur, geri kalan her şey `public.*` RPC'leri
üzerinden yürür.

## Dosyalar

| Migration | İçerik |
|---|---|
| `20261007100000_base.sql` | uzantılar, enum'lar, `app` şeması, ürün sabitleri (`app.grace_period()` …), varsayılan kapalı fonksiyon yetkileri |
| `20261007100100_profiles.sql` | `profiles`, `user_settings`, yerel gün kuralları (`day_closes_at`, `open_dates`, `checkin_dates`) |
| `20261007100200_social.sql` | `friendships`, `blocks`, `reports`, `poke_messages`, `pokes`, `notifications`, `push_tokens`, istek kaydı |
| `20261007100300_challenges.sql` | `challenge_templates`, `challenges`, `challenge_invites`, `challenge_members`, sahiplik devri, RLS ön süzgeçleri |
| `20261007100400_checkins.sql` | `checkins`, `streak_rescues` |
| `20261007100500_streak_engine.sql` | seri motoru: challenge serisi, genel seri, en uzun seri, kurtarma, bitiş (sonuç ve sıra) |
| `20261007100600_rpc_actions.sql` | yazma RPC'leri (profil, arkadaşlık, dürtme, şikayet, challenge, işaretleme, kurtarma) |
| `20261007100700_rpc_reads.sql` | ekran okumaları, zamanlanmış işler, fonksiyon ve tablo yetkileri |
| `20261007100800_storage.sql` | `proofs` (özel) ve `avatars` (açık) kovaları, Storage politikaları |
| `20261007100900_reference_data.sql` | 12 hazır dürtme mesajı, 8 challenge şablonu (prod'da da gerekli) |

Testler (`tests/`, pgTAP, 970 doğrulama):

| Dosya | Kapsam |
|---|---|
| `01_rls_privileges.test.sql` | her tablo için kim ne okur/yazar, sütun yetkileri, fonksiyon yetkileri, Storage |
| `02_streak_engine.test.sql` | yerel gün, tolerans, yaz saati, seriler, kurtarma, bitiş, bahçe |
| `03_social_rpcs.test.sql` | profil, arama, arkadaşlık, engel, şikayet, dürtme, bildirim, push token |
| `04_challenge_rpcs.test.sql` | challenge oluşturma, davet, link, katılma, ayrılma, işaretleme |
| `05_review_fixes.test.sql` | iki inceleme turunda eklenen kurallar (saat dilimi tabanı, ilk gün kurtarma, bitiş ve sıra, şikayet, engel, Diken push, sınırlar, dosya adları, tolerans, hesap silme) |

## Uygulama ve test

```bash
supabase start
supabase db reset          # migration'ları sırayla uygular; ayrı seed gerekmez (referans veri 900'de)
supabase test db           # tests/*.sql (pg_prove)
```

Testler pgTAP ve [basejump supabase_test_helpers](https://github.com/usebasejump/supabase-test-helpers)
fonksiyonlarını kullanır (`tests.create_supabase_user`, `tests.authenticate_as`,
`tests.authenticate_as_service_role`, `tests.clear_authentication`, `tests.get_supabase_uid`,
`tests.rls_enabled`). Yardımcılar yerel veritabanına bir kez kurulur (dbdev ile
`basejump-supabase_test_helpers` uzantısı, ya da projenin README'sindeki SQL). Her test dosyası kendi
verisini oluşturur ve `rollback` ile geri alır.

Bu şema ve testler PostgreSQL 16 üzerinde, Supabase rolleri, `auth` ve `storage` şemalarıyla aynı
davranan bir test ortamında doğrulandı (970/970). Gerçek Supabase'de ilk `supabase test db`
çalıştırmasında farklılık çıkarsa önce Storage tablolarına doğrudan yazan testlere bakın (Storage
sürümleri `storage.objects` üzerinde ek tetikleyiciler getirebiliyor).

Zaman: tüm `public.*` RPC'leri zamanı `now()` ile, kullanıcıyı `auth.uid()` ile alır; istemci zamanı
ya da kimliği değiştiremez. Aynı mantığın zamanı parametre alan `app.*(…, p_at)` sürümleri testler ve
zamanlanmış işler içindir, API rollerine kapalıdır.

## Sunucudaki kurallar

### Yerel gün ve tolerans
- Her kullanıcının saat dilimi `user_settings.timezone` (varsayılan `Europe/Istanbul`).
- Gün `d`, ertesi günün yerel gece yarısından **2 saat sonra** kapanır (`app.day_closes_at`). Süre
  geçen zamanla ölçülür; yaz saati gecelerinde de tam 2 saattir.
- İşaretlenebilen günler `app.open_dates`: bugün, gün kapanmadıysa dün. Yarın işaretlenemez.
  `my_today` her işaretlenebilen gün için satır döner: 00:00–02:00 arası dünün görevleri de
  (`local_date` = dün) listelenir; istemci işaretlerken `p_local_date` gönderir.
- Saat dilimi değişince eski dilimde kapanmış günler yeniden açılmaz (`user_settings.checkin_floor`).
  Bu taban yalnızca işaretleme ve geri almayı etkiler (`app.checkin_dates`).

### Seri (CLAUDE.md: "Seri hesabı sunucuda")
- Kapsanan gün: o challenge için işaretleme ya da kurtarma olan gün. Sayı görevinde hedefin altı da
  günü kapsar.
- Challenge serisi (`app.challenge_streak`): üyenin aralığında (katıldığı günden, ayrıldığı günden
  öncesine kadar) en son kırılmadan sonraki kapsanan günler.
- Genel seri (`app.user_streak`): gün, o gün üyesi olduğu tüm challenge'lar kapsanmışsa tamamdır.
  Hiç challenge'ı olmayan gün seriyi dondurur (bozmaz, saymaz).
- Açık ve kapsanmamış gün seriyi bozmaz; ama daha sonraki bir gün kapsanmışsa bozar (boş dünün
  üstünden atlanmaz).
- Diken aşaması `public.diken_stage_for`: 0–6 filiz, 7–9 genç, 10–29 tam, 30+ çiçek.

### Kurtarma
- Kaçırılan gün, kapanışından itibaren **24 saat** kurtarılabilir (`app.pending_rescues`), öncesinde
  challenge serisi > 0 ise. Üyenin o challenge'daki ilk günüyse genel seri > 0 olması yeter.
- Kurtarılmış günün ertesi kurtarılamaz: art arda kurtarmayla (reklamla) challenge işaretlemeden
  bitirilemez.
- Ücretsiz hak: kullanıcının yerel takvim ayında 1 (`public.rescue_streak`).
- Reklamla kurtarma yalnızca sunucuda doğrulanmış ödülle: `public.grant_ad_rescue` (service role).
  Aynı ödül kimliği tekrar gelirse mevcut kayıt döner; başka bir gün için kullanılamaz.

### Challenge bitişi
- Üyenin sonucu (`final_days_done`, `final_required_days`, `final_rescues`, `final_rank`), son gün
  **her aktif üyenin** saat diliminde kapandıktan ve o challenge için kimsenin bekleyen kurtarması
  kalmadıktan sonra kaydedilir. Böylece son günü kurtaran da sonuca girer ve sıralar tutarlıdır.
- Kendi tüm günlerini kapsayan üye bitirmiş sayılır: bahçeye kaktüs eklenir, arkadaşlarına bildirim
  gider (bildirimde kendi gün sayısı). Sonradan katılanın günleri katıldığı günden sayılır. Son
  aktif üye sonuçlanınca sıralar kayıtlı sonuçlardan yeniden yazılır (aynı sırayı iki kişi almaz).
- Kayıt ya kullanıcı Bugün'ü açınca (`my_today`), ya da saatlik işle (`finish_due_challenges`) olur.

### Challenge ve üyelik
- Hazır süreler 7/10/30; şablonsuz challenge 3–60 gün. Başlangıç bugün ile 7 gün sonrası arası.
- Grupta en çok 20 aktif üye; bir kullanıcı aynı anda en çok 20 süren challenge'da.
- Davet yalnızca arkadaşa. Reddedilen davet aynı gün en çok 3 kez tekrarlanır. Davet linki her
  üyenin challenge başına bir kodu; challenge sahibi herhangi bir üyenin linkini kapatabilir.
- Ayrılmak kalıcıdır (geri katılma ya da yeniden davet yok; dönüş kaçırılan günleri seriden
  silerdi). Son günü geçmiş challenge'dan ayrılınmaz (sonuç kaydedilecek).
- Sahip ayrılırsa ya da hesabını silerse sahiplik en eski aktif üyeye geçer. Aktif üye kalmazsa
  bekleyen davetler düşer, linkler kapanır, challenge geçmiş için sahipsiz kalır. Hiç üye satırı
  kalmazsa silinir.

### Dürtme
- Yalnızca hazır mesajlar (`poke_messages`). Arkadaşa ya da süren bir ortak challenge'daki üyeye.
- "Laf sok" (`roast`) yalnızca alıcının sert modu açıksa.
- Aynı kişiye günde en çok 3, alıcının yerel gününe göre; geri alınanlar da sayılır (bildirim
  çoktan gitti). Gönderen 30 saniye içinde geri alabilir.

### Diken bildirimleri
- Günde en çok 2 (gönderim anının yerel gününe göre), sessiz saatler 23:30–08:00 (kullanıcının
  yerel saati). Kural `public.claim_diken_push` içinde ve atomik.

### Engelleme, şikayet, hesap silme
- Engel iki yönde de görünürlüğü keser: profil, grup listesi, işaretlemeler, kanıt fotoğrafları,
  bildirimler. Engelleyen, engellerken görebildiği kişileri listesinde görmeye devam eder (rastgele
  bir kişiyi engelleyerek profili açılmaz); iki taraf da engellediyse ikisi de görmez. Engellenen
  engellendiğini öğrenmez. Engel arkadaşlığı ve aralarındaki bekleyen davetleri siler.
- Şikayet `public.submit_report`: kullanıcı, fotoğraf ya da challenge. Sonuç engele bağlı değildir
  (şikayet, engellendiğini öğrenmenin yolu olmasın). Davet linkinden görülen challenge yalnızca kodla
  şikayet edilir (`p_target => 'challenge', p_invite_code`). Aynı hedefe açık şikayet tekrarlanmaz;
  günde en çok 10 yeni şikayet. Şikayet anındaki kanıt `reports.evidence`'ta saklanır; incelenen
  fotoğraf Storage'dan silinemez. İnceleme süresi `review_due_at` (24 saat). Kullanıcılar
  şikayetleri okuyamaz.
- Hesap silme: `auth.users` satırı silinince her şey zincirleme silinir. Şikayetler moderasyon için
  kişi alanları boşaltılarak kalır; şikayet edilenin kanıttaki kişisel verileri de silinir. Hiç üye
  satırı kalmayan challenge silinir.
- Görünen ad maskot, marka ya da destek ekibi gibi olamaz ("Diken", "Gazla Destek").

### Gizlilik
- Profil: kendisi, arkadaşlık satırı olanlar (bekleyen dahil), aktif ortak üyeler. Bekleyen davetli
  grupta yalnızca onu davet edene görünür (linkle katılan yabancıya görünmez).
- Arkadaş profili (`friend_profile`: seri, tamamlanan, ortak challenge'lar) yalnızca arkadaş ya da
  ortak üyeye; bekleyen istek yalnızca profil satırını gösterir.
- Doğum yılı, saat dilimi ve bildirim tercihleri yalnızca sahibinde (`user_settings`).
- İşaretleme ve kanıt fotoğrafı: kendisi ve aynı challenge'ın aktif üyeleri (engel yoksa). Grup
  yalnızca bir işaretlemeye bağlı fotoğrafı görür. Kapanmış günün fotoğrafı değiştirilemez.
- Kurtarma yöntemi (reklam/ücretsiz) kişiseldir; grup yalnızca seriyi görür.
- Davet kodu yalnızca linkin sahibine görünür (`challenge_invites`).

### Yetkiler
- Fonksiyonlar varsayılan olarak kapalıdır. `app.*` fonksiyonlarını yalnızca `service_role`
  çalıştırır; `authenticated` yalnızca RLS politikalarının çağırdığı yardımcıları çalıştırabilir.
  `anon` yalnızca `diken_stage_for`, `get_invite_preview`, `template_stats`.
- API rollerinde TRUNCATE, TRIGGER, REFERENCES yok (TRUNCATE RLS'i atlar).
- RLS politikaları `app.my_challenge_ids()` / `app.my_related_user_ids()` ön süzgeciyle dizin
  kullanır; satır başına pahalı kontrol yalnızca ilgili satırlarda çalışır.

## İstemci RPC'leri

| Ekran | RPC / tablo |
|---|---|
| Profile (onboarding) | `is_username_available`, `complete_profile` |
| Settings | `user_settings` (update), `profiles` (update), `blocks` |
| Today | `my_today`, `my_streak`, `checkin`, `undo_checkin`, `friends_today` |
| Completion | `my_streak`, `my_recent_days` |
| NumberEntry | `my_today` (`target`, `number_unit`), `checkin(p_value)` |
| PhotoProof | Storage `proofs/{uid}/{challenge}/{uuid}.jpg` yükle, sonra `checkin(p_photo_path)` |
| StreakLost | `my_pending_rescues`, `rescue_streak` (ücretsiz), reklam → sunucu `grant_ad_rescue` |
| Detail | `challenge_board`, `challenges`, `challenge_members` |
| Create / PickChallenge | `challenge_templates`, `create_challenge`, `invite_to_challenge` |
| InviteFriends | `search_profiles`, `send_friend_request`, `create_invite`, `revoke_invite` |
| InviteLanding | `get_invite_preview` (anon), `join_challenge_by_invite`, şikayet: `submit_report(p_target => 'challenge', p_invite_code)` |
| Explore / ChallengePreview | `challenge_templates`, `template_stats` |
| Friends | `friends_today`, `friendships`, `accept_friend_request`, `send_friend_request` |
| FriendProfile | `friend_profile` |
| Poke | `poke_messages`, `send_poke`, `pokes` (delete = geri al) |
| Activity | `notifications`, `mark_notifications_read`, `pokes`, `poke_messages` |
| Garden / Finished | `my_garden`, `my_streak` |
| Report | `submit_report` |
| Bildirimler | `register_push_token`, `push_tokens` (delete = çıkış) |

## Sunucu tarafı işler (Edge Function / pg_cron)

Bunlar henüz yazılmadı; şema hazır.

- **Challenge bitişi**: `select public.finish_due_challenges();` saatlik (pg_cron, service role).
- **Reklamla kurtarma**: AdMob SSV geri çağrısını alan Edge Function imzayı doğrular, sonra
  `grant_ad_rescue(user_id, challenge_id, missed_date, transaction_id)` çağırır (challenge ve gün
  `custom_data` ile gelir). İstemci reklam bitince yalnızca `my_streak`/`my_pending_rescues`'u
  yeniler.
- **Diken bildirimleri**: zamanlayıcı (pg_cron + Edge Function) `notifications` satırını
  `actor_id = null` ile ekler (tür: `daily_reminder`, `day_ending`, `streak_broken`, …; `local_date` =
  kullanıcının günü), `claim_diken_push(id)` true dönerse Expo push gönderir. Hatırlatma saati
  `user_settings.daily_reminder_time`, grubun saati `challenges.reminder_time`.
- **Dürtme ve istek bildirimleri**: `notifications` satırları tetikleyicilerle oluşur
  (`actor_id` dolu). Push için Database Webhook → Edge Function; `poke_push_enabled` kapalıysa
  gönderme. Diken sınırına sayılmaz.
- **Hesap silme** (DeleteAccount): Edge Function JWT'yi doğrular, `proofs/{uid}/` ve `avatars/{uid}/`
  altındaki dosyaları siler, `auth.admin.deleteUser(uid)` çağırır. Veritabanı zincirleme temizlenir.
- **Şikayet incelemesi**: ekip `reports`'u service role ile okur (`reports_pending_idx`,
  `review_due_at`); karar `status` ve `reviewed_at` ile kaydedilir.

## Kararlar

Tasarımda ya da CLAUDE.md'de açık olmayan noktalarda verilen kararlar:

1. En küçük yaş 13 (doğum yılıyla). Profil yalnızca `complete_profile` ile oluşur.
2. Grup en çok 20 aktif üye; kullanıcı aynı anda en çok 20 süren challenge.
3. Dürtme: çift başına günde 3 (alıcının günü, geri alınanlar dahil), 30 saniye geri alma.
   Challenge bağlamı yalnızca challenge sürerken.
4. Arkadaşlık isteği: aynı kişiye 24 saatte en çok 3 (geri çekip yeniden gönderme dahil). Reddedilen
   challenge daveti aynı gün en çok 3 kez. Şikayet: günde en çok 10 yeni.
5. Şablonsuz süre 3–60 gün; başlangıç bugün ile +7 gün arası.
6. Gün kapanışı yerel gece yarısı + 2 saat; kurtarma kapanıştan sonra 24 saat.
7. Ücretsiz kurtarma kullanıcının yerel takvim ayına bağlı. Kurtarılmış günün ertesi kurtarılamaz
   (reklam sınırsız değil; ürün kararı olarak değiştirilebilir).
8. Genel seri o günün tüm challenge'larını ister; challenge'sız gün seriyi dondurur.
9. Sayı görevinde hedefin altı da günü tamamlar; günlük hedef `number_max`'ı aşmaz. Sayılar 4
   ondalığa yuvarlanır.
10. Ayrılmak kalıcı; son aktif üye ayrılınca challenge geçmiş için sahipsiz kalır.
11. Sonradan katılan, kendi günlerini tamamlarsa bitirmiş sayılır; kaktüs aşaması kendi gün
    sayısına göre.
12. Fotoğraflı işaretleme için dosya önce yüklenmeli ve yalnızca bir günün kanıtı olur. Grup yalnızca
    işaretlemeye bağlı fotoğrafı görür; kapanmış günün fotoğrafı değişmez.
13. Şikayet engelden bağımsız; davet linkiyle challenge şikayeti; kanıt anlık görüntüsü saklanır.
14. Profil fotoğrafları herkese açık kovada (arama ve davet kartı için).
15. Sert mod varsayılan kapalı.
16. Kaldırılan dürtme mesajları eski dürtmelerin metni için okunur kalır.
17. Şablon başlıkları süreyi içeriyor ("7 gün kahvesiz"); süre değiştirilirse başlık aynı kalır.
18. Zorluk değeri tasarımda görünmeyen şablonlar için tahmin: plank, 20 sayfa, harcama, şekersiz.

## Açık sorular

- **Rozetler** (Garden "Rozetler 3 / 12"): rozet listesi ve kazanma kuralları belli değil; tablo yok.
- **İngilizce metinler**: şablon ve dürtme mesajlarının `*_en` alanları boş.
- **FriendProfile "11/30"**: takvim günü mü, tamamlanan gün mü? `friend_profile` ikisini de döner
  (`day_index`, `days_done`).
- **Explore "Mert ve Kerem yapıyor"**: arkadaşın ortak olmayan challenge'ı görünsün mü? Şu an
  `template_stats` yalnızca arkadaş adlarını ve sayıyı döner, challenge'ı göstermez.
- **Sonradan katılma**: süren challenge'a son güne kadar katılınabiliyor. Bir sınır gerekir mi?
- **Art arda kurtarma**: şu an kurtarılmış günün ertesi kurtarılamıyor. Reklam geliri için art arda
  kurtarmaya izin verilsin mi?
- **Challenge düzenleme/silme**: sahip yalnızca ad, kısa ad, hatırlatma saati ve davet mesajını
  değiştirebiliyor. Süre/başlangıç değişikliği ve silme yok.
- **Şikayet aracı**: inceleme ekibinin arayüzü (Supabase Studio mu, ayrı bir panel mi?).

## Bilinen sınırlar

- İşaretleme beyana dayalıdır. Bir dosya yalnızca bir günün kanıtı olabilir, ama aynı fotoğraf yeni
  adla yeniden yüklenebilir. Saat dilimini ileri alarak yarını erkenden işaretlemek mümkündür
  (geriye dönük işaretleme ise kapalı).
- Aynı cihazda başka hesapla `register_push_token` çağrılırsa token yeni hesaba geçer (cihaz el
  değiştirince doğru davranış). Çıkışta istemci kendi token satırını silmeli.
- `template_stats` "şu an yapıyor" sayısını sunucu gününe göre (±1 gün) hesaplar.
- Gece yarısı yaz saati geçişi yapan bölgelerde (ör. America/Havana) yılda bir gece 1 saat boyunca
  bir gün ne işaretlenebilir ne kurtarılabilir.
- Saat dilimi değişikliğinden hemen sonra tabanın altında kalan gün birkaç saat Bugün'de görünmez,
  seri motoru onu yeni dilimde kapanana kadar açık sayar; kapanınca normal kurtarma akışı başlar.
- Storage dosya adlarını uygulama üretir (`{uuid}.jpg` gibi; harf, rakam, `.`, `_`, `-`); galeri
  dosya adıyla yükleme reddedilir.
