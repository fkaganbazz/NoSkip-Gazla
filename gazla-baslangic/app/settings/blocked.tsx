import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FriendList, FriendRow, FriendRowButton } from '@/components/FriendRow';
import { ErrorState, LoadingState, ScreenHeader, ToastHost, useToast } from '@/components/ui';
import { useBlock } from '@/data';
import { errorText } from '@/features/settings/logic';
import { useT } from '@/i18n';
import { layout, typography, useTheme } from '@/theme';
import { settingsMetrics as m } from '@/theme/settings';

// Engellenenler — tasarım dosyası yok; ortak kişi listesi (FriendList + FriendRow). Veri: blocks (useBlock({ list: true }).blocked).
export default function BlockedScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { blocked, unblock } = useBlock({ list: true });
  const toast = useToast();
  const t = useT();
  const b = t.settings.blocked;

  const top = { paddingTop: insets.top + layout.screenTopGap };

  if (blocked.isPending || blocked.isError) {
    return (
      <View style={[styles.screen, styles.padded, top]}>
        <ScreenHeader title={b.title} />
        {blocked.isPending ? <LoadingState /> : <ErrorState onRetry={() => blocked.refetch()} />}
      </View>
    );
  }

  const users = blocked.data;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.padded, top, { paddingBottom: insets.bottom + m.screenPaddingBottom }]}>
        <ScreenHeader title={b.title} />

        {users.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[typography.cardTitle, styles.center, { color: colors.text }]}>{b.emptyTitle}</Text>
            <Text style={[typography.body, styles.center, { color: colors.textSecondary }]}>{b.emptyBody}</Text>
          </View>
        ) : (
          <>
            <Text style={[typography.body, styles.lead, { color: colors.textBody }]}>{b.lead}</Text>
            <FriendList style={styles.list}>
              {users.map((u, i) => {
                const busy = unblock.isPending && unblock.variables === u.id;
                return (
                  <FriendRow
                    key={u.id}
                    person={u}
                    sub={`@${u.username}`}
                    divider={i < users.length - 1}
                    trailing={
                      <FriendRowButton
                        title={b.unblock}
                        variant="muted"
                        loading={busy}
                        disabled={unblock.isPending && !busy}
                        accessibilityLabel={b.unblockA11y(u.displayName)}
                        onPress={() =>
                          unblock(u.id, {
                            onSuccess: () => toast.show({ message: b.unblocked(u.displayName) }),
                            onError: (e) => toast.show({ message: errorText(e, t) }),
                          })
                        }
                      />
                    }
                  />
                );
              })}
            </FriendList>
          </>
        )}
      </ScrollView>

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
  lead: {
    marginTop: m.profileCardMarginTop,
  },
  list: {
    marginTop: m.groupMarginTop,
  },
  empty: {
    marginTop: m.emptyMarginTop,
    gap: m.groupMarginTop,
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
