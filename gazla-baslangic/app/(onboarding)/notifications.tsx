import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Diken from '@/components/Diken';
import { DikenFaceIcon } from '@/components/icons';
import OnboardingHeader from '@/components/OnboardingHeader';
import SpeechBubble from '@/components/SpeechBubble';
import { Button, ToastHost, useToast } from '@/components/ui';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import StepScreen from '@/features/onboarding/StepScreen';
import { borderWidth, componentMetrics, typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

// Seni dürtmeme izin ver — design/NotifPermission.dc.html (adım 4/4). İki buton da onboarding'i
// bitirir; uygulama açılınca kök düzen sekmelere geçer. Geri: davet adımına (challenge varsa) ya da challenge
// seçimine; davetle katılan kişi için önceki adım yok (davet adımı atlandı, profil tamamlandı).
export default function NotifPermissionScreen() {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const { finish, pickedTemplateId, createdChallengeId, joinedViaInvite, inviteError, clearInviteError } =
    useOnboarding();
  const toast = useToast();
  const { show } = toast;

  // Bekleyen davete katılılamadıysa (geçersiz kod, grup dolu …) burada söylenir
  useEffect(() => {
    if (!inviteError) return;
    show({ message: inviteError, durationMs: componentMetrics.toastActionDurationMs });
    clearInviteError();
  }, [inviteError, clearInviteError, show]);

  // finish() sonrası kök düzendeki Stack.Protected (onboarding) grubunu kaldırır, sekmeler açılır
  const done = () => finish();

  const allow = () => {
    // TODO(bildirim): expo-notifications kurulunca burada izin istenecek:
    //   const { status } = await Notifications.requestPermissionsAsync();
    //   if (status === 'granted') registerPushToken((await Notifications.getExpoPushTokenAsync()).data, Platform.OS)
    // (api.registerPushToken → register_push_token RPC; kancası henüz yok)
    done();
  };

  const goBack = () =>
    router.dismissTo(pickedTemplateId || createdChallengeId ? '/(onboarding)/invite' : '/(onboarding)/pick-challenge');

  return (
    <View style={styles.root}>
      <StepScreen
        backgroundColor={c.permissionBg}
        footer={
          <>
            <Button title="Bildirimlere izin ver" onPress={allow} />
            <Button title="Şimdi değil" variant="text" onPress={done} />
          </>
        }>
        <OnboardingHeader step={4} tone="permission" onBack={joinedViaInvite ? undefined : goBack} />

        {/* Diken'in sözü: kuyruk aşağıda Diken'in başına bakar */}
        <SpeechBubble size="lg" tail="bottom-left" tailOffset={m.permissionTailOffset} style={styles.card}>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
            Seni dürtmeme izin ver.
          </Text>
          <Text style={[t.lead, styles.cardBody, { color: colors.textBody }]}>
            Söz, sadece gün bitmek üzereyken ve arkadaşların seni dürttüğünde yazarım.
          </Text>
        </SpeechBubble>

        <View style={styles.diken}>
          <Diken mood="laf" stage="tam" size={m.permissionDikenSize} />
        </View>

        {/* Örnek bildirim */}
        <View
          accessible
          accessibilityLabel="Örnek bildirim: Diken, Gün bitiyor, 2 görevin duruyor. Susuz kaldım burada."
          style={[styles.preview, { backgroundColor: c.previewBg, borderColor: c.previewBorder }]}>
          <View style={[styles.appIcon, { backgroundColor: c.appIconBg }]}>
            <DikenFaceIcon size={m.appIconSize} />
          </View>
          <View style={styles.previewTexts}>
            <View style={styles.previewMeta}>
              <Text style={[typography.meta, { color: colors.textSecondary }]}>Gazla</Text>
              <Text style={[typography.meta, { color: colors.textSecondary }]}>21:30</Text>
            </View>
            <Text style={[t.previewTitle, { color: colors.text }]}>Diken</Text>
            <Text style={[t.previewBody, { color: colors.textBody }]}>
              Gün bitiyor, 2 görevin duruyor. Susuz kaldım burada.
            </Text>
          </View>
        </View>
      </StepScreen>
      <ToastHost toast={toast} offset={m.toastAboveFooter} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  card: {
    marginTop: m.permissionCardMarginTop,
  },
  cardBody: {
    marginTop: m.permissionBodyMarginTop,
  },
  diken: {
    marginTop: m.permissionDikenMarginTop,
    alignItems: 'center',
  },
  preview: {
    marginTop: m.previewMarginTop,
    paddingVertical: m.previewPaddingY,
    paddingHorizontal: m.previewPaddingX,
    borderRadius: m.previewRadius,
    borderWidth: borderWidth.thin,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m.previewGap,
  },
  appIcon: {
    width: m.appIconSize,
    height: m.appIconSize,
    borderRadius: m.appIconRadius,
    overflow: 'hidden',
  },
  previewTexts: {
    flex: 1,
    gap: m.previewTextGap,
  },
  previewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
