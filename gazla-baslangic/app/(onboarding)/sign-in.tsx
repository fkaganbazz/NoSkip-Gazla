import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Diken from '@/components/Diken';
import { CheckIcon } from '@/components/icons';
import { Button, TextField } from '@/components/ui';
import { type OAuthProvider, useSignInWithEmailMutation, useSignInWithProviderMutation, useTemplates } from '@/data';
import { MailIcon } from '@/features/onboarding/icons';
import { errorMessage } from '@/features/onboarding/logic';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import ProviderButton from '@/features/onboarding/ProviderButton';
import StepHeader from '@/features/onboarding/StepHeader';
import StepScreen, { StepIntro } from '@/features/onboarding/StepScreen';
import { radius, typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

// Hesabını aç — design/SignIn.dc.html (adım 2/4, yarım). Apple, Google ya da e-posta bağlantısı.
// Oturum açılınca (onboarding)/_layout profil adımına geçirir.

export default function SignInScreen() {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const { pickedTemplateId } = useOnboarding();
  const templates = useTemplates();
  const picked = pickedTemplateId ? templates.data?.find((x) => x.id === pickedTemplateId) : undefined;

  const providerSignIn = useSignInWithProviderMutation();
  const emailSignIn = useSignInWithEmailMutation();
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = providerSignIn.isPending || emailSignIn.isPending;

  const signInWith = (provider: OAuthProvider) => {
    setError(null);
    setPendingProvider(provider);
    providerSignIn.mutate(provider, {
      onError: (e) => setError(errorMessage(e)),
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

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(onboarding)'));

  return (
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
              <ProviderButton
                provider="apple"
                onPress={() => signInWith('apple')}
                loading={pendingProvider === 'apple'}
                disabled={busy}
              />
              <ProviderButton
                provider="google"
                onPress={() => signInWith('google')}
                loading={pendingProvider === 'google'}
                disabled={busy}
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
            <Text accessibilityLiveRegion="polite" style={[typography.meta, styles.center, { color: colors.danger }]}>
              {error}
            </Text>
          )}
          {/* TODO: Koşullar, gizlilik ve KVKK metinlerinin adresleri gelince bağlantıya çevrilecek */}
          <Text style={[t.legal, styles.legal, { color: c.legalText }]}>
            Devam ederek <Text style={[t.legalLink, { color: c.legalLink }]}>Kullanım Koşulları</Text>'nı ve{' '}
            <Text style={[t.legalLink, { color: c.legalLink }]}>Gizlilik Politikası</Text>'nı kabul edersin. Verilerini
            nasıl işlediğimizi <Text style={[t.legalLink, { color: c.legalLink }]}>KVKK Aydınlatma Metni</Text>'nde
            anlatıyoruz.
          </Text>
        </>
      }>
      <StepHeader step={2} half onBack={goBack} />

      <View style={styles.hero}>
        <Diken mood="mutlu" stage="tam" size={m.signInDikenSize} />
        {picked && (
          <View style={[styles.chip, { backgroundColor: c.pickedChipBg }]}>
            <View style={[styles.chipDot, { backgroundColor: colors.action }]}>
              <CheckIcon color={c.pickedChipIcon} size={m.pickedChipIconSize} strokeWidth={m.pickedChipIconStroke} />
            </View>
            <Text style={[typography.chip, styles.chipText, { color: c.pickedChipText }]} numberOfLines={2}>
              {picked.title} · {picked.defaultDurationDays} gün
            </Text>
          </View>
        )}
      </View>

      <StepIntro
        marginTop={m.signInIntroMarginTop}
        title="Serin kaybolmasın, hesabını aç"
        body="Arkadaşların seni bulabilsin. Telefon değiştirsen de serin ve bahçen seninle gelsin."
      />
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: m.signInDikenMarginTop,
    alignItems: 'center',
    gap: m.signInDikenGap,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.pickedChipGap,
    paddingVertical: m.pickedChipPaddingY,
    paddingLeft: m.pickedChipPaddingLeft,
    paddingRight: m.pickedChipPaddingRight,
    borderRadius: radius.full,
  },
  chipDot: {
    width: m.pickedChipDot,
    height: m.pickedChipDot,
    borderRadius: m.pickedChipDot / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    flexShrink: 1,
  },
  center: {
    textAlign: 'center',
  },
  legal: {
    marginTop: m.legalMarginTop,
    textAlign: 'center',
  },
});
