import { StyleSheet, Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as ty } from '@/theme/settings';

import { PlayIcon, TargetIcon } from './icons';

/** Reklam izni maddeleri: renkli karo + metin (AdConsent.dc.html) */
export default function ConsentPoints() {
  const { colors, scheme } = useTheme();
  const t = useT();
  const c = settingsColors[scheme];
  const points = [
    {
      bg: c.adNoAdBg,
      icon: <CheckIcon color={c.adNoAdInk} size={m.adCheckSize} strokeWidth={m.adCheckStrokeWidth} />,
      text: t.adConsent.points.noAds,
    },
    {
      bg: c.adRescueBg,
      icon: <PlayIcon color={c.adRescueInk} size={m.adPlaySize} />,
      text: t.adConsent.points.rescue,
    },
    {
      bg: c.adTargetBg,
      icon: <TargetIcon color={c.adTargetInk} size={m.adTargetSize} strokeWidth={m.adTargetStrokeWidth} />,
      text: t.adConsent.points.personalized,
    },
  ];

  return (
    <View style={styles.list}>
      {points.map((p) => (
        <View key={p.text} style={styles.row}>
          <View style={[styles.tile, { backgroundColor: p.bg }]}>{p.icon}</View>
          <Text style={[ty.adItem, styles.text, { color: colors.text }]}>{p.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: m.adListMarginTop,
    gap: m.adListGap,
  },
  row: {
    flexDirection: 'row',
    gap: m.rowGap,
  },
  tile: {
    width: m.adTile,
    height: m.adTile,
    borderRadius: m.adTileRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    paddingTop: m.adTextPaddingTop,
  },
});
