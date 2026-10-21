import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Diken from '@/components/Diken';
import { CheckIcon, MailIcon } from '@/components/icons';
import OnboardingHeader from '@/components/OnboardingHeader';
import { Button, Chip, TextField, ToastHost, useToast } from '@/components/ui';
import { legalLinks, type LegalLink as LegalLinkKind } from '@/config/links';
import {
  isCancelledError,
  type OAuthProvider,
  useChallengeTemplates,
  useSignInWithEmail,
  useSignInWithProvider,
} from '@/data';
import { errorMessage } from '@/features/onboarding/logic';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { AppleSignInButton, GoogleSignInButton } from '@/features/onboarding/ProviderButtons';
import StepScreen, { StepIntro } from '@/features/onboarding/StepScreen';
import { typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

// Hesabını aç — design/SignIn.dc.html (adım 2/4, yarım). Apple, Google (resmi butonlar, ProviderButtons) ya da
// e-posta bağlantısı. Oturum açılınca (onboarding)/_layout profil adımına geçirir. Giriş penceresini kapatmak hata
// değildir (sessiz); sağlayıcı hatası tostla, e-posta hatası alanın altında gösterilir.

export default function SignInScreen() {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const { pickedTemplateId } = useOnboarding();
  const templates = useChallengeTemplates();
  const picked = pickedTemplateId ? templates.data?.find((x) => x.id === pickedTemplateId) : undefined;

  const providerSignIn = useSignInWithProvider();
  const emailSignIn = useSignInWithEmail();
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const busy = providerSignIn.isPending || emailSignIn.isPending;

  const signInWith = (provider: OAuthProvider) => {
    if (busy) return;
    setError(null);
    toast.hide();
    setPendingProvider(provider);
    providerSignIn.mutate(provider, {
      // Kullanıcı pencereyi kapattı: sonuç 'cancelled' (ya da CANCELLED kodlu hata) — sessiz
      onError: (e) => {
        if (!isCancelledError(e)) toast.show({ message: errorMessage(e), kind: 'info' });
      },
      onSettled: () => setPendingProvider(null),
    });
  };

  const sendEmail = () => {
    setError(null);
    setEmailSent(false);
    emailSignIn.mutate(email.trim(), {
      onSuccess: () => setEmailSent(true),
      onError: (e) => setError(errorMessage(e)),
    });
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(onboarding)/welcome'));

  return (
    <View style={styles.root}>
      <StepScreen
        paddingBottom={m.signInPaddingBottom}
        footerGap={m.providerGap}
        footer={
          <>
            {emailOpen ? (
              <>
                <TextField
                  label="E-posta adresin"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setEmailSent(false);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={sendEmail}
                  hint={emailSent ? 'Giriş bağlantısını e-postana gönderdik. Bağlantıya dokununca devam edersin.' : null}
                />
                <Button
                  title="Bağlantı gönder"
                  onPress={sendEmail}
                  loading={emailSignIn.isPending}
                  disabled={!email.trim()}
                />
                <Button
                  title="Vazgeç"
                  variant="text"
                  onPress={() => {
                    setEmailOpen(false);
                    setError(null);
                  }}
                />
              </>
            ) : (
              <>
                {/* SignIn.dc.html: 54, köşe 18; resmi Apple / Google butonları (native yoksa ortak varyantlar) */}
                <AppleSignInButton
                  onPress={() => signInWith('apple')}
                  loading={pendingProvider === 'apple'}
                  disabled={busy && pendingProvider !== 'apple'}
                />
                <GoogleSignInButton
                  onPress={() => signInWith('google')}
                  loading={pendingProvider === 'google'}
                  disabled={busy && pendingProvider !== 'google'}
                />
                <Button
                  title="E-posta ile devam et"
                  variant="text"
                  disabled={busy}
                  icon={<MailIcon color={colors.text} size={m.mailIconSize} strokeWidth={m.mailIconStroke} />}
                  onPress={() => {
                    setError(null);
                    setEmailOpen(true);
                  }}
                />
              </>
            )}
            {error && (
              <Text accessibilityLiveRegion="polite" style={[typography.meta, styles.center, { color: colors.dangerText }]}>
                {error}
              </Text>
            )}
            <Text style={[t.legal, styles.legal, { color: c.legalText }]}>
              Devam ederek <LegalLink kind="terms">Kullanım Koşulları</LegalLink>'nı ve{' '}
              <LegalLink kind="privacy">Gizlilik Politikası</LegalLink>'nı kabul edersin. Verilerini nasıl işlediğimizi{' '}
              <LegalLink kind="kvkk">KVKK Aydınlatma Metni</LegalLink>'nde anlatıyoruz.
            </Text>
          </>
        }>
        <OnboardingHeader step={2} half onBack={goBack} />

        <View style={styles.hero}>
          <Diken mood="mutlu" stage="tam" size={m.signInDikenSize} />
          {picked && (
            // Seçilen challenge: yeşil durum çipi, solda tikli yeşil nokta (SignIn.dc.html)
            <Chip
              tone="success"
              label={`${picked.title} · ${picked.defaultDurationDays} gün`}
              numberOfLines={1}
              icon={
                <View style={[styles.chipDot, { backgroundColor: colors.action }]}>
                  <CheckIcon color={colors.onAction} size={m.pickedChipIconSize} strokeWidth={m.pickedChipIconStroke} />
                </View>
              }
            />
          )}
        </View>

        <StepIntro
          marginTop={m.signInIntroMarginTop}
          title="Serin kaybolmasın, hesabını aç"
          body="Arkadaşların seni bulabilsin. Telefon değiştirsen de serin ve bahçen seninle gelsin."
        />
      </StepScreen>
      {/* Sağlayıcı hatası: ekranın altında, yasal metnin üzerinde (giriş butonlarını örtmez) */}
      <ToastHost toast={toast} />
    </View>
  );
}

/** Yasal metindeki bağlantı: altı çizili, uygulama içi tarayıcıda açılır */
function LegalLink({ kind, children }: { kind: LegalLinkKind; children: ReactNode }) {
  const { scheme } = useTheme();
  return (
    <Text
      accessibilityRole="link"
      onPress={() => {
        WebBrowser.openBrowserAsync(legalLinks[kind]).catch(() => {});
      }}
      style={[t.legalLink, { color: onboardingColors[scheme].legalLink }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    marginTop: m.signInDikenMarginTop,
    alignItems: 'center',
    gap: m.signInDikenGap,
  },
  chipDot: {
    width: m.pickedChipDot,
    height: m.pickedChipDot,
    borderRadius: m.pickedChipDot / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
  legal: {
    marginTop: m.legalMarginTop,
    textAlign: 'center',
  },
});
