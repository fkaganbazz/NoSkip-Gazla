import { StyleSheet, Text, View } from 'react-native';

import { borderWidth, typography, useTheme } from '@/theme';
import { gardenMetrics as m, gardenTypography } from '@/theme/garden';

type Props = {
  currentStreak: number;
  completed: number;
  longestStreak: number;
};

// Üç istatistik kartı: aktif seri, tamamlanan, en uzun seri (Garden.dc.html). Sayılar sunucudan.
export default function StatRow({ currentStreak, completed, longestStreak }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Stat value={currentStreak} label="Aktif seri" valueColor={colors.actionText} />
      <Stat value={completed} label="Tamamlanan" valueColor={colors.text} />
      <Stat value={longestStreak} label="En uzun seri" valueColor={colors.text} />
    </View>
  );
}

function Stat({ value, label, valueColor }: { value: number; label: string; valueColor: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[gardenTypography.statValue, { color: valueColor }]}>{value}</Text>
      <Text numberOfLines={1} style={[typography.smallStrong, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: m.statsMarginTop,
    flexDirection: 'row',
    gap: m.statsGap,
  },
  card: {
    flex: 1,
    minWidth: 0,
    padding: m.statPadding,
    borderRadius: m.statRadius,
    borderWidth: borderWidth.thin,
    gap: m.statGap,
  },
});
