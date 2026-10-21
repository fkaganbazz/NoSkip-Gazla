import { useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FriendList, FriendRow, FriendRowButton } from '@/components/FriendRow';
import { ErrorState, IconButton, SectionLabel, type SectionLabelTone } from '@/components/ui';
import {
  ApiError,
  useAcceptFriendRequestMutation,
  useFriendRequests,
  useFriendsToday,
  useRemoveFriendshipMutation,
  useSearchProfiles,
  useSendFriendRequestMutation,
  type FriendRequest,
  type FriendToday,
  type SearchResult,
} from '@/data';
import { UserPlusIcon } from '@/features/friends/icons';
import InviteCard from '@/features/friends/InviteCard';
import { friendSub, groupFriends, searchTerm, useDebounced } from '@/features/friends/logic';
import SearchField from '@/features/friends/SearchField';
import { componentTypography, layout, typography, useTheme } from '@/theme';
import { socialMetrics as m } from '@/theme/social';

// Arkadaşlar — design/Friends.dc.html. Veri: friends_today, bekleyen istekler, search_profiles.
// Arama 2 harften sonra (gecikmeli) sonuçları gösterir; boşken istekler ve bugünkü durum listelenir.
export default function FriendsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const searchRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const debounced = useDebounced(query);
  const searching = searchTerm(query).length >= 2;

  const friends = useFriendsToday();
  const requests = useFriendRequests();
  const search = useSearchProfiles(searching ? debounced : '');
  const sendRequest = useSendFriendRequestMutation();
  const accept = useAcceptFriendRequestMutation();
  const remove = useRemoveFriendshipMutation();

  const groups = useMemo(() => groupFriends(friends.data ?? []), [friends.data]);
  const requestList = requests.data ?? [];
  const incomingBy = useMemo(
    () => new Map(requestList.filter((r) => r.direction === 'incoming').map((r) => [r.person.id, r])),
    [requestList],
  );

  const mutationError = [sendRequest.error, accept.error, remove.error].find((e) => e instanceof ApiError) as
    | ApiError
    | undefined;

  const openProfile = (id: string) => router.push({ pathname: '/friend/[id]', params: { id } });
  const openPoke = (userId: string, tone?: 'hype') =>
    router.push({ pathname: '/poke/[userId]', params: tone ? { userId, tone } : { userId } });

  const requestRow = (r: FriendRequest, i: number, all: FriendRequest[]) => (
    <FriendRow
      key={r.id}
      divider={i < all.length - 1}
      person={r.person}
      sub={`@${r.person.username}`}
      action={{
        type: 'request',
        onAccept: r.direction === 'incoming' ? () => accept.mutate(r.id) : undefined,
        accepting: accept.isPending && accept.variables === r.id,
        onDismiss: () => remove.mutate(r.person.id),
        dismissing: remove.isPending && remove.variables === r.person.id,
      }}
    />
  );

  const friendRow = (f: FriendToday, i: number, all: FriendToday[]) => (
    <FriendRow
      key={f.id}
      divider={i < all.length - 1}
      onPress={() => openProfile(f.id)}
      accessibilityLabel={`${f.displayName} profili`}
      person={f}
      status={f.doneToday === true ? 'done' : f.doneToday === false ? 'pending' : null}
      sub={friendSub(f)}
      action={
        f.doneToday === false
          ? { type: 'poke', onPress: () => openPoke(f.id) }
          : f.doneToday === true
            ? { type: 'hype', onPress: () => openPoke(f.id, 'hype') }
            : undefined
      }
    />
  );

  const resultRow = (p: SearchResult, i: number, all: SearchResult[]) => {
    const incoming = incomingBy.get(p.id);
    return (
      <FriendRow
        key={p.id}
        divider={i < all.length - 1}
        onPress={p.isFriend ? () => openProfile(p.id) : undefined}
        person={p}
        sub={`@${p.username}`}
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
        // Gelen isteği olan kişi aramada yalnızca "Kabul et" ile çıkar (silmek İstekler'de)
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

  const renderSearch = () => {
    if (search.isPending || debounced !== query) {
      return (
        <View style={styles.status}>
          <ActivityIndicator color={colors.action} />
        </View>
      );
    }
    if (search.isError) {
      return <ErrorState message={(search.error as Error).message} onRetry={() => search.refetch()} />;
    }
    const results = search.data ?? [];
    if (results.length === 0) {
      return (
        <Text style={[typography.body, styles.status, { color: colors.textBody }]}>Bu kullanıcı adıyla kimse yok.</Text>
      );
    }
    return <FriendList style={styles.list}>{results.map(resultRow)}</FriendList>;
  };

  const renderLists = () => {
    if (friends.isPending || requests.isPending) {
      return (
        <View style={styles.status}>
          <ActivityIndicator color={colors.action} />
        </View>
      );
    }
    if (friends.isError || requests.isError) {
      return (
        <ErrorState
          onRetry={() => {
            friends.refetch();
            requests.refetch();
          }}
        />
      );
    }
    const none = requestList.length === 0 && (friends.data ?? []).length === 0;
    // Bölümler: istekler, bekleyenler, tamamlayanlar, bugün görevi olmayanlar (boşlar gösterilmez)
    const all: { key: string; label: string; tone: SectionLabelTone; rows: ReactNode[] }[] = [
      { key: 'requests', label: 'İSTEKLER', tone: 'default', rows: requestList.map(requestRow) },
      { key: 'pending', label: 'BUGÜN BEKLEYENLER', tone: 'orange', rows: groups.pending.map(friendRow) },
      { key: 'done', label: 'BUGÜNÜ TAMAMLAYANLAR', tone: 'green', rows: groups.done.map(friendRow) },
      { key: 'idle', label: 'BUGÜN GÖREVİ OLMAYANLAR', tone: 'default', rows: groups.idle.map(friendRow) },
    ];
    const sections = all.filter((s) => s.rows.length > 0);
    return (
      <>
        {sections.map((s, i) => (
          <View key={s.key}>
            <SectionLabel
              tone={s.tone}
              count={s.rows.length}
              style={{ marginTop: i === 0 ? m.sectionFirstMarginTop : m.sectionMarginTop }}>
              {s.label}
            </SectionLabel>
            <FriendList style={styles.list}>{s.rows}</FriendList>
          </View>
        ))}
        {none && (
          <Text style={[typography.body, styles.status, { color: colors.textBody }]}>
            Henüz arkadaşın yok. Kullanıcı adıyla ara ya da davet linkini paylaş.
          </Text>
        )}
      </>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={friends.isRefetching}
            onRefresh={() => {
              friends.refetch();
              requests.refetch();
            }}
          />
        }>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[typography.title1, { color: colors.text }]}>
            Arkadaşlar
          </Text>
          <IconButton
            icon={UserPlusIcon}
            tone="ink"
            iconStrokeWidth={m.addIconStrokeWidth}
            onPress={() => searchRef.current?.focus()}
            accessibilityLabel="Arkadaş ekle"
          />
        </View>

        <SearchField ref={searchRef} value={query} onChangeText={setQuery} />

        {mutationError && (
          <Text
            accessibilityLiveRegion="polite"
            style={[componentTypography.inputError, styles.error, { color: colors.danger }]}>
            {mutationError.message}
          </Text>
        )}

        {searching ? (
          <View style={{ marginTop: m.sectionFirstMarginTop }}>{renderSearch()}</View>
        ) : (
          <>
            <InviteCard onShare={() => router.push('/invite-friends')} />
            {renderLists()}
          </>
        )}

        {__DEV__ && (
          <Pressable onPress={() => router.push('/dev')} accessibilityRole="link" style={styles.devLink}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: {
    marginTop: m.sectionListMarginTop,
  },
  status: {
    marginTop: m.sectionFirstMarginTop,
    alignItems: 'center',
    textAlign: 'center',
  },
  error: {
    marginTop: m.sectionListMarginTop,
  },
  devLink: {
    marginTop: m.devLinkMarginTop,
    minHeight: layout.minTouchTarget,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
  },
});
