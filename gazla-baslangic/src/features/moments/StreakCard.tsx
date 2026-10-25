import { StyleSheet, Text, View } from 'react-native';

import { CheckIcon, SolidDropIcon } from '@/components/icons';
import { formatNumber, useT } from '@/i18n';
import { celebrationColors as c, momentsMetrics as m, momentsTypography as ty } from '@/theme/moments';

import type { WeekCell } from './logic';

// Completion: seri sayısı ve son 7 gün (Completion.dc.html). Kum zeminli kart iki modda aynı.
export default function StreakCard({ streak, week }: { streak: number; week: WeekCell[] }) {
  const t = useT();
  const ts = t.moments.streakCard;
  return (
    <View style={[styles.card, { backgroundColor: c.cardBg }]}>
      <View accessible accessibilityLabel={ts.a11y(streak)} style={styles.column}>
        <Text style={[ty.streakNumber, { color: c.streakNumber }]}>{formatNumber(streak)}</Text>
        <Text style={[ty.streakLabel, { color: c.streakLabel }]}>{ts.label}</Text>
      </View>
      <View style={styles.week}>
        {week.map((d) => (
          <View key={d.key} style={styles.day}>
            <View
              accessible
              accessibilityLabel={`${d.label}: ${ts.dayState[d.state]}`}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    d.state === 'empty'
                      ? c.dayEmpty
                      : d.state === 'saved'
                        ? c.daySaved
                        : d.isToday
                          ? c.dayToday
                          : c.dayDone,
                },
                d.isToday ? { boxShadow: `0 0 0 ${m.dayRing}px ${c.dayTodayRing}` } : null,
              ]}>
              {d.state === 'done' ? (
                <CheckIcon color={c.dayCheck} size={m.dayCheckSize} strokeWidth={m.dayCheckStroke} />
              ) : d.state === 'saved' ? (
                <SolidDropIcon color={c.daySavedDrop} size={m.dayDropSize} />
              ) : null}
            </View>
            <View style={styles.label}>
              <Text numberOfLines={1} style={[ty.dayLabel, styles.labelText, { color: d.isToday ? c.dayLabelToday : c.dayLabel }]}>
                {d.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.streakCardTop,
    paddingVertical: m.streakCardPaddingY,
    paddingHorizontal: m.streakCardPaddingX,
    borderRadius: m.streakCardRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.streakCardGap,
  },
  column: {
    width: m.streakColumn,
    alignItems: 'center',
  },
  week: {
    flex: 1,
    flexDirection: 'row',
    gap: m.weekGap,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: m.weekGap,
  },
  // "Bugün" sütundan geniş; tasarımdaki gibi iki yana taşar
  label: {
    width: m.dayLabelWidth,
    alignItems: 'center',
  },
  labelText: {
    textAlign: 'center',
  },
  dot: {
    width: m.dayDot,
    height: m.dayDot,
    borderRadius: m.dayDot / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
