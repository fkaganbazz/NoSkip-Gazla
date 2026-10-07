import { StyleSheet, Text, View } from 'react-native';

import { BellIcon } from '@/components/icons';
import { borderWidth, todayMetrics as m, todayTypography, typography, useTheme } from '@/theme';

type Props = {
  dayLabel: string;
  title: string;
  unread: number;
};

// Tarih, selamlama ve aktivite zili (Today.dc.html üst satır).
export default function TodayHeader({ dayLabel, title, unread }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{dayLabel}</Text>
        <Text accessibilityRole="header" style={[todayTypography.greeting, { color: colors.text }]}>
          {title}
        </Text>
      </View>

      {/* Aktivite ekranı gelince bağlanacak */}
      <View
        accessible
        accessibilityLabel={unread > 0 ? `Aktivite, ${unread} yeni` : 'Aktivite'}
        style={[styles.bell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <BellIcon color={colors.text} size={m.bellIconSize} strokeWidth={m.bellIconStrokeWidth} />
        {unread > 0 && (
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.accent, borderColor: colors.background },
            ]}>
            <Text style={[typography.micro, { color: colors.onAccent }]}>{unread}</Text>
          </View>
        )}
      </View>
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
  bell: {
    width: m.bellSize,
    height: m.bellSize,
    borderRadius: m.bellSize / 2,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: m.badgeTop,
    right: m.badgeRight,
    minWidth: m.badgeSize,
    height: m.badgeSize,
    paddingHorizontal: m.badgePaddingX,
    borderRadius: m.badgeSize / 2,
    borderWidth: m.badgeBorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
