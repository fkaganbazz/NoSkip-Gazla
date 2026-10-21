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
- Gün, kullanıcının saat dilimine göre `local_date` ile kaydedilir; gece yarısından sonra tolerans kullanıcı ayarı (0/1/2 saat, varsayılan 2; `user_settings.day_end_grace_hours`).
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
- Geliştirme ekranları `app/dev/` (token önizleme, Diken, tüm ekranlara bağlantı, mock kontrolleri: oturumu kapat, seri koptu senaryosu, challenge bitti senaryosu, çevrimdışı modu, sıfırla). Geliştirme sürümünde Keşfet/Arkadaşlar/Bahçem altındaki "Geliştirme ekranları" bağlantısıyla açılır.
- Route korumaları `app/_layout.tsx`: `Stack.Protected` ile oturum + profil hazır ve onboarding bitmişse uygulama, değilse `(onboarding)`; `invite/[code]` herkese açık. Alt sayfa route'ları (NumberEntry, Poke) `transparentModal`; karartma ve sayfa ekranın içinde ortak `Sheet` ile çizilir.
- Klasörler: `src/components` (ortak bileşenler, `icons`, `ui`), `src/features/<ekran>` (ekrana özel bileşenler, mantık, tipler; ör. `src/features/today`), `src/data` (veri katmanı), `src/theme` (ekrana özel token dosyaları `src/theme/<ekran>.ts`, doğrudan import edilir).
- `npm run android` / `npm run ios`: development build'i derleyip kurar (`expo run:*`). Sonraki açılışlarda `npm start` (dev client).
- Bulut derleme: `npx eas-cli build --profile development` (iOS simülatör için `development-simulator`).
- Paket eklerken `npx expo install <paket>` kullan. Bitirmeden önce `npm run typecheck`.
- Yapılandırma `app.config.ts` (app.json yok): config plugin'leri (Apple girişi, Google Sign-In, bildirim, kamera, galeri, rehber, ATT, AdMob + SKAdNetwork), Türkçe izin metinleri, bundle id / paket `app.gazla` (`APP_ID`), evrensel link (`applinks:<alan>`, Android App Links `https://<alan>/d/*`; alan `EXPO_PUBLIC_INVITE_BASE_URL`/`EXPO_PUBLIC_WEB_BASE_URL`'den). Değerler `.env`'den (tümü açıklamalı `.env.example`'da); boşsa AdMob test uygulama kimlikleri, Google iOS URL şeması yoksa Google plugin'i eklenmez (tarayıcı akışı). Kontrol: `EXPO_OFFLINE=1 node node_modules/expo/bin/cli config --type prebuild`. EAS'te `.env` gitmez: aynı adlarla `eas env:create`.
- Push için EAS proje kimliği: `npx eas-cli init`, çıkan kimliği `.env` `EAS_PROJECT_ID`'ye yaz (`extra.eas.projectId`; yoksa uygulama push kaydını uyarıyla atlar).
- Evrensel link için web alanında `/.well-known/apple-app-site-association` (appID `<TeamID>.app.gazla`, yol `/d/*`) ve `/.well-known/assetlinks.json` (paket `app.gazla`, imza SHA-256'sı) yayımlanmalı.

## Tema kullanımı
- `import { useTheme, typography, spacing, radius, layout, borderWidth, iconMetrics, palette } from '@/theme'`.
- Renk: `useTheme().colors` (açık/koyu anlamsal roller). Koyu karşılığı tasarlanmamış renkler sadece `palette`te. Bileşene/ekrana özel token'lar: `dikenColors` (maskot), `tabBarColors[scheme]`/`tabBarMetrics` (alt menü), `todayColors[scheme]`/`todayMetrics`/`todayTypography` (Bugün). Veriye bağlı avatar ve challenge renkleri: `avatarTints` (`peach | lavender | mint | butter | sky`; sky = Friends/Activity'deki Kerem, tuhaf kategorisinin mavisi; `profiles.avatar_tint` kısıtıyla aynı), `selfAvatarTints` (kendi avatarın), `challengeTints` (açık/koyu).
- Sabit mod: `<SchemeProvider value="dark">` altındaki her `useTheme()` o modu döner (temadan bağımsız koyu ekranda açılan sayfa; `Sheet scheme` bunu kullanır). Tek bileşende `scheme` prop'u olanlar (`Button`, `TextField`, `LoadingState`/`ErrorState`) da var.
- Yazı: `typography.display | title1 | screenTitle | title2 | sectionTitle | cardTitle | body | caption | captionStrong | chip | meta | metaStrong | smallStrong | micro | tabLabel | tabLabelActive | label`. Ağırlık `fontFamily` ile seçilir, `fontWeight` yazma.
- Kutu modeli: tasarımda `box-sizing` yazmayan kenarlı öğeler content-box'tır; RN ölçüsü kenarı içerir (dış ölçü = iç + 2 × kenar).
- Ekran üstü: içerik güvenli alanın `layout.screenTopGap` (9) altından başlar (tasarımdaki 56 px üst boşluk).
- Tok buton gölgesi (`box-shadow: 0 Ypx 0`): `src/components/FlatShadow` (`flatShadowStyle` + `FlatShadowUnderlay`; Android 9 altında View ile çizer).
- İkonlar: `src/components/icons` (çizgi SVG; boyut ve çizgi kalınlığı tema token'larından).
- `Link asChild` + `Pressable` stil fonksiyonu birlikte kullanma (Slot stil fonksiyonunu düşürüyor); `router.push`/`navigate` kullan.

## Veri katmanı (`src/data`)
- Ekranlar yalnızca `@/data` kancalarını kullanır (`src/data/hooks.ts`); doğrudan Supabase çağırma. Adlar ve biçim `docs/EKRANLAR.md` "Veri hook'ları" ile aynı:
  - Okuma (TanStack sorgu sonucu: `data`, `isLoading`, `isError`, `refetch`, `isPending` …): `useTodayTasks`, `useStreak`, `useChallenge(id)`, `useChallengeCalendar(id)`, `useChallengeMembers(id)`, `useFriendsToday`, `useFriendRequests`, `useUserSearch(q)`, `useUsernameCheck(username)`, `useChallengeTemplates({ featured?, category?, q?, sort?: 'popular' })` (tek önbellek, süzme `select` ile; `featured` = PickChallenge'ın 6 onboarding şablonu), `useFeaturedTemplate()` (haftanın şablonu ya da null; yapan sayısı `activeCount`), `useActivity()` (sayfalı, 30'ar: `data.pages`, `fetchNextPage`, `hasNextPage`), `useUnreadCount`, `useGarden`, `useBadges`.
  - Eylem kancaları nesne döner: `{ data, isLoading, isError, error, reset, …eylemler }` (`isLoading` herhangi bir eylem sürerken; `data`/`error` son başlatılan eylemin; `reset` hepsini sıfırlar). `useCheckin()` → `mark({ challengeId, localDate })`, `submitNumber({ …, value })`, `submitPhoto({ …, photoFileUri, note })`, `undo({ challengeId, localDate })` (iyimser + çevrimdışı kuyruk); `useCreateChallenge()` → `create(input)`; `usePoke(userId?)` → `send({ toUserId, messageId, challengeId? })` (ton mesajdan), `undo(pokeId)`, `messages` (sabit liste), `status` (userId verilince kalan hak, sert mod); `useMarkAllRead()` → `markAll()`; `useBlock({ list? })` → `block(userId)`, `unblock(userId)`, `blocked` (engellenenler; yalnızca `list: true` ile okunur); `useReport()` → `submit({ userId, reason, details, alsoBlock, target? })`; `useUpdateSettings()` → `update(patch)`; `useDeleteAccount()` → `deleteAccount()`.
  - Sorgu + eylem (üstteki `data`, `isLoading`, `isError`, `error`, `refetch` sorgunun): `useProfile()` → kendi profilin (DataProvider'ın sorgusu) + `create(input)` (profili tamamla), `update(patch)`; `useInvite(code?)` → kod verilince önizleme + `join(code?)`, `createLink(challengeId)` → `https://<alan>/d/<kod>`; `useRescueStreak()` → bekleyen kurtarmalar + `rescue({ via: 'ad' | 'free', challengeId, missedDate })`, `decline({ challengeId, missedDate })`.
  - Eylem `mutateAsync` gibi çağrılır: `checkin.mark(girdi, { onSuccess, onError, onSettled })` Promise döner (hata fırlatır), beklemeden de çağrılabilir. Her eylemin kendi durumu üstünde: `checkin.undo.isPending`, `poke.send.error`, `rescue.variables?.via`, `submit.isSuccess`, `create.reset()`. Durum değişmedikçe aynı fonksiyondur (bağımlılık dizisinde güvenli).
  - Spesifikasyon dışında kalanlar (TanStack sonucu; adlarda `Mutation` eki yok): okuma `useMySettings`, `useRecentDays`, `useUnseenFinished`, `useTemplateStats`, `useMyMembership`, `useNumberStats`, `useFriendProfile`; yazma (`mutate` / `mutateAsync`) `useSignInWithProvider`, `useSignInWithEmail`, `useSignOut`, `useRegisterPushToken`, `useMarkFinishSeen`, `useSetMyReminder`, `useInviteToChallenge`, `useRespondToInvite`, `useLeaveChallenge`, `useJoinFriendChallenge`, `useFindContacts`, `useSendFriendRequest`, `useAcceptFriendRequest`, `useRemoveFriendship`.
- `GazlaApi` arayüzü (`api.ts`) iki uygulama: `mock/mockApi.ts` (bellek içi, tasarımdaki örnek veri `mock/seed.ts`, iş kurallarının istemci taklidi) ve `supabase/supabaseApi.ts` (RPC + Storage). `client.ts`: `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` tanımlıysa Supabase, değilse mock. Değerler `.env`'e (örnek `.env.example`, git'e girmez).
- Oturum: `DataProvider` + `useAuth()` → `status` (`loading | signedOut | needsProfile | ready`), `profile` (`useProfile()` aynı sorguyu okur; ortak sorgu seçenekleri `queries.ts`). Onboarding son adımları `useOnboarding()` ile açık kalır (`finish()` ile biter).
- Hata: `ApiError.message` kullanıcıya gösterilecek Türkçe metindir.
- Yazmalar (mutasyonlar) çevrimdışıyken beklemeye alınmaz (`networkMode: 'always'`, DataProvider): istek hemen gider, ağ yoksa `NetworkError` ("İnternet bağlantısı yok…") ile düşer; ekran eylemin `error.message`'ını gösterir, ayrıca `isOnline()` kontrolü yazma. İşaretleme/geri alma çevrimdışı kuyruğa girer.
- Yeni alan/RPC gerekirse: önce migration, sonra `types.ts` → `api.ts` → iki uygulama → kanca.
- Giriş: `useSignInWithProvider()` → iOS'ta Apple native (expo-apple-authentication, nonce), Google native (google-signin idToken; `src/config/auth.ts` istemci kimlikleri), yoksa (web, Android'de Apple) OAuth tarayıcı akışı (`supabase/nativeAuth.ts`). Pencereyi kapatmak hata değil: sonuç `'cancelled'` (api düzeyinde `ApiError` kodu `'CANCELLED'`, `isCancelledError`). Apple adı ilk girişte kullanıcı meta verisine yazılır → `session.displayNameHint`.
- Push token: `useRegisterPushToken().mutate({ token, platform })` cihazda saklar; `useSignOut` çıkıştan önce sunucudaki satırı siler (`api.unregisterPushToken`).
- Rehberden bul: `useFindContacts().mutate(await hashContactEmails(emails))` (kırp + küçük harf + SHA-256 hex; en çok 500) → `SearchResult[]`. Mock'ta `ece@example.com`, `kerem@example.com`, `zeynep@example.com`, `baris@example.com` eşleşir (`mock/seed.ts` `seedContactEmails`).
- Reklamla kurtarma: reklam `serverSideVerificationOptions: adRescueSsvOptions(userId, challengeId, missedDate)` ile; ödülden sonra `useRescueStreak().rescue({ via: 'ad', challengeId, missedDate })` — sunucu SSV'yi doğrulayana kadar `'AD_REWARD_PENDING'` ile artan aralıklarla (~30 sn) yeniden dener (`isAdRewardPendingError`). Mock'ta hemen kurtarır.

