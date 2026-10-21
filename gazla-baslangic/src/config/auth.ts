/**
 * Native giriş ayarları (`.env`, EXPO_PUBLIC_*; derlemede metne gömülür). Boşsa o sağlayıcı native
 * akış yerine Supabase OAuth tarayıcı akışıyla açılır (src/data/supabase/nativeAuth.ts).
 *
 * - Google: Google Cloud Console → Kimlik bilgileri. `webClientId` "Web uygulaması" istemcisi (Supabase
 *   Auth → Google sağlayıcısındaki istemci kimliğiyle aynı; idToken'ın hedef kitlesi), `iosClientId`
 *   "iOS" istemcisi. iOS URL şeması (`com.googleusercontent.apps.…`) app.config.ts'te plugin'e verilir.
 * - Apple: ayar gerekmez (iOS'ta "Sign in with Apple" yeteneği, `ios.usesAppleSignIn`).
 */
const clean = (value: string | undefined) => (value && value.trim() ? value.trim() : undefined);

export const googleSignInConfig = {
  webClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  iosClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
} as const;
