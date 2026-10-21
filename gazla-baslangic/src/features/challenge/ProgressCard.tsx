import { StyleSheet, Text, View } from 'react-native';

import { CheckIcon, SolidDropIcon } from '@/components/icons';
import { Card, Chip } from '@/components/ui';
import { challengeColors, challengeMetrics as m, challengeTypography as t } from '@/theme/challenge';
import { useTheme } from '@/theme';

import type { DayCell } from './logic';

type Props = {
  /** "Gün 12/30" */
  title: string;
  /** "18 gün kaldı" */
  detail: string | null;
  /** Bugünkü görev tamam: sağda yeşil çip */
  doneToday: boolean;
  days: DayCell[];
};

// İlerleme kartı: gün sayacı, bugün çipi, gün takvimi ve lejant (Detail.dc.html).
export default function ProgressCard({ title, detail, doneToday, days }: Props) {
  const { colors, scheme } = useTheme();
  const c = challengeColors[scheme];

  // 10'lu satırlar; son satır boş hücrelerle tamamlanır (7 günlük challenge da 10 sütunda)
  const rows: (DayCell | null)[][] = [];
  for (let i = 0; i < days.length; i += m.gridColumns) {
    const row: (DayCell | null)[] = days.slice(i, i + m.gridColumns);
    while (row.length < m.gridColumns) row.push(null);
    rows.push(row);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.dayRow}>
          <Text style={[t.day, { color: colors.text }]}>{title}</Text>
          {detail && <Text style={[t.detail, { color: colors.textSecondary }]}>{detail}</Text>}
        </View>
        {doneToday && <Chip size="xs" tone="success" icon={CheckIcon} label="Bugün tamam" />}
      </View>

      <View style={styles.grid}>
        {rows.map((row, r) => (
          <View key={r} style={styles.gridRow}>
            {row.map((d, i) => (d ? <Cell key={d.n} day={d} /> : <View key={`x${i}`} style={styles.cell} />))}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <LegendItem color={c.cellDone} label="Tamamlandı" />
        <LegendItem color={c.cellSavedDrop} label="Reklamla kurtarıldı" />
        <LegendItem color={c.cellToday} ring={c.cellTodayRing} label="Bugün" />
      </View>
    </Card>
  );
}

const STATE_LABEL: Record<DayCell['state'], string> = {
  done: 'tamamlandı',
  saved: 'kurtarıldı',
  today: 'bugün, tamamlandı',
  todayOpen: 'bugün, bekliyor',
  future: '',
};

function Cell({ day }: { day: DayCell }) {
  const { scheme } = useTheme();
  const c = challengeColors[scheme];
  const label = `Gün ${day.n}${STATE_LABEL[day.state] ? `, ${STATE_LABEL[day.state]}` : ''}`;
  const ring = day.state === 'today' || day.state === 'todayOpen' ? { boxShadow: `0 0 0 ${m.cellRing}px ${c.cellTodayRing}` } : null;
  const bg =
    day.state === 'done'
      ? c.cellDone
      : day.state === 'saved'
        ? c.cellSaved
        : day.state === 'today'
          ? c.cellToday
          : c.cellFuture;

  return (
    <View accessible accessibilityLabel={label} style={[styles.cell, { backgroundColor: bg }, ring]}>
      {day.state === 'done' || day.state === 'today' ? (
        <CheckIcon color={c.cellCheck} size={m.cellCheckSize} strokeWidth={m.cellCheckStroke} />
      ) : day.state === 'saved' ? (
        <SolidDropIcon color={c.cellSavedDrop} size={m.cellDropSize} />
      ) : (
        <Text style={[t.cell, { color: c.cellFutureText }]}>{day.n}</Text>
      )}
    </View>
  );
}

function LegendItem({ color, ring, label }: { color: string; ring?: string; label: string }) {
  const { scheme } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.swatch,
          { backgroundColor: color },
          ring ? { borderWidth: m.legendSwatchBorder, borderColor: ring } : null,
        ]}
      />
      <Text style={[t.legend, { color: challengeColors[scheme].legendText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.progressMarginTop,
    padding: m.cardPadding,
    borderRadius: m.cardRadius,
    gap: m.cardGap,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: m.dayGap,
    flexShrink: 1,
  },
  grid: {
    gap: m.gridGap,
  },
  gridRow: {
    flexDirection: 'row',
    gap: m.gridGap,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: m.cellRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: m.legendGap,
    rowGap: m.legendRowGap,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.legendItemGap,
  },
  swatch: {
    width: m.legendSwatch,
    height: m.legendSwatch,
    borderRadius: m.legendSwatchRadius,
  },
});
