import { useRouter } from 'expo-router';
import { useState, type ComponentType } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Diken from '@/components/Diken';
import { CameraIcon, FriendsIcon, StreakIcon, type IconProps } from '@/components/icons';
import { Button, IconButton, TextField } from '@/components/ui';
import { useDeleteAccountMutation, useStreak } from '@/data';
import { errorText, isDeleteConfirmed } from '@/features/settings/logic';
import { borderWidth, layout, typography, useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

// Hesabı sil — design/DeleteAccount.dc.html. "SİL" yazınca buton açılır; başarıda oturum kapanır,
// kök düzendeki koruma onboarding'e geçirir.
export default function DeleteAccountScreen() {
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const streak = useStreak();
  const remove = useDeleteAccountMutation();
  const [confirm, setConfirm] = useState('');

  const days = streak.data?.currentStreak ?? 0;
  const losses: { icon: ComponentType<IconProps>; label: string }[] = [
    { icon: StreakIcon, label: days > 0 ? `${days} günlük serin ve bahçen` : 'Serin ve bahçen' },
    { icon: FriendsIcon, label: 'Arkadaşların ve grupların' },
    { icon: CameraIcon, label: 'Fotoğraf kanıtların ve mesajların' },
  ];
  const confirmed = isDeleteConfirmed(confirm);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + layout.screenTopGap, paddingBottom: insets.bottom + m.deletePaddingBottom },
        ]}>
        <View style={styles.header}>
          <IconButton icon="back" accessibilityLabel="Geri" />
          <Text accessibilityRole="header" style={[t.headerTitle, { color: colors.text }]}>
            Hesabı sil
          </Text>
        </View>

        <View style={styles.diken}>
          <Diken mood="solgun" size={m.deleteDikenSize} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={[t.deleteTitle, styles.center, { color: colors.text }]}>Gitmek mi istiyorsun?</Text>
          <Text style={[typography.body, styles.center, { color: colors.textBody }]}>
            Hesabını silersen bunlar kalıcı olarak silinir. Bu işlem geri alınamaz.
          </Text>
        </View>

        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {losses.map(({ icon: Icon, label }, i) => (
            <View
              key={label}
              style={[
                styles.lossRow,
                i < losses.length - 1 && {
                  borderBottomWidth: borderWidth.thin,
                  borderBottomColor: settingsColors[scheme].rowDivider,
                },
              ]}>
              <Icon color={colors.danger} size={m.deleteIconSize} strokeWidth={m.deleteIconStrokeWidth} />
              <Text style={[t.deleteRow, styles.flex, { color: colors.text }]}>{label}</Text>
            </View>
          ))}
        </View>

        <TextField
          label="Onaylamak için SİL yaz"
          placeholder="SİL"
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.confirm}
        />

        <View style={styles.actions}>
          {remove.isError && (
            <Text accessibilityLiveRegion="polite" style={[typography.meta, styles.center, { color: colors.danger }]}>
              {errorText(remove.error)}
            </Text>
          )}
          <Button
            title="Hesabımı kalıcı olarak sil"
            variant="danger"
            disabled={!confirmed}
            loading={remove.isPending}
            onPress={() => remove.mutate()}
            style={styles.deleteButton}
          />
          <Button title="Vazgeç, kalıyorum" variant="text" onPress={() => router.back()} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
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
  deleteButton: {
    height: m.confirmButtonHeight,
  },
});