## Ortak bileşenler (`src/components`)
Spesifikasyon `docs/EKRANLAR.md` "0. Ortak bileşenler"; ilerleme `docs/ILERLEME.md`. Ekranlar bunların kopyasını yazmaz; eksik bir parça önce ortak bileşen olarak eklenir. Hepsi `/dev/components` geliştirme ekranında.
- `ui/` (Components.dc.html):
  - `Button`: `primary | secondary | orange | danger | text | ink | onDark | onGreen | apple | google`; boy `lg` 56 · `lgCompact` 54 · `md` 52 · `mdCompact` 50 (köşe 16, gölge 3) · `sm` 36 hap (`componentMetrics.button`); `subtitle` (iki satır), `highlighted` (yeşil kenar), `scheme="dark"`. Basılınca gölgenin yarısı kadar iner. `ink` koyuda kum; sabit koyu ekranda `onDark`.
  - `IconButton` (`back | close | options` ya da ikon bileşeni; `accessibilityLabel` zorunlu; tonlar; `size` + `outlineColor` + `iconColor` → kamera rozeti `componentMetrics.cameraBadge`), `ScreenHeader` (`size="compact"` 17 başlık, `align="center"`).
  - `Chip`: boy `xxs` 12 (Keşfet süre hapı) · `xs` 13 (Detail bilgi çipi) · `sm` 14 hap (NumberEntry) · `md` 38 (varsayılan) · `lg` 40 (Keşfet kategori); `tone` `default | ink | success | warning | muted` ya da `tint` (challenge rengi anahtarı veya `{ bg, ink }`); `icon` ikon bileşeni (boya göre ölçülür) ya da hazır öğe; `selected` + `onPress` seçilebilir çip (web'de `aria-pressed`).
  - `Segmented` (`size` yükseklik, `textSize`; `role="radio"` gölge .14, web'de `aria-checked`/`aria-selected`; seçenek `{ value, label, disabled? }`: pasif hücre soluk `componentMetrics.disabledOpacity`, basılamaz, `aria-disabled` — Poke'ta sert mod kapalıyken "Laf sok"), `Toggle`, `Radio`, `Checkbox`, `SectionLabel` (tonlar, sayı), `Card` (`onPress` + `accessibilityLabel`; basılıyken ikincil yüzey), `TextField` (`size="sm"`: tek satır 50, çok satır 84; `scheme`; `inputStyle`: giriş metninin yazı stili, yer tutucu dahil — DeleteAccount "SİL" 16 / 800 aralık 1 `settingsTypography.deleteConfirmInput`), `Toast` + `useToast()`/`<ToastHost />`, `CountBadge` (`outlineColor`, `style`), `LoadingState`/`ErrorState` (`scheme`, `actionLabel`). Token'lar `componentColors[scheme]`, `componentMetrics`, `componentTypography`.
  - `ui/index.ts` ayrıca `Avatar`, `ProgressBar` ve iskeleti dışa aktarır: `Skeleton` (tek blok), `SkeletonPulse` (blokları birlikte nabızlatır), `SkeletonTaskCard` (görev kartı ölçüsünde); nabız `componentMetrics.skeletonPulseMinOpacity`/`skeletonPulseDurationMs`, "hareketi azalt"ta yok.
- `SearchField` (48 arama alanı; `autoFocus`: çizilince odaklanır — alt sayfada arama), `OnboardingHeader` (geri + 4 segment + n/4), `CategoryTile` (kategori → renk `categoryTint`; ikon bileşeni ve `{ bg, ink }` de alır), `TaskCard`, `Avatar` (halka `done | pending | invite`, rozet; `self`: kendi avatarın şeftalisi #FFE3D2) + `AvatarStack` + `AddAvatar` (artı ölçüye göre), `FriendRow` + `FriendList` + `FriendRowButton` (`size="lg"` 40, `wide` 0 14 köşe 12, `icon` + metin) + `FriendBubble` + `InviteBubble`, `ProgressBar`, `StreakChip`, `DropMeter` (token'lar `cardColors`, `cardMetrics`), `Sheet` (@gorhom/bottom-sheet; route alt sayfası ya da `visible`/`onClose`; `top` slotu sayfanın üstündeki Diken için; `scheme="dark"`: sayfa ve içindeki her bileşen koyu — iki modda koyu PhotoProof'un grup sayfası), `OptionSheet` (Sheet üstünde tek seçimli liste: `options` `{ value: string | number, label, detail? }`, üstte `description`, satırda seçim düğmesi, `role="radio"` + `aria-checked`; seçince kapanır — Ayarlar seçenekleri, hatırlatma saati), `ActionSheet` (onaylı satırlar), `SpeechBubble` (kuyruk yönleri, `message`/`quote`), `Diken`, `TabBar`.
- Hatırlatma saati seçenekleri her yerde aynı (Ayarlar → Bildirimler, Detail "…", Create −/+): 08:00–23:00 arası 30 dakikalık adımlar, tek kaynak `src/features/settings/logic.ts` (`REMINDER_TIMES`, `reminderTimes(mevcut)` listede olmayan mevcut saati ekler, `stepReminder`).
- Kırmızı metin/ikon/hata kenarı `colors.dangerText` (koyuda okunur #F97066); `colors.danger` yalnızca dolgu (Sil butonu).
- Karartma `componentColors[scheme].scrim`, alt sayfa köşesi/tutamaç `componentMetrics.sheet*`.

## Supabase
- Şema `supabase/migrations/` (14 dosya), testler `supabase/tests/` (pgTAP, 7 dosya). Ayrıntı, kararlar, kurulum ve açık sorular: `supabase/README.md`.
- Edge Function'lar `supabase/functions/` (Deno, tek dosya + `deno.json` içe aktarma haritası; kökteki `tsc` de denetler): `admob-ssv` (AdMob SSV imzası → `grant_ad_rescue`; `--no-verify-jwt`), `delete-account` (JWT → Storage `proofs/{uid}`, `avatars/{uid}` → `auth.admin.deleteUser`), `push` (Expo push: arkadaş bildirimleri notifications tetikleyicisinden, Diken bildirimleri 15 dakikada bir pg_cron'dan; `x-gazla-secret`, `--no-verify-jwt`). Dağıtım, sırlar (Vault `gazla_project_url`, `gazla_push_secret`; `PUSH_WEBHOOK_SECRET`), pg_cron/pg_net ve AdMob SSV adresi: README "Sunucu tarafı işler → Kurulum".
- Zamanlanmış işler pg_cron'da (`app.install_cron_jobs()`; uzantı yoksa sessizce atlanır): `finish_due_challenges` saatlik, Diken push 15 dakikada bir. Diken kuralları (saatler, günde 2, sessiz saatler) SQL'de (`app.queue_diken_notifications`), metinleri `app.diken_text`.
- Migration'lar yayımlanmadan önce yerinde düzenlenebilir; yayımlandıktan sonra her değişiklik yeni migration.
- İstemci tablolara yalnızca politikası olan yerlerde doğrudan yazar (profil/ayar güncelleme, engel, arkadaşlık silme, dürtme geri alma, bildirim token'ı silme). Diğer her şey `public.*` RPC'leri: `checkin`, `send_poke`, `create_challenge`, `submit_report`, `find_contacts`, `ad_rescue_result` …
- Seri, gün numarası, hedef, sıra ve kurtarma hakkı sunucudan okunur (`my_today`, `my_streak`, `my_pending_rescues`, `challenge_board`, `friends_today`, `my_garden`); istemcide yeniden hesaplanmaz.
- Yerel gün kullanıcının `user_settings.timezone`'una göre; istemci saat dilimini cihazdan alıp değişince günceller. `checkin`'e tarih verilmezse bugün; tolerans içinde dün için `p_local_date`.
- `my_today` işaretlenebilen her gün için satır döner (gece 00:00–02:00 arası dün de, `local_date` ile); işaretlerken `p_local_date` gönder.
- Fotoğraf kanıtı: önce Storage `proofs/{uid}/{challenge_id}/{uuid}.jpg`, sonra `checkin(p_photo_path)`. Profil fotoğrafı `avatars/{uid}/{uuid}.jpg`. Dosya adını uygulama üretir (harf, rakam, `.`, `_`, `-`); bir dosya yalnızca bir günün kanıtıdır.
- Yeni fonksiyon eklerken: `app.*` varsayılan olarak yalnızca service_role'e açıktır; RLS politikası çağıracaksa `authenticated`'a, istemci RPC'siyse `public` altında açıkça `grant execute` yaz ve `01_rls_privileges` allow-list'ini güncelle.
- Test: `supabase test db` (pgTAP + basejump supabase_test_helpers).
- Şema tipleri `src/types/database.ts` (`supabase gen types typescript` çıktısı; elle düzenleme). Migration değişince yeniden üret: `supabase gen types typescript --project-id <ref> --schema public,graphql_public > src/types/database.ts` ya da CLI/Docker yoksa `npm run gen:types` (`scripts/gen-db-types.mjs`, psql ile aynı çıktı; bağlantı `DATABASE_URL` ya da PG* değişkenleri). README "Tipler".
- `supabaseApi.ts` `createClient<Database>`; RPC'ler `rpc('ad', { p_… })` ile tipli (parametreler null da alır), satır dönüştürücüleri `Tables<'…'>` / RPC `Returns` alır; jsonb dönen RPC'lerin şekli orada `*Json` tipleri. `src/data/types.ts` enum'ları `Enums<'…'>`'tan. Yeni RPC/sütun: migration → tipleri üret → `types.ts` → `api.ts` → iki uygulama → kanca.
