import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, LoadingState } from '@/components/ui';
import { useAuth, useBadges, useGarden, useStreak } from '@/data';
import Badges from '@/features/garden/Badges';
import GardenHeader from '@/features/garden/GardenHeader';
import GardenShelves from '@/features/garden/GardenShelves';
import { gardenOrder } from '@/features/garden/logic';
import StatRow from '@/features/garden/StatRow';
import { useT } from '@/i18n';
import { layout, spacing, typography, useTheme } from '@/theme';
import { gardenMetrics as m } from '@/theme/garden';

// Bahçem — design/Garden.dc.html. Veri: my_garden (raflar), my_streak (seri sayıları), profil,
// my_badges (rozetler; ayrı yüklenir, hatası raflara dokunmaz).
export default function GardenScreen() {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const { profile } = useAuth();
  const garden = useGarden();
  const streak = useStreak();
  const badges = useBadges();
  const items = useMemo(() => gardenOrder(garden.data ?? []), [garden.data]);

  if (garden.isPending || streak.isPending) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (garden.isError || streak.isError) {
    const error = garden.error ?? streak.error;
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ErrorState
          message={error?.message}
          onRetry={() => {
            garden.refetch();
            streak.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={garden.isRefetching}
            onRefresh={() => {
              garden.refetch();
              streak.refetch();
              badges.refetch();
            }}
          />
        }>
        {profile && <GardenHeader profile={profile} onSettings={() => router.push('/settings')} />}

        <StatRow
          currentStreak={streak.data.currentStreak}
          completed={items.length}
          longestStreak={streak.data.longestStreak}
        />

        <GardenShelves
          items={items}
          onOpen={(id) => router.push({ pathname: '/challenge/[id]/finished', params: { id } })}
          onNext={() => router.navigate('/explore')}
        />
        {items.length === 0 && (
          <Text style={[typography.body, styles.emptyText, { color: colors.textBody }]}>
            {t.garden.shelves.empty}
          </Text>
        )}

        {badges.data ? (
          <Badges badges={badges.data} />
        ) : (
          <View style={styles.badgesState}>
            {badges.isError ? (
              <ErrorState message={t.garden.badges.loadFailed} onRetry={() => badges.refetch()} />
            ) : (
              <LoadingState />
            )}
          </View>
        )}

        {__DEV__ && (
          <Pressable onPress={() => router.push('/dev')} accessibilityRole="link" hitSlop={12} style={styles.devLink}>
            <Text style={[typography.meta, { color: colors.textSecondary }]}>Geliştirme ekranları</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: layout.screenTopGap,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenPadding,
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  badgesState: {
    marginTop: m.badgesHeaderMarginTop,
  },
  devLink: {
    alignSelf: 'center',
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
});
