import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, LoadingState, ScreenHeader } from '@/components/ui';
import {
  ApiError,
  useAcceptFriendRequestMutation,
  useActivity,
  useMarkActivityReadMutation,
  useRemoveFriendshipMutation,
} from '@/data';
import ActivityRow, { type ActivityActions } from '@/features/activity/ActivityRow';
import { groupByDay } from '@/features/activity/logic';
import { ListCard, SectionTitle } from '@/features/friends/list';
import { componentTypography, layout, radius, typography, useTheme } from '@/theme';
import { socialMetrics as m } from '@/theme/social';

// Aktivite — design/Activity.dc.html. Veri: notifications (useActivity), güne göre gruplu.
// Satır metni ve aksiyonu bildirimin türüne göre (ActivityRow); "Tümü okundu" hepsini okundu yapar.
export default function ActivityScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const activity = useActivity();
  const markRead = useMarkActivityReadMutation();
  const accept = useAcceptFriendRequestMutation();
  const remove = useRemoveFriendshipMutation();

  const items = useMemo(() => activity.data ?? [], [activity.data]);
  // Zaman etiketleri veri her geldiğinde yeniden hesaplanır
  const now = useMemo(() => new Date(activity.dataUpdatedAt || Date.now()), [activity.dataUpdatedAt]);
  const groups = useMemo(() => groupByDay(items, now), [items, now]);
  const unread = items.filter((a) => !a.readAt).length;

  const actions: ActivityActions = {
    onReply: (userId) => router.push({ pathname: '/poke/[userId]', params: { userId } }),
    onCongrats: (userId) => router.push({ pathname: '/poke/[userId]', params: { userId, tone: 'hype' } }),
    onAccept: (friendshipId) => accept.mutate(friendshipId),
    onDecline: (userId) => remove.mutate(userId),
    onOpenChallenge: (id) => router.push({ pathname: '/challenge/[id]', params: { id } }),
    busyFriendshipId: accept.isPending ? accept.variables : undefined,
    busyUserId: remove.isPending ? remove.variables : undefined,
  };
  const error = [accept.error, remove.error, markRead.error].find((e) => e instanceof ApiError) as ApiError | undefined;

  const markAll = (
    <Pressable
      onPress={() => markRead.mutate(undefined)}
      disabled={unread === 0 || markRead.isPending}
      accessibilityRole="button"
      accessibilityState={{ disabled: unread === 0 }}
      style={({ pressed }) => [styles.markAll, (pressed || unread === 0) && styles.dimmed]}>
      <Text style={[typography.captionStrong, { color: colors.actionText }]}>Tümü okundu</Text>
    </Pressable>
  );

  const body = () => {
    if (activity.isPending) return <LoadingState />;
    if (activity.isError) return <ErrorState onRetry={() => activity.refetch()} />;
    if (items.length === 0) {
      return (
        <Text style={[typography.body, styles.empty, { color: colors.textBody }]}>
          Henüz bir hareket yok. Arkadaşların seni dürttüğünde ya da davet ettiğinde burada görünür.
        </Text>
      );
    }
    return groups.map((g, gi) => (
      <View key={g.key}>
        <SectionTitle style={{ marginTop: gi === 0 ? m.activitySectionMarginTop : m.activityNextSectionMarginTop }}>
          {g.label}
        </SectionTitle>
        <ListCard radius={radius.card} style={styles.list}>
          {g.items.map((item, i) => (
            <ActivityRow
              key={item.id}
              item={item}
              now={now}
              rich={g.key === 'today'}
              divider={i < g.items.length - 1}
              actions={actions}
            />
          ))}
        </ListCard>
      </View>
    ));
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={activity.isRefetching} onRefresh={() => activity.refetch()} />}>
        <ScreenHeader title="Aktivite" trailing={markAll} />
        {error && (
          <Text
            accessibilityLiveRegion="polite"
            style={[componentTypography.inputError, styles.error, { color: colors.danger }]}>
            {error.message}
          </Text>
        )}
        {body()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: layout.screenTopGap,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenPadding,
  },
  markAll: {
    height: layout.minTouchTarget,
    paddingHorizontal: m.markAllPaddingX,
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.5,
  },
  list: {
    marginTop: m.sectionListMarginTop,
  },
  error: {
    marginTop: m.sectionListMarginTop,
  },
  empty: {
    marginTop: m.activitySectionMarginTop,
    textAlign: 'center',
  },
});
