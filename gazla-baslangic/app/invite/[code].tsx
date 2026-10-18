import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Diken from '@/components/Diken';
import { flatShadowStyle } from '@/components/FlatShadow';
import { Button, ErrorState, LoadingState } from '@/components/ui';
import { useAuth, useInvitePreview, useJoinByInviteMutation } from '@/data';
import GazlaLogo from '@/features/invite-landing/GazlaLogo';
import { InviteChallengeCard, InviterMessage } from '@/features/invite-landing/InviteCard';
import { challengeMeta, deviceLocalDate, isEnded } from '@/features/invite-landing/logic';
import { layout, typography, useTheme } from '@/theme';
import { inviteColors, inviteMetrics as m, inviteTypography } from '@/theme/explore';

// Davet karşılama — design/InviteLanding.dc.html (gazla://invite/KOD). Oturumsuz da açılır:
// önizleme herkese açık, katılmak için oturum gerekir.
export default function InviteLandingScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const c = inviteColors[scheme];
  const { status } = useAuth();
  const signedIn = status === 'ready';

  const preview = useInvitePreview(code);
  const join = useJoinByInviteMutation();
  const today = useMemo(() => deviceLocalDate(), []);

  // Oturum varsa alttaki sekmelere döner; yoksa '/' onboarding'i açar
  const goHome = () => (signedIn ? router.dismissTo('/(tabs)') : router.replace('/'));

  const onPrimary = () => {
    if (!signedIn) {
      // TODO(backend): kod hatırlanmıyor; giriş/onboarding bitince bu davete otomatik katılım yok.
      goHome();
      return;
    }
    join.mutate(code, {
      onSuccess: (challengeId) => router.replace({ pathname: '/challenge/[id]', params: { id: challengeId } }),
    });
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

  const primaryTitle = !signedIn ? 'Katılmak için giriş yap' : data.alreadyMember ? "Challenge'a git" : 'Katıl ve başla';

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
        <View style={[styles.dikenBubble, { backgroundColor: c.bubbleBg }, flatShadowStyle(m.bubbleShadow, c.bubbleShadow)]}>
          <Text style={[inviteTypography.dikenBubble, { color: colors.text }]}>Kaçıran sen olma da.</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {join.isError && (
          <Text accessibilityLiveRegion="polite" style={[typography.meta, styles.center, { color: colors.danger }]}>
            {join.error.message}
          </Text>
        )}
        <Button title={primaryTitle} onPress={onPrimary} loading={join.isPending} />
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
    justifyContent: 'center',
    gap: m.dikenRowGap,
  },
  dikenBubble: {
    flexShrink: 1,
    marginBottom: m.dikenBubbleMarginBottom,
    paddingVertical: m.dikenBubblePaddingY,
    paddingHorizontal: m.dikenBubblePaddingX,
    borderRadius: m.dikenBubbleRadius,
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
