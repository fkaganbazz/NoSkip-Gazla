import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FriendList } from '@/components/FriendRow';
import { Button, ErrorState, LoadingState, ScreenHeader, SectionLabel, ToastHost, useToast } from '@/components/ui';
import { CONGRATS_POKE_ID } from '@/content/pokes';
import {
  ApiError,
  useAcceptFriendRequest,
  useActivity,
  useMarkAllRead,
  usePoke,
  useRemoveFriendship,
  useUnreadCount,
  type ActivityItem,
} from '@/data';
import ActivityRow, { type ActivityActions } from '@/features/activity/ActivityRow';
import { groupByDay } from '@/features/activity/logic';
import { toDative } from '@/features/friends/names';
import { componentTypography, layout, radius, typography, useTheme } from '@/theme';
import { socialMetrics as m } from '@/theme/social';

/** Listenin sonuna bu kadar kala sonraki sayfa istenir */
const LOAD_MORE_THRESHOLD = 400;

// Aktivite — design/Activity.dc.html. Veri: notifications, 30'ar sayfa (useActivity), güne göre gruplu;
// liste sonuna gelince sonraki sayfa yüklenir. Satır metni ve aksiyonu bildirimin türüne göre (ActivityRow).
// "Tümü okundu" hepsini okundu yapar; "Tebrik et" hazır gaz mesajını sayfa açmadan gönderir.
export default function ActivityScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const activity = useActivity();
  const unreadCount = useUnreadCount();
  const markRead = useMarkAllRead();
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriendship();
  // "Tebrik et": hazır gaz mesajı (send) ve tostta "Geri al" (undo)
  const poke = usePoke();
  /** Tebrik gönderilen bildirimler → gönderilen dürtme (geri alınca listeden çıkar) */
  const [congratulated, setCongratulated] = useState<Record<string, string>>({});
  const [congratsPendingId, setCongratsPendingId] = useState<string | null>(null);
  // İçerik yüksekliği hangi satır sayısıyla ölçüldü: yükleniyor halinin yüksekliğiyle "ekran dolmadı" sanılmasın
  const [content, setContent] = useState({ height: 0, items: -1 });
  const [viewportHeight, setViewportHeight] = useState(0);

  const items = useMemo(() => activity.data?.pages.flatMap((p) => p.items) ?? [], [activity.data]);
  // Zaman etiketleri veri her geldiğinde yeniden hesaplanır
  const now = useMemo(() => new Date(activity.dataUpdatedAt || Date.now()), [activity.dataUpdatedAt]);
  const groups = useMemo(() => groupByDay(items, now), [items, now]);
  // Okunmamış sayısı sunucudan (yüklenmemiş sayfalardakiler de); gelene kadar yüklenenlerden
  const unread = unreadCount.data ?? items.filter((a) => !a.readAt).length;

  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = activity;
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) fetchNextPage();
  };
  const onScroll = ({ nativeEvent: e }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e.layoutMeasurement.height + e.contentOffset.y >= e.contentSize.height - LOAD_MORE_THRESHOLD) loadMore();
  };
  // Yüklenen sayfalar ekranı doldurmuyorsa kaydırma olmaz; devamı hemen istenir. Yalnızca ölçüm son gelen
  // satırlarla yapıldıysa karar verilir (veri geldiği an eski — yükleniyor — yüksekliği hâlâ duruyor olabilir).
  const measured = content.items === items.length && content.height > 0;
  const fillsScreen = content.height > viewportHeight + LOAD_MORE_THRESHOLD;
  useEffect(() => {
    if (measured && viewportHeight > 0 && !fillsScreen && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      fetchNextPage();
    }
  }, [measured, fillsScreen, viewportHeight, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const sendCongrats = (item: ActivityItem) => {
    const actor = item.actor;
    if (!actor) return;
    setCongratsPendingId(item.id);
    poke.send(
      {
        toUserId: actor.id,
        messageId: CONGRATS_POKE_ID,
        challengeId: item.challengeId ?? undefined,
      },
      {
        onSettled: () => setCongratsPendingId(null),
        onSuccess: (sent) => {
          setCongratulated((s) => ({ ...s, [item.id]: sent.id }));
          toast.show({
            message: `${toDative(actor.displayName)} tebrik gönderildi`,
            action: {
              label: 'Geri al',
              onPress: () =>
                poke.undo(sent.id, {
                  onSuccess: () =>
                    setCongratulated((s) => {
                      const next = { ...s };
                      delete next[item.id];
                      return next;
                    }),
                }),
            },
          });
        },
      },
    );
  };

  const actions: ActivityActions = {
    onReply: (userId) => router.push({ pathname: '/poke/[userId]', params: { userId } }),
    onCongrats: sendCongrats,
    onAccept: (friendshipId) => accept.mutate(friendshipId),
    onDecline: (userId) => remove.mutate(userId),
    onOpenChallenge: (id) => router.push({ pathname: '/challenge/[id]', params: { id } }),
    busyFriendshipId: accept.isPending ? accept.variables : undefined,
    busyUserId: remove.isPending ? remove.variables : undefined,
    congratsBusyId: congratsPendingId ?? undefined,
    congratulatedIds: congratulated,
  };
  const error = [accept.error, remove.error, markRead.error, poke.send.error, poke.undo.error].find(
    (e) => e instanceof ApiError,
  ) as ApiError | undefined;

  // Metin buton: 44 yükseklik, 14/800 yeşil (okunmamış yokken pasif gri)
  const markAll = (
    <Button
      title="Tümü okundu"
      variant="text"
      size="sm"
      color={unread > 0 ? colors.actionText : undefined}
      disabled={unread === 0 || markRead.isLoading}
      onPress={() => markRead.markAll()}
      style={styles.markAll}
    />
  );

  const footer = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.more} accessibilityLabel="Daha eski bildirimler yükleniyor">
          <ActivityIndicator color={colors.action} />
        </View>
      );
    }
    if (isFetchNextPageError) {
      return (
        <View style={styles.more}>
          <Text style={[typography.meta, { color: colors.textBody }]}>Daha eskiler yüklenemedi.</Text>
          <Button title="Tekrar dene" variant="text" size="sm" onPress={() => fetchNextPage()} />
        </View>
      );
    }
    return null;
  };

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
    return (
      <>
        {groups.map((g, gi) => (
          <View key={g.key}>
            <SectionLabel style={{ marginTop: gi === 0 ? m.activitySectionMarginTop : m.activityNextSectionMarginTop }}>
              {g.label}
            </SectionLabel>
            <FriendList style={styles.list}>
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
            </FriendList>
          </View>
        ))}
        {footer()}
      </>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={100}
        // İlk sayfa ekranı doldurmuyorsa da devamı istenir
        onContentSizeChange={(_, height) => setContent({ height, items: items.length })}
        onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
        refreshControl={<RefreshControl refreshing={activity.isRefetching && !isFetchingNextPage} onRefresh={() => activity.refetch()} />}>
        <ScreenHeader title="Aktivite" trailing={markAll} />
        {error && (
          <Text
            accessibilityLiveRegion="polite"
            style={[componentTypography.inputError, styles.error, { color: colors.dangerText }]}>
            {error.message}
          </Text>
        )}
        {body()}
      </ScrollView>
      <ToastHost toast={toast} />
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
    paddingHorizontal: m.markAllPaddingX,
  },
  // Aktivite kartı köşesi 22 (Friends listesi 20)
  list: {
    marginTop: m.sectionListMarginTop,
    borderRadius: radius.card,
  },
  more: {
    paddingVertical: m.activityMorePaddingY,
    alignItems: 'center',
  },
  error: {
    marginTop: m.sectionListMarginTop,
  },
  empty: {
    marginTop: m.activitySectionMarginTop,
    textAlign: 'center',
  },
});
