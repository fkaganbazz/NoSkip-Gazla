import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import Diken from '@/components/Diken';
import { CheckIcon, challengeIcons } from '@/components/icons';
import { Button, ErrorState, IconButton, LoadingState } from '@/components/ui';
import { useChallenge, useChallengeCalendar, useCheckinMutation, useToday } from '@/data';
import { BubbleTail } from '@/features/checkin/icons';
import { formatNumber, pastValues, targetText, unitName } from '@/features/checkin/logic';
import StepButton from '@/features/checkin/StepButton';
import { borderWidth, challengeTints, componentTypography, layout, radius, spacing, typography, useTheme } from '@/theme';
import {
  numberEntryColors,
  numberEntryMetrics as m,
  numberEntryTypography as t,
} from '@/theme/checkin';

// Sayı gir — design/NumberEntry.dc.html. Alt sayfa (formSheet); web'de normal sayfa gibi açılır.
// Hedef, birim ve gün numarası my_today'den; adım ve üst sınır challenge'ın sayı ayarlarından.
export default function NumberEntryScreen() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const c = numberEntryColors[scheme];

  const today = useToday();
  const challenge = useChallenge(id);
  const calendar = useChallengeCalendar(id);
  const checkin = useCheckinMutation();

  const task = useMemo(
    () => today.data?.find((x) => x.challengeId === id && (!date || x.localDate === date)),
    [today.data, id, date],
  );
  const [picked, setPicked] = useState<number | null>(null);

  if (today.isPending) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <LoadingState />
      </View>
    );
  }
  if (today.isError || !task) {
    return (
      <View style={[styles.state, { backgroundColor: colors.background }]}>
        <ErrorState
          message={today.isError ? undefined : 'Bu görev bugün işaretlenemiyor.'}
          onRetry={today.isError ? () => today.refetch() : () => router.back()}
        />
      </View>
    );
  }

  const unit = task.numberUnit ?? '';
  const target = task.target;
  const step = challenge.data?.number?.step ?? 1;
  const max = challenge.data?.number?.max ?? null;
  const value = picked ?? task.value ?? target ?? 0;
  const set = (n: number) => setPicked(Math.max(0, max === null ? n : Math.min(max, n)));
  const past = calendar.data ? pastValues(calendar.data.checkins, task.localDate) : null;
  const tint = challengeTints[task.tint][scheme];
  const Icon = challengeIcons[task.icon];
  const targetLabel = target === null ? null : targetText(value, target, unit);

  const save = () =>
    checkin.mutate(
      { challengeId: task.challengeId, localDate: task.localDate, value },
      { onSuccess: () => router.back() },
    );

  return (
    <View style={[styles.sheet, { backgroundColor: colors.background }]}>
      {Platform.OS !== 'ios' && <View style={[styles.grabber, { backgroundColor: c.grabber }]} />}

      {/* Diken ve balon: tasarımda sayfanın üstünde duruyor; alt sayfa dışına çizilemediği için içeride. */}
      {target !== null && (
        <View style={styles.dikenRow}>
          <View style={styles.diken}>
            <Diken mood="laf" stage="tam" size={m.dikenSize} />
          </View>
          <View style={styles.bubbleWrap}>
            <View style={[styles.bubble, { backgroundColor: c.bubbleBg }]}>
              <Text style={[t.bubble, { color: c.bubbleText }]}>
                {`${formatNumber(target)} yeter, abartma. Ama abartırsan saygı duyarım.`}
              </Text>
            </View>
            <View style={styles.tail}>
              <BubbleTail color={c.bubbleBg} width={m.bubbleTailWidth} height={m.bubbleTailHeight} />
            </View>
          </View>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={[styles.iconTile, { backgroundColor: tint.bg }]}>
            <Icon color={tint.ink} size={m.iconSize} strokeWidth={m.iconStrokeWidth} />
          </View>
          <View style={styles.headerTexts}>
            <Text accessibilityRole="header" numberOfLines={2} style={[t.title, { color: colors.text }]}>
              {task.title}
            </Text>
            <Text style={[typography.meta, { color: colors.textSecondary }]}>
              {target === null
                ? `${task.dayIndex}. gün`
                : `${task.dayIndex}. gün · Bugünkü hedef ${formatNumber(target)} ${unit}`}
            </Text>
          </View>
          <IconButton icon="close" onPress={() => router.back()} />
        </View>

        <View style={styles.stepper}>
          <StepButton
            kind="minus"
            onPress={() => set(value - step)}
            accessibilityLabel={`${formatNumber(step)} ${unitName(unit)} azalt`}
          />
          <View
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${formatNumber(value)} ${unitName(unit)}`}
            style={styles.valueRow}>
            <Text style={[t.value, { color: colors.text }]}>{formatNumber(value)}</Text>
            <Text style={[t.unit, { color: colors.textSecondary }]}>{unit}</Text>
          </View>
          <StepButton
            kind="plus"
            onPress={() => set(value + step)}
            accessibilityLabel={`${formatNumber(step)} ${unitName(unit)} artır`}
          />
        </View>

        {target !== null && targetLabel && (
          <View style={styles.chipRow}>
            <View
              style={[
                styles.chip,
                { backgroundColor: value >= target ? c.onTargetBg : c.belowTargetBg },
              ]}>
              {value >= target && (
                <CheckIcon color={c.onTargetText} size={m.chipIconSize} strokeWidth={m.chipIconStrokeWidth} />
              )}
              <Text style={[typography.captionStrong, { color: value >= target ? c.onTargetText : c.belowTargetText }]}>
                {targetLabel}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.quickRow}>
          {m.quickMultipliers.map((k) => {
            const amount = step * k;
            return (
              <Pressable
                key={k}
                onPress={() => set(value + amount)}
                accessibilityRole="button"
                accessibilityLabel={`${formatNumber(amount)} ${unitName(unit)} ekle`}
                style={({ pressed }) => [
                  styles.quick,
                  { backgroundColor: pressed ? colors.surfaceMuted : c.quickBg, borderColor: c.quickBorder },
                ]}>
                <Text style={[t.quick, { color: colors.text }]}>{`+${formatNumber(amount)} ${unit}`}</Text>
              </Pressable>
            );
          })}
        </View>

        {past && (past.yesterday !== null || past.best !== null) && (
          <View style={[styles.stats, { backgroundColor: c.statsBg }]}>
            {past.yesterday !== null && (
              <Text style={[typography.caption, { color: c.statsText }]}>
                {'Dün: '}
                <Text style={[styles.statsValue, { color: c.statsValue }]}>{`${formatNumber(past.yesterday)} ${unit}`}</Text>
              </Text>
            )}
            {past.best !== null && (
              <Text style={[typography.caption, { color: c.statsText }]}>
                {'En iyin: '}
                <Text style={[styles.statsValue, { color: c.statsValue }]}>{`${formatNumber(past.best)} ${unit}`}</Text>
              </Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          {checkin.isError && (
            <Text accessibilityLiveRegion="polite" style={[componentTypography.inputError, styles.error, { color: colors.danger }]}>
              {checkin.error.message}
            </Text>
          )}
          <Button title="Kaydet" onPress={save} loading={checkin.isPending} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    minHeight: m.sheetMinHeight,
  },
  sheet: {
    paddingTop: m.sheetPaddingTop,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: m.sheetPaddingBottom,
  },
  grabber: {
    alignSelf: 'center',
    width: m.grabberWidth,
    height: m.grabberHeight,
    borderRadius: m.grabberRadius,
  },
  dikenRow: {
    height: m.dikenSize * 1.25,
  },
  diken: {
    position: 'absolute',
    left: m.dikenLeft,
    top: 0,
  },
  bubbleWrap: {
    position: 'absolute',
    right: 0,
    top: m.bubbleTop,
    width: m.bubbleWidth,
  },
  bubble: {
    paddingVertical: m.bubblePaddingY,
    paddingHorizontal: m.bubblePaddingX,
    borderRadius: m.bubbleRadius,
  },
  tail: {
    position: 'absolute',
    left: m.bubbleTailLeft,
    top: m.bubbleTailTop,
  },
  // Tasarımda sayfa 506 yüksekliğinde, Kaydet en altta (margin-top: auto)
  body: {
    minHeight: m.sheetMinHeight - m.sheetPaddingTop - m.sheetPaddingBottom,
  },
  header: {
    marginTop: m.headerMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.headerGap,
  },
  iconTile: {
    width: m.iconTile,
    height: m.iconTile,
    borderRadius: m.iconTileRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
    gap: m.headerTextGap,
  },
  stepper: {
    marginTop: m.stepperMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueRow: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: m.valueGap,
  },
  chipRow: {
    marginTop: m.chipMarginTop,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.chipGap,
    paddingVertical: m.chipPaddingY,
    paddingHorizontal: m.chipPaddingX,
    borderRadius: radius.full,
  },
  quickRow: {
    marginTop: m.quickMarginTop,
    flexDirection: 'row',
    gap: m.quickGap,
  },
  quick: {
    flex: 1,
    height: m.quickHeight,
    borderRadius: m.quickRadius,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    marginTop: m.statsMarginTop,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: m.statsPaddingY,
    paddingHorizontal: m.statsPaddingX,
    borderRadius: m.statsRadius,
  },
  statsValue: {
    fontFamily: typography.captionStrong.fontFamily,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: m.saveMarginTop,
    gap: spacing.xs,
  },
  error: {
    textAlign: 'center',
  },
});
