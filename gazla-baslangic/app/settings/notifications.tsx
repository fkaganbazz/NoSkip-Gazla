import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OptionSheet from '@/components/OptionSheet';
import { Chip, ErrorState, LoadingState, ScreenHeader, SectionLabel, ToastHost, useToast, type ChipTone } from '@/components/ui';
import { useMySettings, useUpdateSettingsMutation, type SettingsUpdate } from '@/data';
import { DEFAULT_REMINDER, errorText, formatTime, reminderTimes } from '@/features/settings/logic';
import { NOTIFICATION_COPY, NOTIFICATION_RULES, type RuleTone } from '@/features/settings/notificationCopy';
import { LinkRow, SettingsGroup, ToggleRow } from '@/features/settings/rows';
import { usePushPrompt } from '@/features/settings/usePushPrompt';
import { borderWidth, layout, useTheme, type ChallengeTint } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

/** Kural çipinin rengi: gece moru (ink), lila (challenge rengi), şeftali (warning) */
const RULE_CHIP: Record<RuleTone, { tone?: ChipTone; tint?: ChallengeTint }> = {
  strong: { tone: 'ink' },
  lilac: { tint: 'lilac' },
  peach: { tone: 'warning' },
};

// Bildirimler — design/Notifications.dc.html (kurallar ve metinler) + Settings.dc.html satır dili.
// Tercihler user_settings: dürtme bildirimi ve günlük hatırlatma saati. Sessiz saat kuralı sunucuda.
export default function NotificationsScreen() {
  const { colors, scheme } = useTheme();
  const c = settingsColors[scheme];
  const insets = useSafeAreaInsets();
  const settings = useMySettings();
  const update = useUpdateSettingsMutation();
  const toast = useToast();
  const [timeOpen, setTimeOpen] = useState(false);

  const save = (u: SettingsUpdate) => update.mutate(u, { onError: (e) => toast.show({ message: errorText(e) }) });
  // Bildirim açan anahtarlar izni de ister (onboarding'i atlayan hesaplar)
  const promptPush = usePushPrompt(toast);
  const top = { paddingTop: insets.top + layout.screenTopGap };


  if (settings.isPending || settings.isError) {
    return (
      <View style={[styles.screen, styles.padded, top]}>
        <ScreenHeader title="Bildirimler" />
        {settings.isPending ? <LoadingState /> : <ErrorState onRetry={() => settings.refetch()} />}
      </View>
    );
  }

  const s = settings.data;
  const reminderOn = s.dailyReminderTime !== null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.padded, top, { paddingBottom: insets.bottom + m.screenPaddingBottom }]}>
        <ScreenHeader title="Bildirimler" />

        <View style={styles.chips}>
          {/* Kural çipleri (Notifications.dc.html): gece moru, lila, şeftali */}
          {NOTIFICATION_RULES.map((r) => (
            <Chip key={r.label} label={r.label} {...RULE_CHIP[r.tone]} />
          ))}
        </View>

        <SectionLabel style={styles.section}>TERCİHLER</SectionLabel>
        <SettingsGroup>
          <ToggleRow
            title="Dürtme bildirimleri"
            detail="Arkadaşların gaz verince ya da laf sokunca haber verir."
            value={s.pokePushEnabled}
            disabled={update.isPending}
            onChange={(pokePushEnabled) => {
              save({ pokePushEnabled });
              if (pokePushEnabled) promptPush();
            }}
          />
          <ToggleRow
            title="Günlük hatırlatma"
            detail="Diken seçtiğin saatte bugünkü görevlerini hatırlatır."
            value={reminderOn}
            disabled={update.isPending}
            onChange={(on) => {
              save({ dailyReminderTime: on ? DEFAULT_REMINDER : null });
              if (on) promptPush();
            }}
            last={!reminderOn}
          />
          {reminderOn && (
            <LinkRow
              title="Hatırlatma saati"
              value={formatTime(s.dailyReminderTime)}
              disabled={update.isPending}
              onPress={() => setTimeOpen(true)}
              last
            />
          )}
        </SettingsGroup>

        <SectionLabel style={styles.section}>NE ZAMAN NE GELİR</SectionLabel>
        <SettingsGroup>
          {NOTIFICATION_COPY.map((row, i) => (
            <View
              key={row.when}
              style={[
                styles.copyRow,
                i < NOTIFICATION_COPY.length - 1 && { borderBottomWidth: borderWidth.thin, borderBottomColor: c.rowDivider },
              ]}>
              <Text style={[t.copyWhen, { color: colors.textSecondary }]}>{row.when}</Text>
              <Text style={[t.copyTitle, { color: row.from === 'diken' ? c.dikenTitle : c.friendTitle }]}>{row.title}</Text>
              <Text style={[t.copyBody, { color: colors.textBody }]}>{row.body}</Text>
            </View>
          ))}
        </SettingsGroup>
      </ScrollView>

      <OptionSheet
        visible={timeOpen}
        title="Hatırlatma saati"
        options={reminderTimes(s.dailyReminderTime).map((time) => ({ value: time, label: time }))}
        value={formatTime(s.dailyReminderTime)}
        onSelect={(dailyReminderTime) => save({ dailyReminderTime })}
        onClose={() => setTimeOpen(false)}
      />

      <ToastHost toast={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
  },
  chips: {
    marginTop: m.chipsMarginTop,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m.chipsGap,
  },
  section: {
    marginTop: m.sectionMarginTop,
  },
  copyRow: {
    paddingVertical: m.copyRowPaddingY,
    paddingHorizontal: m.rowPaddingX,
    gap: m.rowTextGap,
  },
});
