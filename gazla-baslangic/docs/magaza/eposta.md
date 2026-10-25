# Giriş e-postası metinleri (taslak)

Supabase → Authentication → Email Templates. İki şablon aynı tasarımı kullanır (tasarım: `docs/TASARIM-ISTEKLERI.md` §6).
Bağlantı değişkeni `{{ .ConfirmationURL }}` olduğu gibi kalmalı. Akış PKCE: bağlantı, giriş istenen cihazda açılmalı.

Supabase şablonları kullanıcı başına dil seçmez; tek şablonda iki dil gösterilir (önce Türkçe, ince bir çizgi, sonra
İngilizce) ya da kullanıcı meta verisindeki dile göre `{{ if eq .Data.locale "en" }}…{{ else }}…{{ end }}` ile seçilir
(istemci kayıtta `options.data.locale` gönderirse). Öneri: başlangıçta iki dilli tek şablon.

## Giriş bağlantısı (Magic Link)
**Konu:** Gazla giriş linkin · Your NoSkip sign-in link

**TR**
- Başlık: Gazla'ya giriş yap
- Metin: Aşağıdaki butona dokun, uygulama açılsın ve kaldığın yerden devam et. Bağlantı 1 saat geçerli; telefonunda,
  girişi istediğin cihazda aç.
- Buton: Giriş yap
- Alt not: Bu e-postayı sen istemediysen yok sayabilirsin; hesabına kimse giriş yapmaz.

**EN**
- Title: Sign in to NoSkip
- Text: Tap the button below to open the app and pick up where you left off. The link works for 1 hour; open it on the
  phone where you asked to sign in.
- Button: Sign in
- Footer: If you didn't ask for this, you can ignore this email; nobody can sign in to your account.

## İlk kayıt (Confirm signup)
**Konu:** Gazla'ya hoş geldin · Welcome to NoSkip

**TR**
- Başlık: Hoş geldin! Diken seni bekliyor
- Metin: Hesabını açmak için butona dokun. Bağlantı 1 saat geçerli; girişi istediğin telefonda aç.
- Buton: Hesabımı aç
- Alt not: Bu e-postayı sen istemediysen yok sayabilirsin.

**EN**
- Title: Welcome! Diken's waiting
- Text: Tap the button to finish creating your account. The link works for 1 hour; open it on the phone where you asked to
  sign in.
- Button: Create my account
- Footer: If you didn't ask for this, you can ignore this email.

Altbilgi (ikisinde de): KRATS · [DESTEK E-POSTASI] · [ALAN ADI]

Not: Bağlantı süresi Supabase → Authentication → Settings → "Email OTP Expiration" (varsayılan 1 saat). Değiştirirsen
metindeki süreyi de güncelle.
