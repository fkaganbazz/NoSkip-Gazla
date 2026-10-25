import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import Diken from '@/components/Diken';
import { CheckIcon } from '@/components/icons';
import Sheet, { type SheetHandle } from '@/components/Sheet';
import SpeechBubble from '@/components/SpeechBubble';
import { Button, Chip, ErrorState, IconButton, LoadingState } from '@/components/ui';
import { useChallenge, useCheckin, useNumberStats, useTodayTasks } from '@/data';
import { useT } from '@/i18n';
import { formatNumber, targetText, unitName } from '@/features/checkin/logic';
import StepButton from '@/features/checkin/StepButton';
import { borderWidth, componentTypography, spacing, typography, useTheme } from '@/theme';
import {
  numberEntryColors,
  numberEntryMetrics as m,
  numberEntryTypography as ty,
} from '@/theme/checkin';
import { sheetDikenMetrics } from '@/theme/sheet';

const d = sheetDikenMetrics.numberEntry;

// Sayı gir — design/NumberEntry.dc.html. Alt sayfa (`Sheet`, route transparentModal); hedefli görevde
// sayfanın üstünde Diken + balon. Hedef, birim ve gün numarası my_today'den; adım ve üst sınır challenge'ın
// sayı ayarlarından; "Dün / En iyin / Grupta en iyi" useNumberStats'tan (o günün değerleri).
// Gün zaten kaydedildiyse sayfa o değerle açılır, "Kaydet" değeri değiştirir; altta "Bugünü geri al" (tasarımda yok)
// kaydı siler (Bugün'deki sağ buton sayı tipinde geri almaz, bu sayfayı açar).
export default function NumberEntryScreen() {
  // /checkin/number?challengeId=…&date=YYYY-AA-GG (date: işaretlenecek yerel gün; yoksa my_today'deki ilk satırı)
  const { challengeId, date } = useLocalSearchParams<{ challengeId: string; date?: string }>();
  const router = useRouter();
  const sheet = useRef<SheetHandle>(null);
  const { colors, scheme } = useTheme();
  const t = useT();
  const tn = t.checkin.number;
  const c = numberEntryColors[scheme];

  const today = useTodayTasks();
  const challenge = useChallenge(challengeId);
  const checkin = useCheckin();

  const task = useMemo(
    () => today.data?.find((x) => x.challengeId === challengeId && (!date || x.localDate === date)),
    [today.data, challengeId, date],
  );
  const stats = useNumberStats(challengeId, task?.localDate ?? date);
  const [picked, setPicked] = useState<number | null>(null);

  const close = () => sheet.current?.close();
  const shell = (content: ReactNode, top?: ReactNode) => (
    <Sheet
      ref={sheet}
      onClose={() => router.back()}
      top={top}
      minHeight={m.sheetMinHeight}
      accessibilityLabel={task ? tn.sheetLabelFor(task.title) : tn.sheetLabel}>
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
          message={today.isError ? undefined : t.checkin.notMarkable}
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
  const s = stats.data;
  // Tasarımdaki üç kutu; değeri olmayan "—". Hiçbiri yoksa (ilk gün, tek kişi) satır gösterilmez.
  const statItems = s
    ? [
        { label: tn.stats.yesterday, value: s.yesterday },
        { label: tn.stats.best, value: s.best },
        { label: tn.stats.groupBest, value: s.groupBest?.value ?? null, who: s.groupBest?.person.displayName },
      ]
    : [];
  const showStats = statItems.some((x) => x.value !== null);
  const targetLabel = target === null ? null : targetText(value, target, unit, t);
  const unitLabel = unitName(unit, t);

  // Kaydedince sayfa kapanır; hepsi bittiyse Bugün odağa dönünce tamamlama anını açar
  const save = () => {
    checkin.undo.reset();
    checkin.submitNumber({ challengeId: task.challengeId, localDate: task.localDate, value }, { onSuccess: close });
  };
  // Kayıtlı günü geri al: iyimser (Bugün hemen güncellenir), bitince sayfa kapanır; hata olursa burada yazar
  const undoDay = () => {
    checkin.submitNumber.reset();
    checkin.undo({ challengeId: task.challengeId, localDate: task.localDate }, { onSuccess: close });
  };
  const error = checkin.submitNumber.error ?? checkin.undo.error;

  // Diken ve balon: sayfanın üstünde, karartmanın üzerinde (yalnızca hedefli görevde)
  const top =
    target !== null ? (
      <View style={styles.top}>
        <View style={styles.diken}>
          <Diken mood="laf" stage="tam" size={sheetDikenMetrics.dikenSize} />
        </View>
        <SpeechBubble size="sm" tail="left" tailOffset={d.tailTop} shadow="none" style={styles.bubble}>
          {tn.dikenBubble(formatNumber(target))}
        </SpeechBubble>
      </View>
    ) : undefined;

  return shell(
    <>
      <View style={styles.header}>
        <CategoryTile icon={task.icon} tint={task.tint} size={m.iconTile} />
        <View style={styles.headerTexts}>
          <Text accessibilityRole="header" numberOfLines={2} style={[ty.title, { color: colors.text }]}>
            {task.title}
          </Text>
          <Text style={[typography.meta, { color: colors.textSecondary }]}>
            {target === null
              ? t.common.dayN(task.dayIndex)
              : `${t.common.dayN(task.dayIndex)} · ${tn.todayTarget(formatNumber(target), unit)}`}
          </Text>
        </View>
        <IconButton icon="close" accessibilityLabel={t.common.close} onPress={close} />
      </View>

      <View style={styles.stepper}>
        <StepButton
          kind="minus"
          onPress={() => set(value - step)}
          accessibilityLabel={tn.decrease(formatNumber(step), unitLabel)}
        />
        <View
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${formatNumber(value)} ${unitLabel}`}
          style={styles.valueRow}>
          <Text style={[ty.value, { color: colors.text }]}>{formatNumber(value)}</Text>
          <Text style={[ty.unit, { color: colors.textSecondary }]}>{unit}</Text>
        </View>
        <StepButton
          kind="plus"
          onPress={() => set(value + step)}
          accessibilityLabel={tn.increase(formatNumber(step), unitLabel)}
        />
      </View>

      {target !== null && targetLabel && (
        <View style={styles.chipRow}>
          {/* Hedef hapı: hedefte yeşil + tik, altında şeftali (NumberEntry.dc.html) */}
          {value >= target ? (
            <Chip size="sm" tone="success" icon={CheckIcon} label={targetLabel} />
          ) : (
            <Chip size="sm" tone="warning" label={targetLabel} />
          )}
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
              accessibilityLabel={tn.add(formatNumber(amount), unitLabel)}
              style={({ pressed }) => [
                styles.quick,
                { backgroundColor: pressed ? colors.surfaceMuted : c.quickBg, borderColor: c.quickBorder },
              ]}>
              <Text style={[ty.quick, { color: colors.text }]}>{`+${formatNumber(amount)} ${unit}`}</Text>
            </Pressable>
          );
        })}
      </View>

      {showStats && (
        <View style={[styles.stats, { backgroundColor: c.statsBg }]}>
          {statItems.map((x) => {
            const shown = x.value === null ? '—' : `${formatNumber(x.value)} ${unit}`.trim();
            return (
              <Text
                key={x.label}
                accessibilityLabel={
                  x.value === null
                    ? `${x.label}: ${tn.stats.none}`
                    : `${x.label}: ${formatNumber(x.value)} ${unitLabel}${x.who ? `, ${x.who}` : ''}`
                }
                style={[typography.caption, { color: c.statsText }]}>
                {`${x.label}: `}
                <Text style={[styles.statsValue, { color: c.statsValue }]}>{shown}</Text>
              </Text>
            );
          })}
        </View>
      )}

      <View style={styles.footer}>
        {error && (
          <Text accessibilityLiveRegion="polite" style={[componentTypography.inputError, styles.error, { color: colors.dangerText }]}>
            {error.message}
          </Text>
        )}
        <Button title={t.common.save} onPress={save} loading={checkin.submitNumber.isPending} disabled={checkin.undo.isPending} />
        {/* Geri alma sürerken de görünür (iyimser güncelleme görevi hemen "yapılmadı" yapar) */}
        {(task.done || checkin.undo.isPending) && (
          <Button
            title={t.checkin.undoDay}
            variant="text"
            size="md"
            onPress={undoDay}
            loading={checkin.undo.isPending}
            disabled={checkin.submitNumber.isPending}
            accessibilityHint={tn.undoHint}
          />
        )}
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: spacing.xs,
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
