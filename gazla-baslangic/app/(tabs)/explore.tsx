import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SearchField from '@/components/SearchField';
import { Button, ErrorState, LoadingState } from '@/components/ui';
import { useChallengeTemplates, useFeaturedTemplate, type ChallengeCategory } from '@/data';
import AdBannerSlot from '@/features/explore/AdBannerSlot';
import CategoryChips from '@/features/explore/CategoryChips';
import FeaturedCard from '@/features/explore/FeaturedCard';
import TemplateList from '@/features/explore/TemplateList';
import { useT } from '@/i18n';
import { layout, spacing, typography, useTheme } from '@/theme';
import { exploreMetrics as m } from '@/theme/explore';

// Keşfet — design/Explore.dc.html. Veri: challenge_templates, popülerlik sırasıyla, kategori ve aramayla süzülmüş
// (useChallengeTemplates); haftanın challenge'ı useFeaturedTemplate (ikisi aynı önbellekten).
export default function ExploreScreen() {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ChallengeCategory | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Sıra sunucudan: 1 en popüler (şu an yapan sayısı); arama sonuçları da bu sırada
  const templates = useChallengeTemplates({ category, q: query, sort: 'popular' });
  const featured = useFeaturedTemplate().data ?? null;

  const filtering = query.trim().length > 0 || category !== null;
  const results = useMemo(() => templates.data ?? [], [templates.data]);
  // Öne çıkan, Popüler listesinde tekrar edilmez
  const popular = useMemo(() => results.filter((x) => x.id !== featured?.id), [results, featured]);
  const showAll = filtering || expanded;
  const list = filtering ? results : expanded ? popular : popular.slice(0, m.popularPreviewCount);

  const openTemplate = (templateId: string) =>
    router.push({ pathname: '/challenge/preview/[templateId]', params: { templateId } });
  const openCreate = () => router.push('/create');

  if (templates.isPending) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (templates.isError) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ErrorState message={templates.error.message} onRetry={() => templates.refetch()} />
      </SafeAreaView>
    );
  }

  const listTitle =
    category !== null ? t.explore.categoryNames[category] : filtering ? t.explore.screen.results : t.explore.screen.popular;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={templates.isRefetching}
            onRefresh={() => templates.refetch()}
          />
        }>
        <Text accessibilityRole="header" style={[typography.title1, { color: colors.text }]}>
          {t.explore.screen.title}
        </Text>

        <SearchField value={query} onChangeText={setQuery} placeholder={t.explore.screen.searchPlaceholder} style={styles.search} />
        <CategoryChips value={category} onChange={setCategory} />

        {!filtering && featured && (
          <FeaturedCard
            title={featured.title}
            activeCount={featured.activeCount}
            onPress={() => openTemplate(featured.id)}
          />
        )}

        <View style={styles.listHeader}>
          <Text accessibilityRole="header" style={[typography.sectionTitle, styles.listTitle, { color: colors.text }]}>
            {listTitle}
          </Text>
          {!showAll && popular.length > list.length && (
            <Pressable onPress={() => setExpanded(true)} accessibilityRole="button" hitSlop={12}>
              <Text style={[typography.captionStrong, { color: colors.actionText }]}>{t.explore.screen.seeAll}</Text>
            </Pressable>
          )}
        </View>

        {list.length > 0 ? (
          <TemplateList templates={list} onOpen={openTemplate} onCreate={showAll ? openCreate : undefined} />
        ) : (
          <View style={styles.empty}>
            <Text style={[typography.body, styles.emptyText, { color: colors.textBody }]}>
              {t.explore.screen.empty}
            </Text>
            <Button title={t.explore.screen.createOwn} variant="secondary" onPress={openCreate} />
          </View>
        )}

        <AdBannerSlot />

        {__DEV__ && (
          <Pressable
            onPress={() => router.push('/dev')}
            accessibilityRole="link"
            hitSlop={12}
            style={styles.devLink}>
            <Text style={[typography.meta, { color: colors.textSecondary }]}>Geliştirme ekranları</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: {
    marginTop: m.searchMarginTop,
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: layout.screenTopGap,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenPadding,
  },
  listHeader: {
    marginTop: m.popularHeaderMarginTop,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  listTitle: {
    flexShrink: 1,
  },
  empty: {
    marginTop: m.listMarginTop,
    gap: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
  devLink: {
    alignSelf: 'center',
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
});
