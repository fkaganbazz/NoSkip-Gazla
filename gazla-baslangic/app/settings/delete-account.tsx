import { useRouter } from 'expo-router';
import { useState, type ComponentType } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Diken from '@/components/Diken';
import { CameraIcon, FriendsIcon, StreakIcon, type IconProps } from '@/components/icons';
import { Button, ScreenHeader, TextField } from '@/components/ui';
import { useDeleteAccount, useStreak } from '@/data';
import { errorText, isDeleteConfirmed } from '@/features/settings/logic';
import { useT } from '@/i18n';
import { borderWidth, layout, typography, useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as st } from '@/theme/settings';

// Hesabı sil — design/DeleteAccount.dc.html. "SİL" (İngilizcede "DELETE") yazınca buton açılır; başarıda oturum
// kapanır, kök düzendeki koruma onboarding'e geçirir.
export default function DeleteAccountScreen() {
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const streak = useStreak();
  const account = useDeleteAccount();
  const [confirm, setConfirm] = useState('');
  const t = useT();
  const d = t.settings.deleteAccount;

  const days = streak.data?.currentStreak ?? 0;
  const losses: { icon: ComponentType<IconProps>; label: string }[] = [
    { icon: StreakIcon, label: days > 0 ? d.streakAndGarden(days) : d.streakAndGardenNone },
    { icon: FriendsIcon, label: d.friends },
    { icon: CameraIcon, label: d.photos },
  ];
  const confirmed = isDeleteConfirmed(confirm, d.confirmWord);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + layout.screenTopGap, paddingBottom: insets.bottom + m.deletePaddingBottom },
        ]}>
        <ScreenHeader title={d.title} size="compact" />

        <View style={styles.diken}>
          <Diken mood="solgun" size={m.deleteDikenSize} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={[st.deleteTitle, styles.center, { color: colors.text }]}>{d.heading}</Text>
          <Text style={[typography.body, styles.center, { color: colors.textBody }]}>{d.body}</Text>
        </View>

        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {losses.map(({ icon: Icon, label }, i) => (
            <View
              key={label}
              style={[
                styles.lossRow,
                // Tasarımda content-box: ayraç 52'nin dışında (52 + 1)
                i < losses.length - 1 && {
                  minHeight: m.deleteRowHeight + borderWidth.thin,
                  borderBottomWidth: borderWidth.thin,
                  borderBottomColor: settingsColors[scheme].rowDivider,
                },
              ]}>
              <Icon color={colors.dangerText} size={m.deleteIconSize} strokeWidth={m.deleteIconStrokeWidth} />
              <Text style={[st.deleteRow, styles.flex, { color: colors.text }]}>{label}</Text>
            </View>
          ))}
        </View>

        <TextField
          label={d.confirmLabel}
          placeholder={d.confirmWord}
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="characters"
          autoCorrect={false}
          inputStyle={st.deleteConfirmInput}
          style={styles.confirm}
        />

        <View style={styles.actions}>
          {account.isError && (
            <Text accessibilityLiveRegion="polite" style={[typography.meta, styles.center, { color: colors.dangerText }]}>
              {errorText(account.error, t)}
            </Text>
          )}
          <Button
            title={d.submit}
            variant="danger"
            disabled={!confirmed}
            loading={account.isLoading}
            onPress={() => account.deleteAccount()}
          />
          <Button title={d.stay} variant="text" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
  },
  diken: {
    marginTop: m.deleteDikenMarginTop,
    alignItems: 'center',
  },
  titleBlock: {
    marginTop: m.deleteTitleMarginTop,
    gap: m.deleteTitleGap,
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
  list: {
    marginTop: m.deleteListMarginTop,
    borderRadius: m.deleteListRadius,
    borderWidth: borderWidth.thin,
  },
  lossRow: {
    minHeight: m.deleteRowHeight,
    paddingHorizontal: m.rowPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  flex: {
    flex: 1,
  },
  confirm: {
    marginTop: m.confirmMarginTop,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: m.confirmMarginTop,
    gap: m.actionsGap,
  },
});
