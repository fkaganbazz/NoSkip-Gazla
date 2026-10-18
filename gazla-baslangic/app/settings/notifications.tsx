import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, LoadingState, ScreenHeader, Toast } from '@/components/ui';
import { useMySettings, useUpdateSettingsMutation, type SettingsUpdate } from '@/data';
import { DEFAULT_REMINDER, REMINDER_OPTIONS, errorText, formatTime } from '@/features/settings/logic';
import { NOTIFICATION_COPY, NOTIFICATION_RULES, type RuleTone } from '@/features/settings/notificationCopy';
import OptionSheet from '@/features/settings/OptionSheet';
import { LinkRow, SettingsGroup, SettingsSection, ToggleRow } from '@/features/settings/rows';
import { useFlash } from '@/features/settings/useFlash';
import { borderWidth, layout, radius, useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

// Bildirimler — design/Notifications.dc.html (kurallar ve metinler) + Settings.dc.html satır dili.
// Tercihler user_settings: dürtme bildirimi ve günlük hatırlatma saati. Sessiz saat kuralı sunucuda.
export default function NotificationsScreen() {
  const { colors, scheme } = useTheme();
  const c = settingsColors[scheme];
  const insets = useSafeAreaInsets();
  const settings = useMySettings();
  const update = useUpdateSettingsMutation();
  const { message, flash } = useFlash();
  const [timeOpen, setTimeOpen] = useState(false);

  const save = (u: SettingsUpdate) => update.mutate(u, { onError: (e) => flash(errorText(e)) });
  const top = { paddingTop: insets.top + layout.screenTopGap };

  const chipColors: Record<RuleTone, { bg: string; text: string }> = {
    strong: { bg: c.ruleChipStrongBg, text: c.ruleChipStrongText },
    lilac: { bg: c.ruleChipLilacBg, text: c.ruleChipLilacText },
    peach: { bg: c.ruleChipPeachBg, text: c.ruleChipPeachText },
  };

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
          {NOTIFICATION_RULES.map((r) => (
            <View key={r.label} style={[styles.chip, { backgroundColor: chipColors[r.tone].bg }]}>
              <Text style={[t.ruleChip, { color: chipColors[r.tone].text }]}>{r.label}</Text>
            </View>
          ))}
        </View>

        <SettingsSection>TERCİHLER</SettingsSection>
        <SettingsGroup>
          <ToggleRow
            title="Dürtme bildirimleri"
            detail="Arkadaşların gaz verince ya da laf sokunca haber verir."
            value={s.pokePushEnabled}
            disabled={update.isPending}
            onChange={(pokePushEnabled) => save({ pokePushEnabled })}
          />
          <ToggleRow
            title="Günlük hatırlatma"
            detail="Diken seçtiğin saatte bugünkü görevlerini hatırlatır."
            value={reminderOn}
            disabled={update.isPending}
            onChange={(on) => save({ dailyReminderTime: on ? DEFAULT_REMINDER : null })}
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

        <SettingsSection>NE ZAMAN NE GELİR</SettingsSection>
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

      {message && <Toast message={message} style={[styles.toast, { bottom: insets.bottom + layout.screenPadding }]} />}

      <OptionSheet
        visible={timeOpen}
        title="Hatırlatma saati"
        options={REMINDER_OPTIONS}
        value={formatTime(s.dailyReminderTime)}
        onSelect={(dailyReminderTime) => save({ dailyReminderTime })}
        onClose={() => setTimeOpen(false)}
      />
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
  chip: {
    paddingVertical: m.ruleChipPaddingY,
    paddingHorizontal: m.ruleChipPaddingX,
    borderRadius: radius.full,
  },
  copyRow: {
    paddingVertical: m.copyRowPaddingY,
    paddingHorizontal: m.rowPaddingX,
    gap: m.rowTextGap,
  },
  toast: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
  },
});
