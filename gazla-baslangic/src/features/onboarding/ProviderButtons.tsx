/**
 * SignIn giriş butonları — design/SignIn.dc.html (54, köşe 18; çizimdeki logosuz butonlar yer tutucu).
 *
 * - Apple: iOS'ta Apple'ın resmi butonu (`AppleAuthenticationButton`, "Apple ile devam et": CONTINUE; açıkta siyah,
 *   koyuda beyaz; metni sistem yerelleştirir). Apple'ın native girişi olmayan yerde (Android, web) ortak
 *   `Button variant="apple"`; veri katmanı orada Supabase OAuth tarayıcı akışını açar.
 * - Google: iOS/Android'de Google'ın resmi butonu (`GoogleSigninButton` Wide, açık/koyu); web'de ortak
 *   `Button variant="google"` (OAuth tarayıcı akışı).
 *
 * Resmi butonlar dönen gösterge çizemez ve görünüşü değiştirilmez: işlem sürerken ikinci basış yok sayılır,
 * Google butonu kendi pasif görünüşüne geçer. Native modülü olmayan eski bir geliştirme derlemesinde resmi butonlar
 * yerine ortak butonlar çizilir (ekran çökmez).
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui';
import { useT } from '@/i18n';
import { componentMetrics, useTheme } from '@/theme';
import { onboardingMetrics as m } from '@/theme/onboarding';

type ProviderButtonProps = {
  onPress: () => void;
  /** Bu sağlayıcıyla giriş sürüyor */
  loading: boolean;
  /** Başka bir giriş sürüyor */
  disabled: boolean;
};

const ROW = componentMetrics.button.lgCompact;

// Apple ------------------------------------------------------------------------------------------

/** iOS'ta Apple girişi var mı (iOS 13+; modül yoksa false). Sonuç uygulama boyunca saklanır. */
let appleAvailable: boolean | null = Platform.OS === 'ios' ? null : false;
let appleCheck: Promise<boolean> | null = null;

function useAppleNative(): boolean | null {
  const [available, setAvailable] = useState(appleAvailable);
  useEffect(() => {
    if (available !== null) return;
    let active = true;
    appleCheck ??= AppleAuthentication.isAvailableAsync().catch(() => false);
    appleCheck.then((value) => {
      appleAvailable = value;
      if (active) setAvailable(value);
    });
    return () => {
      active = false;
    };
  }, [available]);
  return available;
}

export function AppleSignInButton({ onPress, loading, disabled }: ProviderButtonProps) {
  const { scheme } = useTheme();
  const t = useT();
  const native = useAppleNative();

  // iOS'ta kontrol sürerken (bir an) satırın yeri ayrılır, yanlış buton yanıp sönmez
  if (native === null) return <View style={styles.row} />;

  if (native) {
    return (
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={
          scheme === 'dark'
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={ROW.radius}
        style={styles.apple}
        onPress={() => {
          if (!loading && !disabled) onPress();
        }}
      />
    );
  }

  return (
    <Button
      title={t.auth.signIn.continueWithApple}
      variant="apple"
      size="lgCompact"
      onPress={onPress}
      loading={loading}
      disabled={disabled}
    />
  );
}

// Google -----------------------------------------------------------------------------------------

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');
type GoogleButtonComponent = GoogleSignInModule['GoogleSigninButton'];

let googleButton: GoogleButtonComponent | null | undefined;

/**
 * Google'ın resmi butonu. Paket içe aktarılırken native modülü arar ve yoksa fırlatır (TurboModuleRegistry);
 * bu yüzden ilk çizimde korumalı yüklenir. Web'de yok.
 */
function loadGoogleButton(): GoogleButtonComponent | null {
  if (googleButton !== undefined) return googleButton;
  if (Platform.OS === 'web') {
    googleButton = null;
    return null;
  }
  try {
    googleButton = (require('@react-native-google-signin/google-signin') as GoogleSignInModule).GoogleSigninButton;
  } catch {
    googleButton = null;
  }
  return googleButton;
}

export function GoogleSignInButton({ onPress, loading, disabled }: ProviderButtonProps) {
  const { scheme } = useTheme();
  const t = useT();
  const GoogleSigninButton = loadGoogleButton();

  if (!GoogleSigninButton) {
    return (
      <Button
        title={t.auth.signIn.continueWithGoogle}
        variant="google"
        size="lgCompact"
        onPress={onPress}
        loading={loading}
        disabled={disabled}
      />
    );
  }

  return (
    <View style={styles.googleRow}>
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={scheme === 'dark' ? GoogleSigninButton.Color.Dark : GoogleSigninButton.Color.Light}
        disabled={disabled || loading}
        onPress={onPress}
        style={styles.google}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: ROW.height,
  },
  // Apple: genişlik ve yükseklik verilmezse çizilmez; zemin ve köşe yalnızca buttonStyle / cornerRadius ile
  apple: {
    width: '100%',
    height: ROW.height,
  },
  googleRow: {
    height: ROW.height,
    justifyContent: 'center',
  },
  google: {
    width: '100%',
    height: m.googleButtonHeight,
  },
});
