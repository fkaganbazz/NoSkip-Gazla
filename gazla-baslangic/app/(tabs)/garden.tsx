import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, LoadingState } from '@/components/ui';
import { useAuth, useGarden, useStreak } from '@/data';
import GardenHeader from '@/features/garden/GardenHeader';
import GardenShelves from '@/features/garden/GardenShelves';
import StatRow from '@/features/garden/StatRow';
import { layout, spacing, typography, useTheme } from '@/theme';

// Bahçem — design/Garden.dc.html. Veri: my_garden (raflar), my_streak (seri sayıları), profil.
// Rozetler bölümü veri katmanında karşılığı olmadığı için şimdilik yok (bkz. TODO).
export default function GardenScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const garden = useGarden();
  const streak = useStreak();

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

  const items = garden.data;

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
            Bitirdiğin her challenge rafına yeni bir kaktüs ekler.
          </Text>
        )}

        {/* TODO(backend): Rozetler (Garden.dc.html "Rozetler 3 / 12") — rozet tablosu/RPC yok. */}

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
  devLink: {
    alignSelf: 'center',
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
});
