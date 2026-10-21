import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Diken from '@/components/Diken';
import SpeechBubble from '@/components/SpeechBubble';
import { Button, ErrorState, LoadingState } from '@/components/ui';
import { savePendingInvite, useAuth, useInvite } from '@/data';
import GazlaLogo from '@/features/invite-landing/GazlaLogo';
import { InviteChallengeCard, InviterMessage } from '@/features/invite-landing/InviteCard';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import { challengeMeta, deviceLocalDate, isEnded } from '@/features/invite-landing/logic';
import { layout, typography, useTheme } from '@/theme';
import { inviteColors, inviteMetrics as m, inviteTypography } from '@/theme/explore';

// Davet karşılama — design/InviteLanding.dc.html (gazla://invite/KOD; https://<alan>/d/KOD → app/d/[code]).
// Oturumsuz da açılır: önizleme herkese açık. "Katıl ve başla": oturum yoksa kod cihazda saklanır ve
// giriş adımı açılır (katılımı onboarding bitince tamamlar); oturum varsa katılır → Bugün.
export default function InviteLandingScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const c = inviteColors[scheme];
  const { status } = useAuth();
  const onboarding = useOnboarding();
  // Uygulama açık (oturum + profil hazır, onboarding bitti; app/_layout.tsx ile aynı koşul). Değilse
  // (oturum yok ya da onboarding yarım) katılım onboarding sonunda bekleyen kodla tamamlanır.
  const signedIn = status === 'ready' && !onboarding.inProgress;

  // Önizleme (data …) ve katıl; katılma çevrimdışıyken hemen NetworkError ile düşer (yazmalar beklemeye
  // alınmaz; DataProvider)
  const preview = useInvite(code);
  const { join } = preview;
  const today = useMemo(() => deviceLocalDate(), []);

  // Bugün: '/(tabs)' sekmelerin ilk ekranına (Bugün) döner
  const goToday = () => router.dismissTo('/(tabs)');
  // Oturum varsa Bugün; yoksa karşılama (onboarding yarımsa onboarding düzeni kaldığı adıma taşır)
  const goHome = () => (signedIn ? goToday() : router.replace('/welcome'));

  const onPrimary = async () => {
    if (join.isPending) return;
    if (!signedIn) {
      // Giriş adımı (oturum varsa onboarding düzeni kaldığı adıma taşır); onboarding bitince kod
      // alınıp katılım tamamlanır
      await savePendingInvite(code);
      router.replace('/sign-in');
      return;
    }
    if (preview.data?.alreadyMember) {
      goToday();
      return;
    }
    join(code, { onSuccess: goToday });
  };

  const frame = [
    styles.content,
    { paddingTop: insets.top + layout.screenTopGap + m.paddingTop, paddingBottom: insets.bottom + m.paddingBottom },
  ];

  if (preview.isPending) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <LoadingState />
      </View>
    );
  }

  if (preview.isError) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <ErrorState message={preview.error.message} onRetry={() => preview.refetch()} />
      </View>
    );
  }

  const data = preview.data;
  const ended = !!data && isEnded(data.challenge, today);

  // Geçersiz / süresi dolmuş kod ya da bitmiş challenge
  if (!data || ended) {
    return (
      <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={frame}>
        <GazlaLogo />
        <View style={styles.invalid}>
          <Diken mood="endise" stage="tam" size={m.invalidDikenSize} />
          <Text accessibilityRole="header" style={[inviteTypography.title, styles.center, { color: colors.text }]}>
            {ended ? 'Bu challenge bitti' : 'Bu davet linki geçersiz'}
          </Text>
          <Text style={[typography.body, styles.center, { color: colors.textBody }]}>
            {ended
              ? "Bu davetin challenge'ı sona erdi. Yeni bir tane başlatıp arkadaşlarını sen çağır."
              : 'Linkin süresi dolmuş ya da yanlış kopyalanmış olabilir. Davet edenden yeni bir link iste.'}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button title="Ana sayfaya dön" onPress={goHome} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={frame}>
      <GazlaLogo />

      <InviterMessage inviter={data.inviter} message={data.challenge.inviteMessage} />

      <Text accessibilityRole="header" style={[inviteTypography.title, styles.title, { color: colors.text }]}>
        {`${data.inviter.displayName} seni bir challenge'a çağırıyor`}
      </Text>

      <InviteChallengeCard preview={data} meta={challengeMeta(data.challenge, today)} />

      <View style={styles.dikenRow}>
        <Diken mood="cosku" stage="tam" size={m.dikenSize} />
        {/* Tasarımdaki satır davet mesajına özeldi ("Baklavayı sen ısmarlama da."); genel hali */}
        <SpeechBubble size="sm" style={styles.dikenBubble}>
          Kaçıran sen olma da.
        </SpeechBubble>
      </View>

      <View style={styles.actions}>
        {join.isError && (
          <Text accessibilityLiveRegion="polite" style={[typography.meta, styles.center, { color: colors.dangerText }]}>
            {join.error.message}
          </Text>
        )}
        <Button title="Katıl ve başla" onPress={onPrimary} loading={join.isPending} />
        <Button title="Şimdilik değil" variant="text" onPress={goHome} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
  },
  title: {
    marginTop: m.titleMarginTop,
  },
  dikenRow: {
    marginTop: m.dikenRowMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.dikenRowGap,
  },
  dikenBubble: {
    flexShrink: 1,
    marginBottom: m.dikenBubbleMarginBottom,
  },
  actions: {
    marginTop: 'auto',
    gap: m.actionsGap,
  },
  invalid: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.invalidGap,
  },
  center: {
    textAlign: 'center',
  },
});
