import { StyleSheet, Text, View } from 'react-native';

import { BellIcon } from '@/components/icons';
import { CountBadge, IconButton } from '@/components/ui';
import { todayMetrics as m, todayTypography, typography, useTheme } from '@/theme';

type Props = {
  dayLabel: string;
  title: string;
  unread: number;
  onPressBell?: () => void;
};

// Tarih, selamlama ve aktivite zili (Today.dc.html üst satır).
export default function TodayHeader({ dayLabel, title, unread, onPressBell }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{dayLabel}</Text>
        <Text accessibilityRole="header" style={[todayTypography.greeting, { color: colors.text }]}>
          {title}
        </Text>
      </View>

      <IconButton
        icon={BellIcon}
        onPress={onPressBell}
        accessibilityLabel={unread > 0 ? `Aktivite, ${unread} yeni` : 'Aktivite'}>
        {unread > 0 && (
          <View style={styles.badge}>
            <CountBadge count={unread} />
          </View>
        )}
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  texts: {
    flexShrink: 1,
    gap: m.headerGap,
  },
  // Okunmamış rozeti zilin sağ üst köşesinde
  badge: {
    position: 'absolute',
    top: m.badgeTop,
    right: m.badgeRight,
  },
});
