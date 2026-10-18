import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import type { TaskType } from '@/data';
import { challengeTints, useTheme } from '@/theme';
import { previewColors, previewMetrics as m, previewTypography } from '@/theme/explore';

import { SolidDropIcon, StarIcon } from './icons';
import { TASK_TYPE_FEATURE } from './labels';

// "Nasıl işler" satırları: işaretleme, kurtarma, bahçe (ChallengePreview.dc.html).
export default function PreviewFeatures({ taskType }: { taskType: TaskType }) {
  const { scheme } = useTheme();
  const green = challengeTints.green[scheme];
  const butter = challengeTints.butter[scheme];
  const rescue = previewColors[scheme];

  return (
    <View style={styles.list}>
      <Feature bg={green.bg} text={TASK_TYPE_FEATURE[taskType]}>
        <CheckIcon color={green.ink} size={m.featureIconSize} strokeWidth={m.checkIconStrokeWidth} />
      </Feature>
      <Feature bg={rescue.rescueTileBg} text="Kaçırırsan Diken solar, sulayıp kurtarabilirsin">
        <SolidDropIcon color={rescue.rescueTileInk} size={m.featureIconSize} />
      </Feature>
      <Feature bg={butter.bg} text="Son gün bahçene yeni bir kaktüs eklenir">
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
