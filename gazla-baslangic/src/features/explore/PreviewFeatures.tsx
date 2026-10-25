import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CheckIcon, SolidDropIcon, StarIcon } from '@/components/icons';
import type { TaskType } from '@/data';
import { useT } from '@/i18n';
import { challengeTints, useTheme } from '@/theme';
import { previewColors, previewMetrics as m, previewTypography } from '@/theme/explore';

// "Nasıl işler" satırları: işaretleme, kurtarma, bahçe (ChallengePreview.dc.html).
export default function PreviewFeatures({ taskType }: { taskType: TaskType }) {
  const { scheme } = useTheme();
  const green = challengeTints.green[scheme];
  const butter = challengeTints.butter[scheme];
  const rescue = previewColors[scheme];
  const t = useT();
  const f = t.explore.preview.features;

  return (
    <View style={styles.list}>
      <Feature bg={green.bg} text={f.taskType[taskType]}>
        <CheckIcon color={green.ink} size={m.featureIconSize} strokeWidth={m.checkIconStrokeWidth} />
      </Feature>
      <Feature bg={rescue.rescueTileBg} text={f.rescue}>
        <SolidDropIcon color={rescue.rescueTileInk} size={m.featureIconSize} />
      </Feature>
      <Feature bg={butter.bg} text={f.garden}>
        <StarIcon color={butter.ink} size={m.featureIconSize} strokeWidth={m.starIconStrokeWidth} />
      </Feature>
    </View>
  );
}

function Feature({ bg, text, children }: { bg: string; text: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.tile, { backgroundColor: bg }]}>{children}</View>
      <Text style={[previewTypography.feature, styles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: m.featuresMarginTop,
    gap: m.featureGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.featureInnerGap,
  },
  tile: {
    width: m.featureTile,
    height: m.featureTile,
    borderRadius: m.featureTileRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
});
