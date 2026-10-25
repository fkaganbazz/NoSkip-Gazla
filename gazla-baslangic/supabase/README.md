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
| `20261007101000_badges.sql` | rozet kataloğu (12, prod'da da gerekli), `user_badges`, kazanım tetikleyicileri, `my_badges` |
| `20261021100000_find_contacts.sql` | rehberden bul: `app.email_hashes` (auth.users tetikleyicisi), `find_contacts`, günlük arama sınırı |
| `20261021100100_ad_rescue_ssv.sql` | reklamla kurtarma sonucu: `record_ad_rescue_failure` (service role), `ad_rescue_result` (istemci) |
| `20261021100200_push_jobs.sql` | push: `claim_social_push`, `queue_diken_notifications` (Diken kuralları), notifications → `push` tetikleyicisi (pg_net + Vault), pg_cron işleri (`app.install_cron_jobs`) |

Edge Function'lar (`functions/`, Deno; her birinin `deno.json` içe aktarma haritası var):

| Fonksiyon | Ne yapar | JWT |
|---|---|---|
| `admob-ssv` | AdMob ödüllü reklam SSV geri çağrısı: imzayı (ECDSA P-256) doğrular, `grant_ad_rescue` | kapalı (`--no-verify-jwt`; Google çağırır) |
| `delete-account` | Hesabı sil: Storage `proofs/{uid}/`, `avatars/{uid}/`, sonra `auth.admin.deleteUser` | açık (uygulama oturumuyla) |
| `push` | Expo push: arkadaş bildirimleri (notifications INSERT) ve 15 dakikada bir Diken bildirimleri | kapalı (`x-gazla-secret`) |

Testler (`tests/`, pgTAP, 1216 doğrulama):

| Dosya | Kapsam |
|---|---|
| `01_rls_privileges.test.sql` | her tablo için kim ne okur/yazar, sütun yetkileri, fonksiyon yetkileri, Storage |
| `02_streak_engine.test.sql` | yerel gün, tolerans, yaz saati, seriler, kurtarma, bitiş, bahçe |
| `03_social_rpcs.test.sql` | profil, arama, arkadaşlık, engel, şikayet, dürtme, bildirim, push token |
| `04_challenge_rpcs.test.sql` | challenge oluşturma, davet, link, katılma, ayrılma, işaretleme |
| `05_review_fixes.test.sql` | iki inceleme turunda eklenen kurallar (saat dilimi tabanı, ilk gün kurtarma, bitiş ve sıra, şikayet, engel, Diken push, sınırlar, dosya adları, tolerans, hesap silme) |
| `06_screen_data.test.sql` | ekranların verisi: dürtme kotası, kişisel hatırlatma, "Arkadaşlarım" görünürlüğü ve katılma, 0/1/2 saat tolerans, 12 rozetin kuralları, kurtarmadan vazgeçme, sayı istatistikleri, bitti ekranı bir kez, durum/gün no, ortak arkadaş, kısa ad, popülerlik |
| `07_server_jobs.test.sql` | rehberden bul (özet, keşfedilebilirlik, engel, sınırlar), reklamla kurtarma (süre geçmiş, zaten kurtarılmış, aynı ödül, ret sonucu), arkadaş push'u (dürtme tercihi, engel, bir kez), Diken push'u (yerel saat, günde bir, günde 2, sessiz saat, işaretlenmiş gün, token'sız kullanıcı, seri koptu), uzantı yokken iş kurulumu |

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
davranan bir test ortamında doğrulandı (1216/1216; pg_cron, pg_net ve Vault olmadan — o yollar
koşullu). Gerçek Supabase'de ilk `supabase test db`
çalıştırmasında farklılık çıkarsa önce Storage tablolarına doğrudan yazan testlere bakın (Storage
sürümleri `storage.objects` üzerinde ek tetikleyiciler getirebiliyor).

Zaman: tüm `public.*` RPC'leri zamanı `now()` ile, kullanıcıyı `auth.uid()` ile alır; istemci zamanı
ya da kimliği değiştiremez. Aynı mantığın zamanı parametre alan `app.*(…, p_at)` sürümleri testler ve
zamanlanmış işler içindir, API rollerine kapalıdır.

### Tipler (`src/types/database.ts`)

İstemcinin şema tipleri `supabase gen types typescript` çıktısıdır: `Database` (`public` ve
`graphql_public`: Tables / Views / Functions / Enums / CompositeTypes), `Tables<>`, `TablesInsert<>`,
`TablesUpdate<>`, `Enums<>`, `CompositeTypes<>`, `Constants`. `supabaseApi.ts` `createClient<Database>`
kullanır: RPC adı, parametreleri, dönüşü ve tablo sorguları (gömülü ilişkiler dahil) derleyicide
denetlenir. Migration değişince dosyayı yeniden üret:

```bash
# Gerçek projede (Supabase CLI)
supabase gen types typescript --project-id <ref> --schema public,graphql_public > src/types/database.ts
# (yerel Supabase: --local)

# CLI/Docker yoksa: aynı çıktı, psql ile (scripts/gen-db-types.mjs)
DATABASE_URL=postgresql://postgres@127.0.0.1:54329/postgres npm run gen:types
```

- `npm run gen:types` CLI'nin introspection sorgularını `psql` ile çalıştırır, aynı kuralları ve biçimi
  (oxfmt, 80 sütun) uygular; postgres-meta'nın kendi test şemasında CLI çıktısıyla bayt bayt aynı.
  Bağlantı `--db-url`, `DATABASE_URL` ya da `PGHOST`/`PGPORT`/`PGUSER`/`PGDATABASE`. Migration'ları
  uygulanmış herhangi bir PostgreSQL 16 yeter (yukarıdaki test ortamı gibi). `graphql_public` yoksa
  Supabase'teki iskeleti (`graphql_public.graphql`) yazar; `--postgrest-version 13`
  `__InternalSupabase.PostgrestVersion` ekler (CLI'nin uzak projede yazdığı gibi).
- jsonb dönen RPC'lerin (`challenge_detail`, `my_membership`, `set_my_reminder`, `number_stats`,
  `template_stats`, `get_invite_preview`, `friend_profile`) içi şemada görünmez (`Returns: Json`);
  şekilleri `supabaseApi.ts`'teki `*Json` tipleri. `jsonb_build_object` alanı değişince onları da güncelle.
- CLI `returns table (…)` sütunlarını null'suz yazar (PostgreSQL fonksiyon sonucunun null olabilirliğini
  bildirmez); `my_today.value` gibi alanlar null gelebilir, istemci buna hazır. Üretilmiş
  `challenges.end_date` da null olabilir görünür ama olmaz.
- SQL fonksiyon parametreleri NULL alır; üretilen `Args` bunu yazmaz. `supabaseApi`'nin `rpc()`
  sarmalayıcısı her parametreye `null` da kabul eder (verilmeyen parametre varsayılanını alır).

## Sunucudaki kurallar

### Yerel gün ve tolerans
- Her kullanıcının saat dilimi `user_settings.timezone` (varsayılan `Europe/Istanbul`).
- Gün `d`, ertesi günün yerel gece yarısından **kullanıcının toleransı kadar** sonra kapanır
  (`app.day_closes_at`). Tolerans Ayarlar'daki "Gün bitişi toleransı":
  `user_settings.day_end_grace_hours` 0, 1 ya da 2 saat (varsayılan 2; `app.user_grace_period`).
  Süre geçen zamanla ölçülür; yaz saati gecelerinde de tam tolerans kadardır. Saatin gece
  yarısının üstünden geri alındığı bölgelerde gün ilk 00:00'da başlar (`app.local_day_start`).
- İşaretlenebilen günler `app.open_dates`: bugün, gün kapanmadıysa dün. Yarın işaretlenemez.
  `my_today` her işaretlenebilen gün için satır döner: gece yarısından sonraki tolerans süresinde
  dünün görevleri de (`local_date` = dün) listelenir; istemci işaretlerken `p_local_date` gönderir.
  Tolerans seri motorunda, kurtarma penceresinde (kapanıştan 24 saat), challenge bitişinde ve
  dürtmenin challenge bağlamında da aynıdır.
- Saat dilimi ya da tolerans değişince eski ayarla kapanmış günler yeniden açılmaz
  (`user_settings.checkin_floor`; toleransı 0'dan 2'ye çekip dünü geriye dönük işaretlemek yok).
  Tabanın altındaki gün her yerde kapanmış sayılır (`app.checkin_dates`): işaretlenemez, Bugün'de
  listelenmez, kapsanmadıysa seriyi bozar ve kurtarması hemen açılır. Katılma günü de en erken taban.

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
- Vazgeçme ("Baştan başla"): `public.decline_rescue` bekleyen kurtarmayı kapatır
  (`app.rescue_declines`). Gün kurtarılmadan kalır, seri sıfırdan devam eder; `my_pending_rescues`
  onu döndürmez, Diken solgun olmaktan çıkar, sonradan kurtarılamaz, challenge bitişi onu beklemez.

### Challenge bitişi
- Üyenin sonucu (`final_days_done`, `final_required_days`, `final_rescues`, `final_rank`), son gün
  **her aktif üyenin** saat diliminde kapandıktan ve o challenge için kimsenin bekleyen kurtarması
  kalmadıktan sonra kaydedilir. Böylece son günü kurtaran da sonuca girer ve sıralar tutarlıdır.
- Kendi tüm günlerini kapsayan üye bitirmiş sayılır: bahçeye kaktüs eklenir, arkadaşlarına bildirim
  gider (bildirimde kendi gün sayısı). Sonradan katılanın günleri katıldığı günden sayılır. Son
  aktif üye sonuçlanınca sıralar kayıtlı sonuçlardan yeniden yazılır (aynı sırayı iki kişi almaz).
- Kayıt ya kullanıcı Bugün'ü açınca (`my_today`, `my_unseen_finished`), ya da saatlik işle
  (`finish_due_challenges`) olur.
- "Challenge bitti" ekranı Bugün açılışında bir kez: `my_unseen_finished` sonucu kaydedilmiş ama
  gösterilmemiş üyelikleri döner (`completed` = kendi tüm günlerini kapsadı); ekran gösterince
  `mark_finish_seen` (`challenge_members.finish_seen_at`). Sunucuda tutulduğu için cihaz değişse
  de tekrar gösterilmez.
- Durum ve gün numarası sunucudan (`challenge_detail`): `status` 'upcoming' (başlamadı) / 'active'
  (sürüyor; son gün toleransta hâlâ işaretlenebiliyorsa da) / 'finished' (işaretlenebilecek gün
  kalmadı ya da sonuç kaydedildi); `day_index` kullanıcının gününe göre 0 (başlamadı) … süre.

### Challenge ve üyelik
- Hazır süreler 7/10/30; şablonsuz challenge 3–60 gün. Başlangıç bugün ile 7 gün sonrası arası.
- Şablonun izin verdiği süreler `challenge_templates.allowed_durations` (7/10/30'un artan alt kümesi,
  varsayılan süreyi içerir); `create_challenge` şablonla gelen süreyi buna göre doğrular
  ("Bu challenge için bu süre seçilemez"). ChallengePreview süre seçicisi yalnızca bunları gösterir.
- Bahçe (`my_garden`): `longest_streak` challenge'daki en uzun ardışık kapsanan gün dizisi
  (`app.longest_covered_run`; kurtarılan günler dahil), `is_longest` bahçedeki en uzun seri olan tek bitki
  (eşitlikte en az kurtarma, sonra en yeni) → çiçek + gözlük (EKRANLAR 5.1).
- Grupta en çok 20 aktif üye; bir kullanıcı aynı anda en çok 20 süren challenge'da.
- Davet yalnızca arkadaşa. Reddedilen davet aynı gün en çok 3 kez tekrarlanır. Davet linki her
  üyenin challenge başına bir kodu; challenge sahibi herhangi bir üyenin linkini kapatabilir.
- Görünürlük (Create "Kimler görebilir"): `challenges.visibility` 'invited' (Davetliler,
  varsayılan) ya da 'friends' (Arkadaşlarım). 'friends' challenge'ı oluşturanın arkadaşları okur
  (RLS; oluşturan hâlâ aktif üyeyse), `friend_profile.joinable_challenges`'ta görür ve
  `join_friend_challenge` ile davetsiz katılır. Linkle katılmanın kuralları geçerli: bitmemiş,
  ayrılan geri dönemez, grup en çok 20, kullanıcı en çok 20 süren challenge. Grup listesi,
  işaretlemeler ve kanıtlar yine yalnızca üyelere açık. Görünürlük sonradan değiştirilemez.
- Kişisel hatırlatma saati (Detail "Hatırlatma saatini değiştir"): `set_my_reminder`
  (`challenge_members.reminder_time`, null = grubun saati). Etkin saat `app.member_reminder_time`.
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
- Poke sayfası kalan hakkı `poke_status(p_recipient)` ile okur: `sent_today`, `daily_limit`,
  `remaining`, `harsh_mode` (send_poke ile aynı sayım). Dürtülemeyecek kişi (arkadaş ya da süren
  ortak challenge yok, engel var) için send_poke'la aynı hata ("Bu kişiyi dürtemezsin").
- Mesaj id'leri ve metinleri istemcide `src/content/pokes.ts` ile aynı (karo listesi oradan;
  sunucu id'yi doğrular). Aktivite "Tebrik et" doğrudan `proud_of_you` gaz mesajını gönderir.

### Rozetler (Bahçem "Rozetler n / 12")
- Katalog `badges` (12; ad, açıklama, ikon ve renk anahtarı), kazanılanlar `user_badges`
  (yalnızca sahibi okur; istemci yazamaz). `my_badges` tüm rozetleri katalog sırasıyla ve
  kazanıldıysa `earned_at` ile döner. Kurallar sunucuda, olay anında (tetikleyiciler); kazanılan
  rozet geri alınmaz. Eşikler `app.badge_goal`.

| Sıra | Anahtar | Ad | Kural | Olay |
|---|---|---|---|---|
| 1 | `ilk_30_gun` | İlk 30 gün | genel seri 30 | işaretleme, kurtarma |
| 2 | `laf_ustasi` | Laf ustası | 10 laf sokma gönderdi (geri alınan sayılmaz) | dürtme |
| 3 | `erkenci` | Erkenci | 5 farklı gün kendi gününü yerel 05:00–08:00 arasında işaretledi | işaretleme |
| 4 | `yuz_gun` | Yüz gün | genel seri 100 | işaretleme, kurtarma |
| 5 | `maratoncu` | Maratoncu | en az 30 günü kapsanarak bitirilen 3 challenge | sonuç kaydı |
| 6 | `bahcivan` | Bahçıvan | tüm günleri kapsanarak bitirilen 10 challenge (bahçede 10 kaktüs) | sonuç kaydı |
| 7 | `sampiyon` | Şampiyon | en az 3 kişilik grupta, tüm günlerini kapsayarak birinci (son sıralamayla aynı düzen) | grubun son sonucu |
| 8 | `gaz_pedali` | Gaz pedalı | 25 gaz verme gönderdi | dürtme |
| 9 | `son_dakika` | Son dakika | seriyi kurtarma penceresinin son saatinde kurtardı | kurtarma |
| 10 | `gece_kusu` | Gece kuşu | dünün görevini gece yarısından sonra, toleransta işaretledi | işaretleme |
| 11 | `sosyal_kaktus` | Sosyal kaktüs | 10 kabul edilmiş arkadaş | arkadaşlık kabulü |
| 12 | `objektif` | Objektif | 30 fotoğraf kanıtlı işaretleme | işaretleme |

### Diken bildirimleri
- Günde en çok 2 (gönderim anının yerel gününe göre), sessiz saatler 23:30–08:00 (kullanıcının
  yerel saati). Kural `public.claim_diken_push` içinde ve atomik.
- Ne zaman (`app.queue_diken_notifications`, kullanıcının yerel saatinde; her biri günde bir kez,
  hedef saatten sonraki 1 saat içinde; push token'ı olmayana hiç):
  | Tür | Saat | Koşul | Metin (Notifications.dc.html) |
  |---|---|---|---|
  | `daily_reminder` | `user_settings.daily_reminder_time` (null = kapalı) | bugün bekleyen görev var | "Su yok mu su? Bugünkü görevlerin seni bekliyor." |
  | `daily_reminder` + `challenge_id` | `app.member_reminder_time` (kişisel, yoksa grubun saati) | o challenge bugün işaretlenmedi; saat genel hatırlatmayla aynı değil | "Su yok mu su? {kısa ad} seni bekliyor." |
  | `day_ending` | 22:00 ("gün bitimine 2 saat kala") | bekleyen görev var | "Gün bitiyor, {n} görevin duruyor. Susuz kaldım burada." |
  | `streak_broken` | 09:00 ("ertesi sabah") | bekleyen kurtarma var | "Dün kaçtı. Beni sulamak için 24 saatin var." |
- Hakkı alınamayan (sessiz saat, günün 2 hakkı doldu) Diken bildirimi için satır eklenmez; satır
  eklenirse metni `payload.text`'te, uygulama içi yolu `payload.url`'de durur (Aktivite aynı metni
  gösterir). Haftalık özet ("Haftan", Pazar 19:00) henüz yok.

### Arkadaş bildirimleri (push)
- Dürtme, gaz, arkadaşlık isteği, challenge daveti, arkadaşın bitirdi: satırı mevcut tetikleyiciler
  ekler (`actor_id` dolu), `push` Edge Function'ı `claim_social_push` ile gönderim hakkını alır. Alıcı
  dürtme bildirimlerini kapattıysa (`poke_push_enabled`) dürtme push'u gitmez; engel varsa hiçbiri.
  Aynı satır bir kez gönderilir (`pushed_at`). Diken sınırına sayılmaz.
- Metinler: "{ad} sana gaz verdi" / "{ad} sana laf soktu" + dürtme metni tırnak içinde; "{ad}
  bitirdi" + "{challenge} tamam. Tebrik etmek ister misin?"; "{ad} arkadaşlık isteği gönderdi"; "{ad}
  seni bir challenge'a ekledi" + challenge adı.
- Android kanalı (`channelId`, src/notifications/channels.ts): Diken `diken`; arkadaş bildirimleri
  `friends`; diğerleri `default`. `data.url`: Diken `/`, `/challenge/<id>`, `/streak-lost/<challenge_id>`
  (ilk bekleyen kurtarma, en uzun seri önce; ekran sıradakilere kendisi geçer; eski `/streak-lost`
  uygulamada Bugün'e eşlenir); dürtme `/poke/<gönderen>` (geri dürt), istek `/friends`, davet ve bitirdi
  `/activity`.
- Expo `DeviceNotRegistered` dönen token `push_tokens`'tan silinir. Uygulama çıkışta kendi token'ını
  siler (`push_tokens` owner delete).

### Rehberden bul
- İstemci rehberdeki e-postaları kırpıp küçük harfe çevirir, SHA-256 özetlerini (hex) gönderir;
  e-postanın kendisi gitmez (`src/data/contactHash.ts`). Sunucu `auth.users.email`'in aynı özetini
  `app.email_hashes`'te tutar (auth.users tetikleyicisi; e-posta değişince güncellenir).
- `find_contacts(p_email_hashes)`: yalnızca profili olan ve "Beni herkes bulabilir" diyen kullanıcılar;
  iki yönde engel ve kendisi hariç. En çok 500 özet, en çok 100 sonuç (arkadaş olmayanlar önce), günde
  en çok 20 arama (boş arama sayılmaz). Sonuç `search_profiles` ile aynı alanlar (ortak arkadaş dahil).

### Reklamla kurtarma (AdMob SSV)
- Uygulama rewarded reklamı `serverSideVerificationOptions: { userId, customData: '{"challengeId","missedDate"}' }`
  ile gösterir (`adRescueSsvOptions`). Google ödülü `admob-ssv`'ye bildirir; imza doğrulanınca
  `grant_ad_rescue` (kurallar yukarıda, "Kurtarma"). Kural reddederse (süre geçti, gün zaten
  kurtarıldı, ödül kullanıldı) sebep `app.ad_rescue_failures`'a yazılır.
- Uygulama reklam kapanınca `ad_rescue_result(challenge, gün)` sorar: 'granted', 'pending' (istemci
  artan aralıklarla ~30 sn yeniden sorar) ya da son 10 dakikadaki reddin hatası.
- `user_id` ve `custom_data`'yı istemci verir, Google yalnızca imzalar: ödül bir kez ve yalnızca kurtarma
  kurallarına uyan bir gün için kullanılabilir.

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
  ortak üyeye; bekleyen istek yalnızca profil satırını gösterir. Katılınabilir challenge'lar
  (`joinable_challenges`) yalnızca arkadaşa.
- Kişisel hatırlatma saati ve "bitti ekranı görüldü" (`challenge_members.reminder_time`,
  `finish_seen_at`) grup listesinde okunmaz (sütun yetkisi); sahibi `my_membership` ile okur.
- Kazanılan rozetler yalnızca sahibine.
- Davet önizlemesi challenge id'sini yalnızca oturum açmış kullanıcıya verir (oturumsuz önizleme
  kimlik sızdırmaz).
- Ortak arkadaş sayısı (`friend_requests`, `search_profiles`) yalnızca sayı; kimler olduğu
  gösterilmez.
- Doğum yılı, saat dilimi ve bildirim tercihleri yalnızca sahibinde (`user_settings`).
- İşaretleme ve kanıt fotoğrafı: kendisi ve aynı challenge'ın aktif üyeleri (engel yoksa). Grup
  yalnızca bir işaretlemeye bağlı fotoğrafı görür. Kapanmış günün fotoğrafı değiştirilemez.
- Kurtarma yöntemi (reklam/ücretsiz) kişiseldir; grup yalnızca seriyi görür.
- Davet kodu yalnızca linkin sahibine görünür (`challenge_invites`).

### Yetkiler
- Fonksiyonlar varsayılan olarak kapalıdır. `app.*` fonksiyonlarını yalnızca `service_role`
  çalıştırır; `authenticated` yalnızca RLS politikalarının çağırdığı yardımcıları çalıştırabilir.
  `anon` yalnızca `diken_stage_for`, `get_invite_preview`, `template_stats`, `template_popularity`.
- API rollerinde TRUNCATE, TRIGGER, REFERENCES yok (TRUNCATE RLS'i atlar).
- RLS politikaları `app.my_challenge_ids()` / `app.my_related_user_ids()` ön süzgeciyle dizin
  kullanır; satır başına pahalı kontrol yalnızca ilgili satırlarda çalışır.

## İstemci RPC'leri

| Ekran | RPC / tablo |
|---|---|
| Profile (onboarding) | `is_username_available`, `complete_profile` (13 yaş altı nötr mesajla reddedilir: "Şu an hesabını oluşturamıyoruz.") |
| Settings | `user_settings` (update; `day_end_grace_hours` 0/1/2 dahil), `profiles` (update), `blocks` |
| Today | `my_today`, `my_streak`, `checkin`, `undo_checkin`, `friends_today`, `my_unseen_finished` → Finished, `notifications` (okunmamış sayısı) |
| Completion | `my_streak`, `my_recent_days` |
| NumberEntry | `my_today` (`target`, `number_unit`), `number_stats` (dün, en iyin, grupta en iyi), `checkin(p_value)` |
| PhotoProof | Storage `proofs/{uid}/{challenge}/{uuid}.jpg` yükle, sonra `checkin(p_photo_path)` |
| StreakLost | `my_pending_rescues`, `rescue_streak` (ücretsiz), reklam → sunucu `grant_ad_rescue`, "Baştan başla" → `decline_rescue` |
| Detail | `challenge_detail` (durum, gün no), `my_membership`, `challenge_board`, `set_my_reminder` |
| Create / PickChallenge | `challenge_templates`, `create_challenge(p_visibility)`, `invite_to_challenge` |
| InviteFriends | `search_profiles`, `send_friend_request`, `create_invite`, `revoke_invite` |
| InviteLanding | `get_invite_preview` (anon; oturum varsa `challenge_id`), `join_challenge_by_invite`, şikayet: `submit_report(p_target => 'challenge', p_invite_code)` |
| Explore / ChallengePreview | `challenge_templates`, `template_popularity`, `template_stats` |
| Friends | `friends_today`, `friend_requests` (ortak arkadaş), `accept_friend_request`, `send_friend_request`, `search_profiles` |
| FriendProfile | `friend_profile` (+ `joinable_challenges`), `join_friend_challenge` |
| Poke | sabit liste `src/content/pokes.ts`, `poke_status`, `send_poke`, `pokes` (delete = geri al) |
| Activity | `notifications` (30'ar sayfa), `mark_notifications_read`, `pokes`; "Tebrik et" → `send_poke('hype', 'proud_of_you')` |
| Garden / Finished | `my_garden`, `my_streak`, `my_badges`, `my_unseen_finished`, `mark_finish_seen` |
| Report | `submit_report` |
| Bildirimler | `register_push_token`, `push_tokens` (delete = çıkış; cihazın token'ı) |
| Rehberden bul (InviteFriends, Friends) | `find_contacts` (e-posta SHA-256 özetleri) |
| StreakLost reklam | AdMob SSV → `admob-ssv` → `grant_ad_rescue`; uygulama `ad_rescue_result` |
| DeleteAccount | Edge Function `delete-account` |

## Sunucu tarafı işler (Edge Function / pg_cron)

| İş | Nasıl |
|---|---|
| Challenge bitişi | pg_cron `gazla-finish-due-challenges` saatlik (`7 * * * *`): `select public.finish_due_challenges()` |
| Diken bildirimleri | pg_cron `gazla-diken-push` 15 dakikada bir: pg_net → `push` (`{"mode":"schedule"}`) → `queue_diken_notifications()` → Expo |
| Arkadaş bildirimleri | `notifications` INSERT tetikleyicisi `notifications_push_webhook` (actor_id dolu): pg_net → `push` (Database Webhook gövdesi) → `claim_social_push` → Expo |
| Reklamla kurtarma | AdMob SSV → `admob-ssv` → `grant_ad_rescue` / `record_ad_rescue_failure` |
| Hesap silme | Uygulama → `delete-account` (JWT) → Storage dosyaları + `auth.admin.deleteUser`; veritabanı zincirleme temizlenir |
| Şikayet incelemesi | Ekip `reports`'u service role ile okur (`reports_pending_idx`, `review_due_at`); karar `status` ve `reviewed_at` |

### Kurulum (bir kez, Supabase projesinde)

1. **Migration'lar**: `supabase link --project-ref <ref>` sonra `supabase db push`.
2. **Uzantılar** (Dashboard → Database → Extensions): `pg_cron` ve `pg_net`'i aç (Vault Supabase'te hazır).
   Migration'dan sonra açtıysan SQL Editor'de `select app.install_cron_jobs();` çalıştır (aynı adla
   tekrar çalıştırmak işleri günceller; dönen dizi kurulan işlerin adları).
3. **Sırlar**: bir push sırrı üret (`openssl rand -hex 32`) ve
   ```sql
   select vault.create_secret('https://<ref>.supabase.co', 'gazla_project_url');
   select vault.create_secret('<push-sırrı>', 'gazla_push_secret');
   ```
   ```bash
   supabase secrets set PUSH_WEBHOOK_SECRET=<push-sırrı>
   supabase secrets set EXPO_ACCESS_TOKEN=<expo erişim belirteci>   # yalnızca Expo'da "push security" açıksa
   ```
   `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` Edge Function'lara Supabase tarafından verilir.
4. **Edge Function'lar**:
   ```bash
   supabase functions deploy delete-account
   supabase functions deploy admob-ssv --no-verify-jwt
   supabase functions deploy push --no-verify-jwt
   ```
   (`supabase init` ile `config.toml` oluşturduysan `[functions.admob-ssv]` ve `[functions.push]`
   altına `verify_jwt = false` yaz; yerelde `supabase functions serve` de aynı ayarı kullanır.)
5. **Arkadaş bildirimleri (webhook)**: migration'daki `notifications_push_webhook` tetikleyicisi pg_net
   ve 3. adımdaki Vault sırlarıyla kendiliğinden çalışır; ayrıca panelden Database Webhook kurma.
   (Panelden kurmak istersen tetikleyiciyi sil: Database → Webhooks → notifications, INSERT, HTTP POST
   `https://<ref>.supabase.co/functions/v1/push`, başlık `x-gazla-secret: <push-sırrı>`. Gövde biçimi
   aynıdır; iki yol birden kurulsa da `pushed_at` sayesinde bildirim bir kez gider.)
6. **AdMob SSV**: AdMob → Uygulamalar → Reklam birimleri → rewarded birim → "Sunucu tarafı doğrulama"
   → URL `https://<ref>.supabase.co/functions/v1/admob-ssv` → "Doğrula" (test isteği 200 döner).
7. **Kontrol**: `select jobname, schedule from cron.job;` iki iş; `select * from net._http_response order by created desc limit 5;`
   push çağrılarının durum kodları; Edge Function günlükleri Dashboard → Edge Functions → Logs.

Yerel geliştirmede (pg_cron/pg_net yokken) tetikleyici ve iş kurulumu sessizce atlanır; push'u elle
denemek için: `curl -X POST http://127.0.0.1:54321/functions/v1/push -H "x-gazla-secret: …" -d '{"mode":"schedule"}'`.

### Kimlik sağlayıcıları (Supabase Auth)
- **Apple**: Auth → Providers → Apple: "Client IDs" alanına bundle id (`app.gazla`; tarayıcı akışı
  için Services ID de). iOS'ta native giriş (expo-apple-authentication + `signInWithIdToken`, nonce)
  ek anahtar istemez; Android/web tarayıcı akışı Apple Services ID + gizli anahtar ister.
- **Google**: Auth → Providers → Google: "Client IDs" alanına web ve iOS istemci kimlikleri (virgülle),
  gizli anahtar web istemcisinin. iOS SDK'sının kimlik belirteci nonce taşıdığı için "Skip nonce check"
  açık olmalı. Uygulama tarafı: `.env` `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
- Dönüş adresleri (tarayıcı akışı, e-posta bağlantısı): `gazla://auth/callback` ve web adresi
  (`<site>/auth/callback`) Auth → URL Configuration → Redirect URLs'e eklenir. Akış PKCE: bağlantı, istendiği
  cihazda açılmalı.
- **E-posta**: Auth → SMTP Settings'e kendi gönderim servisin (Resend, Postmark …). Yerleşik servis yalnızca
  proje ekibinin adreslerine ve saatte birkaç e-posta gönderir. Şablonlar (Magic Link, Confirm signup) Auth →
  Email Templates; bağlantı `{{ .ConfirmationURL }}`.

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
19. Rozetler: tasarımda adı, ikonu ve rengi olan yalnızca 3 rozet var (İlk 30 gün, Laf ustası,
    Erkenci); diğer 9'u ve tüm eşikler (yukarıdaki tablo) ürün kararıdır. Rozetler olay anında
    verilir, geriye dönük taranmaz; kazanılan rozet geri alınmaz. Renk yalnızca tasarımdaki üç renk.
20. Tolerans değişikliği saat dilimi değişikliği gibi tabanı (`checkin_floor`) yükseltir.
21. "Arkadaşlarım" görünürlüğünde yalnızca oluşturanın arkadaşları görür ve katılır (diğer üyelerin
    arkadaşları değil); oluşturan ayrılınca challenge arkadaşlarına kapanır.
22. "Challenge bitti" ekranı eksik bitirilen challenge için de bir kez döner (`completed = false`);
    ekran mesajı seçer.
23. NumberEntry "En iyin" girilen gün hariç (önceki rekorla kıyas); "Grupta en iyi" kullanıcı dahil,
    engelli ve ayrılmış üyeler hariç, eşitlikte önce giren.
24. Rehberden bul: çağrı başına en çok 500 özet, en çok 100 sonuç, günde 20 arama; keşfedilemez
    ("Beni kimse bulamasın") kullanıcı rehberden de bulunmaz (ilişki olsa bile).
25. Diken saatleri: "gün bitiyor" 22:00, "seri koptu" 09:00 (yerel); her biri hedef saatten sonraki 1
    saat içinde gönderilir, sonra o gün düşer. Challenge hatırlatması genel hatırlatmayla aynı saatteyse
    yalnızca genel olan gider. Gönderilmeyen Diken bildirimi Aktivite'ye de yazılmaz.
26. Arkadaş push'u satır eklenir eklenmez gider (dürtmenin 30 sn geri alma süresi beklenmez; README
    "Dürtme": bildirim çoktan gitti).
27. Reklam ödülü reddi 10 dakika gösterilir; sonraki reklam yeni deneme sayılır.

## Açık sorular

- **Rozetler**: tasarımda olmayan 9 rozetin adları, ikonları (trophy, moon çizilmedi) ve eşikleri
  ürün onayı bekliyor (Kararlar 19).
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
  değiştirince doğru davranış). Çıkışta istemci kendi token satırını siler (çevrimdışıysa silinemez;
  sonraki girişte token yeni hesaba geçer).
- Expo push makbuzları (receipt) okunmuyor: yalnızca gönderim anındaki `DeviceNotRegistered` token'ı siler.
- AdMob SSV'de `user_id`'yi istemci verir: biri reklamı izleyip başka bir kullanıcının kurtarılabilir
  gününü kurtarabilir (yalnızca o kullanıcının lehine; ödül bir kez).
- `template_stats` "şu an yapıyor" sayısını sunucu gününe göre (±1 gün) hesaplar.
- Storage dosya adlarını uygulama üretir (`{uuid}.jpg` gibi; harf, rakam, `.`, `_`, `-`); galeri
  dosya adıyla yükleme reddedilir.

## Ekranların beklediği, henüz olmayanlar
Ekranlar mevcut veriyle çalışıyor; aşağıdakiler eklendiğinde tasarımın tamamı gösterilebilir.
- **Reklam izni:** UMP/ATT sonucunu saklayacak alan (`user_settings`). (Ön ekranın bir kez gösterilmesi istemcide: `src/data/flags.ts` `adConsentShown`.)
- **Challenge oluşturma:** `create_challenge`'a özel challenge için `icon`, `tint`, sayı `step` parametreleri.
- **Bahçe:** bitki ifadesi (aksesuar: bant süreden, gözlük `is_longest`ten).
- **Keşfet:** şablon derin bağlantısı.
- **Bildirim tercihleri:** "arkadaşın bitirdi", haftalık özet, seri koptu için ayrı anahtarlar; tema tercihi; doğum yılını güncelleme.
- **Bildirimler:** haftalık özet ("Haftan", Pazar 19:00) zamanlayıcısı; Expo push makbuzlarının okunması.
- **İçerik:** Kullanım Koşulları, Gizlilik, KVKK, destek adresleri.
