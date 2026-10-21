import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FriendList, FriendRow, FriendRowButton } from '@/components/FriendRow';
import SearchField from '@/components/SearchField';
import Sheet from '@/components/Sheet';
import { ErrorState, LoadingState } from '@/components/ui';
import {
  ApiError,
  useAcceptFriendRequestMutation,
  useFriendRequests,
  useSearchProfiles,
  useSendFriendRequestMutation,
  type SearchResult,
} from '@/data';
import { normalizeUsername } from '@/features/onboarding/logic';
import { useDebouncedValue } from '@/features/onboarding/useDebouncedValue';
import { componentTypography, typography, useTheme } from '@/theme';
import { onboardingMetrics as m } from '@/theme/onboarding';

/** Aramanın başladığı harf sayısı (search_profiles 2 harften kısa aramayı boş döner) */
const MIN_QUERY = 2;

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * "Kullanıcı adıyla ara" — davet ekranında (onboarding adımı ve uygulama içi modal) alt sayfa: arama alanı ve
 * search_profiles sonuçları; "Ekle" arkadaşlık isteği gönderir (Friends'teki arama satırlarıyla aynı).
 * Tasarımı yok: ortak Sheet, SearchField ve FriendRow ile kuruldu.
 */
export default function UsernameSearchSheet({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const term = normalizeUsername(query);
  const debounced = useDebouncedValue(term, m.usernameDebounceMs);
  const searching = term.length >= MIN_QUERY;

  const search = useSearchProfiles(searching ? debounced : '');
  const requests = useFriendRequests();
  const sendRequest = useSendFriendRequestMutation();
  const accept = useAcceptFriendRequestMutation();

  const incomingBy = useMemo(
    () => new Map((requests.data ?? []).filter((r) => r.direction === 'incoming').map((r) => [r.person.id, r])),
    [requests.data],
  );
  const mutationError = [sendRequest.error, accept.error].find((e) => e instanceof ApiError) as ApiError | undefined;

  // Kapanınca arama ve hata sıfırlanır
  const { reset: resetSend } = sendRequest;
  const { reset: resetAccept } = accept;
  useEffect(() => {
    if (visible) return;
    setQuery('');
    resetSend();
    resetAccept();
  }, [visible, resetSend, resetAccept]);

  const resultRow = (p: SearchResult, i: number, all: SearchResult[]) => {
    const incoming = incomingBy.get(p.id);
    return (
      <FriendRow
        key={p.id}
        divider={i < all.length - 1}
        person={p}
        sub={p.isFriend ? `@${p.username} · Arkadaşın` : `@${p.username}`}
        action={
          p.isFriend || incoming
            ? undefined
            : p.requestPending
              ? { type: 'sent' }
              : {
                  type: 'add',
                  onPress: () => sendRequest.mutate(p.id),
                  loading: sendRequest.isPending && sendRequest.variables === p.id,
                }
        }
        // Gelen isteği olan kişi "Kabul et" ile çıkar (Friends araması gibi)
        trailing={
          !p.isFriend && incoming ? (
            <FriendRowButton
              title="Kabul et"
              variant="action"
              loading={accept.isPending && accept.variables === incoming.id}
              onPress={() => accept.mutate(incoming.id)}
            />
          ) : undefined
        }
      />
    );
  };

  const renderResults = () => {
    if (!searching) {
      return (
        <Text style={[typography.body, styles.status, { color: colors.textBody }]}>
          Arkadaşının kullanıcı adını yaz.
        </Text>
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
        <Text style={[typography.body, styles.status, { color: colors.textBody }]}>Bu kullanıcı adıyla kimse yok.</Text>
      );
    }
    return <FriendList>{results.map(resultRow)}</FriendList>;
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Arkadaş ekle" scrollable contentStyle={styles.body}>
      {/* Sayfa açılınca (alan çizilince) yazmaya hazır */}
      <SearchField
        autoFocus
        value={query}
        onChangeText={setQuery}
        placeholder="Kullanıcı adıyla ara"
        autoCapitalize="none"
      />
      {mutationError && (
        <Text accessibilityLiveRegion="polite" style={[componentTypography.inputError, { color: colors.dangerText }]}>
          {mutationError.message}
        </Text>
      )}
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
