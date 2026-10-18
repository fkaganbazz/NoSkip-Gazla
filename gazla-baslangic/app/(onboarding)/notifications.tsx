import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import Diken from '@/components/Diken';
import { flatShadowStyle } from '@/components/FlatShadow';
import { Button } from '@/components/ui';
import { DikenAppIcon } from '@/features/onboarding/icons';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import StepHeader from '@/features/onboarding/StepHeader';
import StepScreen from '@/features/onboarding/StepScreen';
import { borderWidth, typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

// Seni dürtmeme izin ver — design/NotifPermission.dc.html (adım 4/4). İki buton da onboarding'i
// bitirir; uygulama açılınca kök düzen sekmelere geçer.
export default function NotifPermissionScreen() {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const { finish, pickedTemplateId, createdChallengeId } = useOnboarding();

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
    router.canGoBack()
      ? router.back()
      : router.replace(pickedTemplateId || createdChallengeId ? '/(onboarding)/invite' : '/(onboarding)');

  return (
    <StepScreen
      backgroundColor={c.permissionBg}
      footer={
        <>
          <Button title="Bildirimlere izin ver" onPress={allow} />
          <Button title="Şimdi değil" variant="text" onPress={done} />
        </>
      }>
      <StepHeader step={4} tone="permission" onBack={pickedTemplateId || createdChallengeId ? goBack : undefined} />

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface },
          flatShadowStyle(m.permissionCardShadow, c.permissionCardShadow),
        ]}>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.text }]}>
          Seni dürtmeme izin ver.
        </Text>
        <Text style={[t.lead, styles.cardBody, { color: colors.textBody }]}>
          Söz, sadece gün bitmek üzereyken ve arkadaşların seni dürttüğünde yazarım.
        </Text>
        <Svg
          width={m.permissionTail.width}
          height={m.permissionTail.height}
          viewBox={`0 0 ${m.permissionTail.width} ${m.permissionTail.height}`}
          style={styles.tail}>
          <Path d="M0 0 H28 L10 20 Z" fill={colors.surface} />
        </Svg>
      </View>

      <View style={styles.diken}>
        <Diken mood="laf" stage="tam" size={m.permissionDikenSize} />
      </View>

      {/* Örnek bildirim */}
      <View
        accessible
        accessibilityLabel="Örnek bildirim: Diken, Gün bitiyor, 2 görevin duruyor. Susuz kaldım burada."
        style={[styles.preview, { backgroundColor: c.previewBg, borderColor: c.previewBorder }]}>
        <View style={[styles.appIcon, { backgroundColor: c.appIconBg }]}>
          <DikenAppIcon size={m.appIconSize} />
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
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.permissionCardMarginTop,
    paddingVertical: m.permissionCardPaddingY,
    paddingHorizontal: m.permissionCardPaddingX,
    borderRadius: m.permissionCardRadius,
  },
  cardBody: {
    marginTop: m.permissionBodyMarginTop,
  },
  tail: {
    position: 'absolute',
    left: m.permissionTail.left,
    bottom: m.permissionTail.bottom,
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
