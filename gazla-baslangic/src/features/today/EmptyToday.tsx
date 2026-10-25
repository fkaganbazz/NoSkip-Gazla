import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import Diken from '@/components/Diken';
import { Button } from '@/components/ui';
import { useAuth, useUnreadCount } from '@/data';
import { useT } from '@/i18n';
import { layout, todayMetrics, typography, useTheme } from '@/theme';
import { emptyTodayColors as sc, emptyTodayMetrics as m, emptyTodayTypography as ty } from '@/theme/create';

import { formatDayLabel } from './logic';
import TodayHeader from './TodayHeader';
import { useNow } from './useNow';

type Props = {
  /** Kullanıcının adı (selamlama); verilmezse profilden */
  name?: string;
};

// Bugün'ün boş hali (aktif challenge yok) — design/EmptyToday.dc.html.
export default function EmptyToday({ name }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const now = useNow();
  const { profile } = useAuth();
  const unread = useUnreadCount().data ?? 0;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <TodayHeader
          dayLabel={formatDayLabel(now, t)}
          title={t.today.empty.greeting(name ?? profile?.displayName ?? '')}
          unread={unread}
          onPressBell={() => router.push('/activity')}
        />

        <View style={[styles.scene, { backgroundColor: sc.sceneBg }]}>
          <DesertScene />
          <View style={styles.diken}>
            <Diken mood="uykulu" stage="tam" size={m.dikenSize} />
          </View>
        </View>

        <View style={styles.texts}>
          <Text accessibilityRole="header" style={[ty.title, styles.center, { color: colors.text }]}>
            {t.today.empty.title}
          </Text>
          <Text style={[typography.body, styles.center, { color: colors.textBody }]}>{t.today.empty.body}</Text>
        </View>

        <View style={styles.buttons}>
          <Button title={t.today.empty.findChallenge} onPress={() => router.navigate('/explore')} />
          {/* EmptyToday.dc.html: ikincil buton 54 */}
          <Button
            title={t.today.empty.createOwn}
            variant="secondary"
            size="lgCompact"
            onPress={() => router.push('/create')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Güneş, bulut, kum tepeleri ve çakıllar (350×310 çizim; kart genişledikçe ortadan kırpılır) */
function DesertScene() {
  return (
    <Svg
      width="100%"
      height={m.sceneHeight}
      viewBox={`0 0 ${m.sceneViewWidth} ${m.sceneHeight}`}
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}>
      <Circle cx={286} cy={66} r={34} fill={sc.sun} />
      <Circle cx={286} cy={66} r={48} fill="none" stroke={sc.sun} strokeWidth={4} opacity={0.35} />
      <Path
        d="M44 58 C54 52 66 52 74 58 C80 54 90 54 96 60"
        fill="none"
        stroke={sc.cloud}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Path d="M0 238 C60 212 120 214 180 230 C240 246 300 240 350 222 V310 H0 Z" fill={sc.duneBack} />
      <Path d="M0 270 C80 250 150 256 220 270 C270 280 310 276 350 266 V310 H0 Z" fill={sc.duneFront} />
      <Circle cx={64} cy={266} r={4} fill={sc.pebble} />
      <Circle cx={292} cy={258} r={3} fill={sc.pebble} />
      <Circle cx={250} cy={286} r={5} fill={sc.pebble} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: layout.screenTopGap,
    paddingHorizontal: layout.screenPadding,
    // Alt menünün + butonu sahneye taşar; butonlar onun altında kalmasın
    paddingBottom: todayMetrics.contentPaddingBottom,
  },
  scene: {
    marginTop: m.sceneMarginTop,
    height: m.sceneHeight,
    borderRadius: m.sceneRadius,
    overflow: 'hidden',
  },
  // Tasarımda left 80 (350 genişlikte ortada)
  diken: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: m.dikenBottom,
    alignItems: 'center',
  },
  texts: {
    marginTop: m.textsMarginTop,
    alignItems: 'center',
    gap: m.textsGap,
  },
  center: {
    textAlign: 'center',
  },
  buttons: {
    marginTop: m.buttonsMarginTop,
    gap: m.buttonsGap,
  },
});
