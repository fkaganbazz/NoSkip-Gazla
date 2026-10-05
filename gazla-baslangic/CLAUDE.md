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
