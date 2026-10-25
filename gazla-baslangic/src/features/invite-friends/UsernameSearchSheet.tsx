import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import SearchField from '@/components/SearchField';
import Sheet from '@/components/Sheet';
import { ErrorState, LoadingState } from '@/components/ui';
import { ApiError, useUserSearch } from '@/data';
import { normalizeUsername } from '@/features/onboarding/logic';
import { useDebouncedValue } from '@/features/onboarding/useDebouncedValue';
import { useT } from '@/i18n';
import { typography, useTheme } from '@/theme';
import { onboardingMetrics as m } from '@/theme/onboarding';

import PersonResults from './PersonResults';

/** Aramanın başladığı harf sayısı (search_profiles 2 harften kısa aramayı boş döner) */
const MIN_QUERY = 2;

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * "Kullanıcı adıyla ara" — davet ekranında (onboarding adımı ve uygulama içi modal) alt sayfa: arama alanı ve
 * search_profiles sonuçları; "Ekle" arkadaşlık isteği gönderir (Friends'teki arama satırlarıyla aynı; satırlar
 * "Rehberden bul" ile ortak `PersonResults`). Tasarımı yok: ortak Sheet, SearchField ve FriendRow ile kuruldu.
 */
export default function UsernameSearchSheet({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const tx = t.invite.search;
  const [query, setQuery] = useState('');
  const term = normalizeUsername(query);
  const debounced = useDebouncedValue(term, m.usernameDebounceMs);
  const searching = term.length >= MIN_QUERY;

  const search = useUserSearch(searching ? debounced : '');

  // Kapanınca arama sıfırlanır (satırların istek durumu sayfayla birlikte kapanır)
  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const renderResults = () => {
    if (!searching) {
      return (
        <Text style={[typography.body, styles.status, { color: colors.textBody }]}>{tx.prompt}</Text>
      );
    }
    if (search.isPending || debounced !== term) {
      return (
        <View style={styles.status}>
          <LoadingState />
        </View>
      );
    }
    if (search.isError) {
      return (
        <ErrorState
          message={search.error instanceof ApiError ? search.error.message : undefined}
          onRetry={() => search.refetch()}
        />
      );
    }
    const results = search.data ?? [];
    if (results.length === 0) {
      return (
        <Text style={[typography.body, styles.status, { color: colors.textBody }]}>{tx.noResults}</Text>
      );
    }
    return <PersonResults people={results} />;
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={tx.title} scrollable contentStyle={styles.body}>
      {/* Sayfa açılınca (alan çizilince) yazmaya hazır */}
      <SearchField
        autoFocus
        value={query}
        onChangeText={setQuery}
        placeholder={tx.placeholder}
        autoCapitalize="none"
      />
      {renderResults()}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: m.listMarginTop,
  },
  status: {
    alignItems: 'center',
    textAlign: 'center',
  },
});
