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
import { useT } from '@/i18n';
import { useEnablePushNotifications } from '@/notifications';
import { borderWidth, componentMetrics, typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as ot } from '@/theme/onboarding';

// Seni dürtmeme izin ver — design/NotifPermission.dc.html (adım 4/4). İki buton da onboarding'i
// bitirir; uygulama açılınca kök düzen sekmelere geçer. "Bildirimlere izin ver": sistem izni, verildiyse Expo push
// token'ı kaydedilir (src/notifications; simülatörde ve web'de token yok), sonuç ne olursa olsun Bugün açılır.
// Geri: davet adımına (challenge varsa) ya da challenge seçimine; davetle katılan kişi için önceki adım yok
// (davet adımı atlandı, profil tamamlandı).
export default function NotifPermissionScreen() {
  const router = useRouter();
  const t = useT();
  const tx = t.onboarding.notifications;
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const { finish, pickedTemplateId, createdChallengeId, joinedViaInvite, inviteError, clearInviteError } =
    useOnboarding();
  const toast = useToast();
  const { show } = toast;
  const push = useEnablePushNotifications();

  // Bekleyen davete katılılamadıysa (geçersiz kod, grup dolu …) burada söylenir
  useEffect(() => {
    if (!inviteError) return;
    show({ message: inviteError, durationMs: componentMetrics.toastActionDurationMs });
    clearInviteError();
  }, [inviteError, clearInviteError, show]);

  // finish() sonrası kök düzendeki Stack.Protected (onboarding) grubunu kaldırır, sekmeler açılır
  const done = () => finish();

  // Reddedilse ya da token alınamasa da akış durmaz; izin sonradan verilirse token açılışta kaydedilir
  const allow = async () => {
    await push.enable();
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
            <Button title={tx.allow} onPress={allow} loading={push.pending} />
            <Button title={tx.notNow} variant="text" onPress={done} disabled={push.pending} />
          </>
        }>
        <OnboardingHeader step={4} tone="permission" onBack={joinedViaInvite ? undefined : goBack} />

        {/* Diken'in sözü: kuyruk aşağıda Diken'in başına bakar */}
        <SpeechBubble size="lg" tail="bottom-left" tailOffset={m.permissionTailOffset} style={styles.card}>
          <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
            {tx.title}
          </Text>
          <Text style={[ot.lead, styles.cardBody, { color: colors.textBody }]}>{tx.body}</Text>
        </SpeechBubble>

        <View style={styles.diken}>
          <Diken mood="laf" stage="tam" size={m.permissionDikenSize} />
        </View>

        {/* Örnek bildirim */}
        <View
          accessible
          accessibilityLabel={tx.previewA11y(tx.previewBody)}
          style={[styles.preview, { backgroundColor: c.previewBg, borderColor: c.previewBorder }]}>
          <View style={[styles.appIcon, { backgroundColor: c.appIconBg }]}>
            <DikenFaceIcon size={m.appIconSize} />
          </View>
          <View style={styles.previewTexts}>
            <View style={styles.previewMeta}>
              <Text style={[typography.meta, { color: colors.textSecondary }]}>{t.common.appName}</Text>
              <Text style={[typography.meta, { color: colors.textSecondary }]}>{tx.previewTime}</Text>
            </View>
            <Text style={[ot.previewTitle, { color: colors.text }]}>{t.common.mascot}</Text>
            <Text style={[ot.previewBody, { color: colors.textBody }]}>{tx.previewBody}</Text>
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
