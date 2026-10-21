import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import Diken from '@/components/Diken';
import { CheckIcon } from '@/components/icons';
import Sheet, { type SheetHandle } from '@/components/Sheet';
import SpeechBubble from '@/components/SpeechBubble';
import { Button, ErrorState, IconButton, LoadingState } from '@/components/ui';
import { useChallenge, useChallengeCalendar, useCheckinMutation, useToday } from '@/data';
import { formatNumber, pastValues, targetText, unitName } from '@/features/checkin/logic';
import StepButton from '@/features/checkin/StepButton';
import { borderWidth, componentTypography, radius, spacing, typography, useTheme } from '@/theme';
import {
  numberEntryColors,
  numberEntryMetrics as m,
  numberEntryTypography as t,
} from '@/theme/checkin';
import { sheetDikenMetrics } from '@/theme/sheet';

const d = sheetDikenMetrics.numberEntry;

// Sayı gir — design/NumberEntry.dc.html. Alt sayfa (`Sheet`, route transparentModal); hedefli görevde
// sayfanın üstünde Diken + balon. Hedef, birim ve gün numarası my_today'den; adım ve üst sınır challenge'ın
// sayı ayarlarından.
export default function NumberEntryScreen() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const router = useRouter();
  const sheet = useRef<SheetHandle>(null);
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

  const close = () => sheet.current?.close();
  const shell = (content: ReactNode, top?: ReactNode) => (
    <Sheet
      ref={sheet}
      onClose={() => router.back()}
      top={top}
      minHeight={m.sheetMinHeight}
      accessibilityLabel={task ? `${task.title}: sayı gir` : 'Sayı gir'}>
      {content}
    </Sheet>
  );

  if (today.isPending) {
    return shell(
      <View style={styles.state}>
        <LoadingState />
      </View>,
    );
  }
  if (today.isError || !task) {
    return shell(
      <View style={styles.state}>
        <ErrorState
          message={today.isError ? undefined : 'Bu görev bugün işaretlenemiyor.'}
          onRetry={today.isError ? () => today.refetch() : close}
        />
      </View>,
    );
  }

  const unit = task.numberUnit ?? '';
  const target = task.target;
  const step = challenge.data?.number?.step ?? 1;
  const max = challenge.data?.number?.max ?? null;
  const value = picked ?? task.value ?? target ?? 0;
  const set = (n: number) => setPicked(Math.max(0, max === null ? n : Math.min(max, n)));
  const past = calendar.data ? pastValues(calendar.data.checkins, task.localDate) : null;
  const targetLabel = target === null ? null : targetText(value, target, unit);

  // Kaydedince sayfa kapanır; hepsi bittiyse Bugün odağa dönünce tamamlama anını açar
  const save = () =>
    checkin.mutate({ challengeId: task.challengeId, localDate: task.localDate, value }, { onSuccess: close });

  // Diken ve balon: sayfanın üstünde, karartmanın üzerinde (yalnızca hedefli görevde)
  const top =
    target !== null ? (
      <View style={styles.top}>
        <View style={styles.diken}>
          <Diken mood="laf" stage="tam" size={sheetDikenMetrics.dikenSize} />
        </View>
        <SpeechBubble size="sm" tail="left" tailOffset={d.tailTop} shadow="none" style={styles.bubble}>
          {`${formatNumber(target)} yeter, abartma. Ama abartırsan saygı duyarım.`}
        </SpeechBubble>
      </View>
    ) : undefined;

  return shell(
    <>
      <View style={styles.header}>
        <CategoryTile icon={task.icon} tint={task.tint} size={m.iconTile} />
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
        <IconButton icon="close" accessibilityLabel="Kapat" onPress={close} />
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
    </>,
    top,
  );
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    justifyContent: 'center',
  },
  top: {
    height: sheetDikenMetrics.dikenHeight,
    marginBottom: -d.overlap,
  },
  diken: {
    position: 'absolute',
    left: d.dikenLeft,
    top: 0,
  },
  bubble: {
    position: 'absolute',
    right: d.bubbleRight,
    top: d.bubbleTop,
    width: d.bubbleWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.headerGap,
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
