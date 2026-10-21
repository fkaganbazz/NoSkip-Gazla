import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Diken from '@/components/Diken';
import { Button, IconButton } from '@/components/ui';
import ConsentPoints from '@/features/ad-consent/ConsentPoints';
import { layout, typography, useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

// Reklam izni — design/AdConsent.dc.html (modal). UMP izin formu / iOS ATT henüz kurulu değil:
// "Devam" kurulunca sistem iznini açacak; şimdilik modalı kapatır. İzin sonucu için user_settings'te alan yok.
export default function AdConsentScreen() {
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + layout.screenTopGap, paddingBottom: insets.bottom + m.adPaddingBottom },
      ]}>
      <View style={styles.closeRow}>
        <IconButton icon="close" accessibilityLabel="Kapat" onPress={close} />
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
        {/* TODO: UMP izin formu + iOS ATT kurulunca burada istenecek */}
        <Button title="Devam" onPress={close} />
        <Button title="Reklam tercihlerini yönet" variant="text" onPress={() => router.dismissTo('/settings')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
