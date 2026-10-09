# Gazla (TR) / NoSkip (Global) — mobil challenge uygulaması

Arkadaşlarla 7/10/30 günlük challenge. Maskot: Diken (kaktüs). Gelir: rewarded reklam (seri kurtarma) + Keşfet'te banner. v1.0'da abonelik yok.

## Yığın
- Expo (React Native) + TypeScript, Expo Router, development build (Expo Go değil; AdMob gerektiriyor)
- Supabase: Auth (Apple, Google, e-posta), Postgres + RLS, Storage (fotoğraf kanıtı), Edge Functions
- TanStack Query; çevrimdışı işaretleme kuyruğu MMKV'de
- expo-notifications, react-native-google-mobile-ads (+ UMP izin formu, iOS ATT)
- react-native-svg (Diken), Sentry
- Dil: Türkçe varsayılan, İngilizce ikinci dil (i18n baştan kurulacak)

## Tasarım kaynağı
`design/` klasöründeki `*.dc.html` dosyaları tek doğru kaynaktır. Her dosya bir ekran; inline style'lar React Native style'larına birebir çevrilir.
- `Diken.dc.html`: maskot bileşeni. Prop'lar: `mood` (mutlu, selam, laf, cosku, gurur, endise, saskin, uykulu, solgun), `stage` (filiz, genc, tam, cicek), `gear` (yok, bant, gozluk), `size`. viewBox 240×300. Görünürlük `display` ile yönetiliyor; RN'de koşullu render'a çevir.
- `TabBar.dc.html`: alt menü (Bugün, Keşfet, ortada + butonu, Arkadaşlar, Bahçem), açık/koyu.
- `Tokens.dc.html`, `Components.dc.html`: renk, yazı, buton ve kart kuralları.
- Ekran → route eşlemesi aşağıda.

## Tema kuralları
- Renkler: aksiyon yeşili `#1F7A45` (beyaz metin), Diken yeşili `#3BAE6A`, gece moru `#24163F` (ana metin), `#3F3358` gövde, `#5B4A7A` ikincil, turuncu `#FF5A1F` (üstünde metin hep gece moru), sarı `#FFC83D`, hata `#B42318`, zemin `#FFF8F2`, kart `#FFFFFF`, çizgi `#EFE6DC`.
- Koyu mod: zemin `#150E26`, yüzey `#211538`, çizgi `#33264F`, ikincil metin `#B7AACF`, aksiyon `#3BAE6A` üstünde koyu metin.
- Fontlar: başlıklar Baloo 2 800, metin Nunito 600/700/800 (expo-google-fonts).
- Butonlar: yükseklik 56, köşe 18, altta 4 px gölge (ana: `#165C34`). Kart köşesi 22, alt sayfa 28, çipler tam yuvarlak.
- Kenar boşluğu 20. Dokunma alanı en az 44. Emoji kullanma; ikonlar çizgi SVG.
- Diken her ekranda değil: Bugün, tamamlama anı, seri koptu, boş durum, izin ekranları.

## İş kuralları
- Gün, kullanıcının saat dilimine göre `local_date` ile kaydedilir; gece yarısından sonra 2 saat tolerans.
- Seri hesabı sunucuda (SQL fonksiyonu), istemcide değil.
- Seri koptuğunda 24 saat kurtarma süresi: rewarded reklam veya ayda 1 ücretsiz hak. Reklam yüklenmezse ücretsiz hak önerilir.
- Dürt mesajları hazır listeden seçilir, serbest metin yok. "Laf sok" sadece alıcının sert modu açıksa.
- Diken bildirimleri günde en fazla 2; sessiz saatler 23:30–08:00; kural sunucuda.
- Engelleme, şikayet (24 saat inceleme), uygulama içinden hesap silme zorunlu.
- Günlük işaretleme akışında asla reklam yok.

## Veri modeli
profiles, friendships, blocks, reports, challenge_templates, challenges, challenge_members, checkins (user_id, challenge_id, local_date, value, photo_path), pokes, streak_rescues. Tüm tablolarda RLS.

