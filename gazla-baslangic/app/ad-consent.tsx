import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openPrivacyOptions, runConsentFlow } from '@/ads';
import Diken from '@/components/Diken';
import { Button, IconButton, ToastHost, useToast } from '@/components/ui';
import { adConsentShown } from '@/data';
import ConsentPoints from '@/features/ad-consent/ConsentPoints';
import { noPrivacyOptionsMessage, PRIVACY_OPTIONS_FAILED } from '@/features/ad-consent/messages';
import { layout, typography, useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

// Reklam izni — design/AdConsent.dc.html (modal). "Devam": UMP izin formu (yalnızca gerekiyorsa,
// AB/İngiltere) → iOS'ta ATT sistem isteği → reklam SDK'sı başlar → kapanır. "Reklam tercihlerini yönet":
// UMP gizlilik seçenekleri formu; bu kullanıcı için yoksa kısa bilgi tostu. Ön ekranda ödül, zorlama ya da
// sistem uyarısı taklidi yok (Apple kuralı). İzin sonucu cihazda (UMP/ATT) tutulur, sunucuda alan yok.
export default function AdConsentScreen() {
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [busy, setBusy] = useState<'continue' | 'manage' | null>(null);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Ön ekran gösterildi: "ilk günü tamamladıktan sonra bir kez" (Ayarlar'dan ya da seri kurtarmadan açılsa da)
  useEffect(() => {
    adConsentShown.set();
  }, []);

  const onContinue = async () => {
    setBusy('continue');
    // Hiçbir adım akışı durdurmaz: izin verilmese de, form açılamasa da ekran kapanır
    await runConsentFlow().catch(() => undefined);
    // Akış sürerken sayfa aşağı kaydırılıp kapatıldıysa alttaki ekranı kapatma
    if (navigation.isFocused()) close();
  };

  const onManage = async () => {
    setBusy('manage');
    const result = await openPrivacyOptions().catch(() => 'failed' as const);
    setBusy(null);
    if (result === 'notRequired') toast.show({ message: noPrivacyOptionsMessage() });
    else if (result === 'failed') toast.show({ message: PRIVACY_OPTIONS_FAILED });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + layout.screenTopGap, paddingBottom: insets.bottom + m.adPaddingBottom },
        ]}>
        <View style={styles.closeRow}>
          <IconButton icon="close" accessibilityLabel="Kapat" onPress={close} disabled={busy !== null} />
        </View>

        <View style={styles.hero}>
          <View style={[styles.circle, { backgroundColor: settingsColors[scheme].adCircle }]} />
          {/* Daire mutlak konumlu; Diken onun üstünde çizilsin */}
          <View style={styles.dikenLayer}>
            <Diken mood="mutlu" stage="tam" size={m.adDikenSize} />
          </View>
        </View>

        <Text accessibilityRole="header" style={[t.adTitle, styles.title, { color: colors.text }]}>
          Reklamlar Diken&apos;i ücretsiz tutuyor
        </Text>
        <Text style={[typography.body, styles.lead, { color: colors.textBody }]}>Nasıl çalıştığını baştan söyleyelim:</Text>

        <ConsentPoints />

        <View style={styles.actions}>
          <Text style={[t.note, styles.note, { color: colors.textSecondary }]}>
            Sonraki ekranda telefonun izin soracak. Kararını istediğin zaman Ayarlar&apos;dan değiştirebilirsin.
          </Text>
          <Button title="Devam" onPress={onContinue} loading={busy === 'continue'} disabled={busy === 'manage'} />
          <Button
            title="Reklam tercihlerini yönet"
            variant="text"
            onPress={onManage}
            loading={busy === 'manage'}
            disabled={busy === 'continue'}
          />
        </View>
      </ScrollView>
      <ToastHost toast={toast} />
    </View>
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
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  hero: {
    height: m.adHeroHeight,
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    top: m.adCircleTop,
    width: m.adCircleSize,
    height: m.adCircleSize,
    borderRadius: m.adCircleSize / 2,
  },
  dikenLayer: {
    position: 'relative',
  },
  title: {
    marginTop: m.adTitleMarginTop,
    // Kırılım tasarımdaki gibi "… ücretsiz / tutuyor" (açıklama: settingsMetrics.adTitleOverhang)
    marginRight: -m.adTitleOverhang,
  },
  lead: {
    marginTop: m.adLeadMarginTop,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: m.adListMarginTop,
    gap: m.actionsGap,
  },
  note: {
    marginBottom: m.adNoteMarginBottom,
    textAlign: 'center',
  },
});
