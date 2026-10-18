import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Chip, ErrorState, LoadingState, ScreenHeader, Toast } from '@/components/ui';
import { useBlockedUsers, useUnblockUserMutation } from '@/data';
import { errorText } from '@/features/settings/logic';
import { LinkRow, SettingsGroup } from '@/features/settings/rows';
import { useFlash } from '@/features/settings/useFlash';
import { layout, typography, useTheme } from '@/theme';
import { settingsMetrics as m } from '@/theme/settings';

// Engellenenler — tasarım dosyası yok; Settings.dc.html satır/kart dili. Veri: blocks (useBlockedUsers).
export default function BlockedScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const blocked = useBlockedUsers();
  const unblock = useUnblockUserMutation();
  const { message, flash } = useFlash();

  const top = { paddingTop: insets.top + layout.screenTopGap };

  if (blocked.isPending || blocked.isError) {
    return (
      <View style={[styles.screen, styles.padded, top]}>
        <ScreenHeader title="Engellenenler" />
        {blocked.isPending ? <LoadingState /> : <ErrorState onRetry={() => blocked.refetch()} />}
      </View>
    );
  }

  const users = blocked.data;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.padded, top, { paddingBottom: insets.bottom + m.screenPaddingBottom }]}>
        <ScreenHeader title="Engellenenler" />

        {users.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[typography.cardTitle, styles.center, { color: colors.text }]}>Engellediğin kimse yok.</Text>
            <Text style={[typography.body, styles.center, { color: colors.textSecondary }]}>
              Birini engellediğinde burada görünür; engeli buradan kaldırabilirsin.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[typography.body, styles.lead, { color: colors.textBody }]}>
              Engellediğin kişiler profilini göremez ve seni dürtemez.
            </Text>
            <SettingsGroup>
              {users.map((u, i) => {
                const busy = unblock.isPending && unblock.variables === u.id;
                return (
                  <LinkRow
                    key={u.id}
                    title={u.displayName}
                    detail={`@${u.username}`}
                    leading={<Avatar name={u.displayName} tint={u.avatarTint} url={u.avatarUrl} />}
                    trailing={
                      <Pressable
                        onPress={() =>
                          unblock.mutate(u.id, {
                            onSuccess: () => flash(`Engel kaldırıldı: ${u.displayName}`),
                            onError: (e) => flash(errorText(e)),
                          })
                        }
                        disabled={unblock.isPending}
                        accessibilityRole="button"
                        accessibilityLabel={`${u.displayName} engelini kaldır`}
                        accessibilityState={{ disabled: unblock.isPending, busy }}
                        hitSlop={6}
                        style={({ pressed }) => [pressed && styles.pressed, unblock.isPending && !busy && styles.dim]}>
                        <Chip label={busy ? 'Kaldırılıyor…' : 'Engeli kaldır'} />
                      </Pressable>
                    }
                    last={i === users.length - 1}
                  />
                );
              })}
            </SettingsGroup>
          </>
        )}
      </ScrollView>

      {message && <Toast message={message} style={[styles.toast, { bottom: insets.bottom + layout.screenPadding }]} />}
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
  lead: {
    marginTop: m.profileCardMarginTop,
  },
  empty: {
    marginTop: m.emptyMarginTop,
    gap: m.groupMarginTop,
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  dim: {
    opacity: 0.5,
  },
  toast: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
  },
});