## Ekran → route
- Onboarding: Main (karşılama), PickChallenge, SignIn, Profile, InviteFriends, NotifPermission → `app/(onboarding)/`
- Sekmeler: Today, Explore, Friends, Garden → `app/(tabs)/`; Create modal
- Diğer: Completion, NumberEntry (sheet), PhotoProof, Detail, Finished, ShareCard, EmptyToday (Today'in boş hali), Poke (sheet), Activity, FriendProfile, Report, InviteLanding (deep link), ChallengePreview, Settings, DeleteAccount, StreakLost, AdConsent
- Koyu mod referansı: TodayDark, DetailDark

## Çalışma şekli
- Her seferinde tek ekran veya tek özellik. Bitince simülatörde kontrol edilecek.
- Önce mock veriyle UI, sonra Supabase bağlantısı.
- Yeni renk/ölçü uydurma; `src/theme` dışından sabit değer yazma.

## Kurulum ve komutlar
- Expo SDK 57, route'lar kökteki `app/` altında (`src/app` açma; açılırsa Expo Router onu kök sayar). Diğer kod `src/`, import kısayolu `@/` → `src/`.
- Uygulama sekmelerle açılır: `app/(tabs)/` (Bugün `index`, Keşfet `explore`, Arkadaşlar `friends`, Bahçem `garden`); ortadaki + `app/create.tsx`'i tam ekran modal açar. Alt menü `src/components/TabBar.tsx` (TabBar.dc.html), `Tabs` `expo-router/js-tabs`'tan.
- Geliştirme ekranları `app/dev/` (token önizleme, Diken). Geliştirme sürümünde henüz yer tutucu olan sekmelerdeki (Keşfet, Arkadaşlar, Bahçem) "Geliştirme ekranları" bağlantısıyla açılır.
- Klasörler: `src/components` (ortak bileşenler, `icons`), `src/features/<ekran>` (ekrana özel bileşenler, mantık, tipler; ör. `src/features/today`), `src/mocks` (Supabase gelene kadar örnek veri), `src/theme`.
- `npm run android` / `npm run ios`: development build'i derleyip kurar (`expo run:*`). Sonraki açılışlarda `npm start` (dev client).
- Bulut derleme: `npx eas-cli build --profile development` (iOS simülatör için `development-simulator`).
- Paket eklerken `npx expo install <paket>` kullan. Bitirmeden önce `npm run typecheck`.

## Tema kullanımı
- `import { useTheme, typography, spacing, radius, layout, borderWidth, iconMetrics, palette } from '@/theme'`.
- Renk: `useTheme().colors` (açık/koyu anlamsal roller). Koyu karşılığı tasarlanmamış renkler sadece `palette`te. Bileşene/ekrana özel token'lar: `dikenColors` (maskot), `tabBarColors[scheme]`/`tabBarMetrics` (alt menü), `todayColors[scheme]`/`todayMetrics`/`todayTypography` (Bugün). Veriye bağlı avatar ve challenge renkleri: `avatarTints`, `challengeTints` (açık/koyu).
- Yazı: `typography.display | title1 | screenTitle | title2 | sectionTitle | cardTitle | body | caption | captionStrong | chip | meta | metaStrong | smallStrong | micro | tabLabel | tabLabelActive | label`. Ağırlık `fontFamily` ile seçilir, `fontWeight` yazma.
- Kutu modeli: tasarımda `box-sizing` yazmayan kenarlı öğeler content-box'tır; RN ölçüsü kenarı içerir (dış ölçü = iç + 2 × kenar).
- Ekran üstü: içerik güvenli alanın `layout.screenTopGap` (9) altından başlar (tasarımdaki 56 px üst boşluk).
- Tok buton gölgesi (`box-shadow: 0 Ypx 0`): `src/components/FlatShadow` (`flatShadowStyle` + `FlatShadowUnderlay`; Android 9 altında View ile çizer).
- İkonlar: `src/components/icons` (çizgi SVG; boyut ve çizgi kalınlığı tema token'larından).
- `Link asChild` + `Pressable` stil fonksiyonu birlikte kullanma (Slot stil fonksiyonunu düşürüyor); `router.push`/`navigate` kullan.

## Supabase
- Şema `supabase/migrations/` (10 dosya), testler `supabase/tests/` (pgTAP). Ayrıntı, kararlar ve açık sorular: `supabase/README.md`.
- Migration'lar yayımlanmadan önce yerinde düzenlenebilir; yayımlandıktan sonra her değişiklik yeni migration.
- İstemci tablolara yalnızca politikası olan yerlerde doğrudan yazar (profil/ayar güncelleme, engel, arkadaşlık silme, dürtme geri alma, bildirim token'ı silme). Diğer her şey `public.*` RPC'leri: `checkin`, `send_poke`, `create_challenge`, `submit_report` …
- Seri, gün numarası, hedef, sıra ve kurtarma hakkı sunucudan okunur (`my_today`, `my_streak`, `my_pending_rescues`, `challenge_board`, `friends_today`, `my_garden`); istemcide yeniden hesaplanmaz.
- Yerel gün kullanıcının `user_settings.timezone`'una göre; istemci saat dilimini cihazdan alıp değişince günceller. `checkin`'e tarih verilmezse bugün; tolerans içinde dün için `p_local_date`.
- `my_today` işaretlenebilen her gün için satır döner (gece 00:00–02:00 arası dün de, `local_date` ile); işaretlerken `p_local_date` gönder.
- Fotoğraf kanıtı: önce Storage `proofs/{uid}/{challenge_id}/{uuid}.jpg`, sonra `checkin(p_photo_path)`. Profil fotoğrafı `avatars/{uid}/{uuid}.jpg`. Dosya adını uygulama üretir (harf, rakam, `.`, `_`, `-`); bir dosya yalnızca bir günün kanıtıdır.
- Yeni fonksiyon eklerken: `app.*` varsayılan olarak yalnızca service_role'e açıktır; RLS politikası çağıracaksa `authenticated`'a, istemci RPC'siyse `public` altında açıkça `grant execute` yaz ve `01_rls_privileges` allow-list'ini güncelle.
- Test: `supabase test db` (pgTAP + basejump supabase_test_helpers).
