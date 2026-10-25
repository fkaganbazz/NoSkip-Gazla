import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { StreakIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { cardColors, cardMetrics as m, cardTypography, radius, useTheme } from '@/theme';

type Props = {
  /** Seri gün sayısı: "12 GÜNLÜK SERİ" */
  days: number;
  /** Metni değiştirmek için (varsayılan "{gün} GÜNLÜK SERİ") */
  label?: string;
  style?: StyleProp<ViewStyle>;
};

// Seri hapı: gece moru zemin, yeşil filiz ikonu ve büyük harf metin (Today.dc.html; koyuda TodayDark'taki
// koyu yeşil zemin). Tasarımlarda yalnızca Bugün kahraman kartında ve Components'ta geçiyor.
export function StreakChip({ days, label, style }: Props) {
  const { scheme } = useTheme();
  const t = useT();
  const c = cardColors[scheme];
  return (
    <View
      accessible
      accessibilityLabel={t.components.streakChip.a11y(days)}
      style={[styles.chip, { backgroundColor: c.streakChipBg }, style]}>
      <StreakIcon color={c.streakChipIcon} size={m.streakIconSize} strokeWidth={m.streakIconStrokeWidth} />
      <Text style={[cardTypography.streakChip, { color: c.streakChipText }]}>{label ?? t.components.streakChip.label(days)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.streakChipGap,
    paddingVertical: m.streakChipPaddingY,
    paddingLeft: m.streakChipPaddingLeft,
    paddingRight: m.streakChipPaddingRight,
    borderRadius: radius.full,
  },
});
