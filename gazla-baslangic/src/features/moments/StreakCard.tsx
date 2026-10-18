import { StyleSheet, Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { SolidDropIcon } from '@/features/challenge/icons';
import { celebrationColors as c, momentsMetrics as m, momentsTypography as t } from '@/theme/moments';

import type { WeekCell } from './logic';

// Completion: seri sayısı ve son 7 gün (Completion.dc.html). Kum zeminli kart iki modda aynı.
export default function StreakCard({ streak, week }: { streak: number; week: WeekCell[] }) {
  return (
    <View style={[styles.card, { backgroundColor: c.cardBg }]}>
      <View accessible accessibilityLabel={`${streak} günlük seri`} style={styles.column}>
        <Text style={[t.streakNumber, { color: c.streakNumber }]}>{streak}</Text>
        <Text style={[t.streakLabel, { color: c.streakLabel }]}>günlük seri</Text>
      </View>
      <View style={styles.week}>
        {week.map((d) => (
          <View key={d.key} style={styles.day}>
            <View
              accessible
              accessibilityLabel={`${d.label}: ${d.state === 'empty' ? 'boş' : d.state === 'saved' ? 'kurtarıldı' : 'tamam'}`}
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
              <Text numberOfLines={1} style={[t.dayLabel, styles.labelText, { color: d.isToday ? c.dayLabelToday : c.dayLabel }]}>
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
