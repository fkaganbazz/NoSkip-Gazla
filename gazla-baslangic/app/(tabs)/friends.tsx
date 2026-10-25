import { useRouter } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FriendList, FriendRow, FriendRowButton } from '@/components/FriendRow';
import SearchField from '@/components/SearchField';
import { ErrorState, IconButton, SectionLabel, ToastHost, useToast, type SectionLabelTone } from '@/components/ui';
import {
  ApiError,
  useAcceptFriendRequest,
  useAuth,
  useFriendRequests,
  useFriendsToday,
  useRemoveFriendship,
  useSendFriendRequest,
  useUserSearch,
  type FriendRequest,
  type FriendToday,
  type SearchResult,
} from '@/data';
import { UserPlusIcon } from '@/features/friends/icons';
import InviteCard from '@/features/friends/InviteCard';
import { friendSub, groupFriends, personSub, searchTerm, useDebounced } from '@/features/friends/logic';
import { shareFriendInvite } from '@/features/friends/share';
import { useT } from '@/i18n';
import { componentTypography, layout, typography, useTheme } from '@/theme';
import { socialMetrics as m } from '@/theme/social';

// Arkadaşlar — design/Friends.dc.html. Veri: friends_today, bekleyen istekler, search_profiles.
// Arama 2 harften sonra (gecikmeli) sonuçları gösterir; boşken istekler ve bugünkü durum listelenir.
// Hiç arkadaş yokken davet kartı büyür ("Henüz arkadaşın yok"). "Paylaş" sistem paylaşımını açar.
export default function FriendsScreen() {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const searchRef = useRef<TextInput>(null);
  const { profile } = useAuth();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const debounced = useDebounced(query);
  const searching = searchTerm(query).length >= 2;

  const friends = useFriendsToday();
  const requests = useFriendRequests();
  const search = useUserSearch(searching ? debounced : '');
  const sendRequest = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriendship();

  const groups = useMemo(() => groupFriends(friends.data ?? []), [friends.data]);
  const requestList = requests.data ?? [];
  const incomingBy = useMemo(
    () => new Map(requestList.filter((r) => r.direction === 'incoming').map((r) => [r.person.id, r])),
    [requestList],
  );

  const mutationError = [sendRequest.error, accept.error, remove.error].find((e) => e instanceof ApiError) as
    | ApiError
    | undefined;

  const onShare = async () => {
    const result = await shareFriendInvite(t, profile?.username);
    if (result === 'copied') toast.show({ message: t.friends.screen.inviteCopied, kind: 'success' });
  };

  const openProfile = (id: string) => router.push({ pathname: '/user/[id]', params: { id } });
  const openPoke = (userId: string, tone?: 'hype') =>
    router.push({ pathname: '/poke/[userId]', params: tone ? { userId, tone } : { userId } });

  const requestRow = (r: FriendRequest, i: number, all: FriendRequest[]) => (
    <FriendRow
      key={r.id}
      divider={i < all.length - 1}
      person={r.person}
      sub={personSub(r.person.username, r.mutualCount, t)}
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
      accessibilityLabel={t.friends.screen.profileLabel(f.displayName)}
      person={f}
      status={f.doneToday === true ? 'done' : f.doneToday === false ? 'pending' : null}
      sub={friendSub(f, t)}
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
        sub={personSub(p.username, p.mutualCount, t)}
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
              title={t.common.accept}
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
        <Text style={[typography.body, styles.status, { color: colors.textBody }]}>{t.friends.screen.noResults}</Text>
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
    // Bölümler: istekler, bekleyenler, tamamlayanlar, bugün görevi olmayanlar (boşlar gösterilmez)
    const all: { key: string; label: string; tone: SectionLabelTone; rows: ReactNode[] }[] = [
      { key: 'requests', label: t.friends.sections.requests, tone: 'default', rows: requestList.map(requestRow) },
      { key: 'pending', label: t.friends.sections.pending, tone: 'orange', rows: groups.pending.map(friendRow) },
      { key: 'done', label: t.friends.sections.done, tone: 'green', rows: groups.done.map(friendRow) },
      { key: 'idle', label: t.friends.sections.idle, tone: 'default', rows: groups.idle.map(friendRow) },
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
            {t.friends.screen.title}
          </Text>
          <IconButton
            icon={UserPlusIcon}
            tone="ink"
            iconStrokeWidth={m.addIconStrokeWidth}
            onPress={() => searchRef.current?.focus()}
            accessibilityLabel={t.friends.screen.addFriend}
          />
        </View>

        <SearchField
          ref={searchRef}
          value={query}
          onChangeText={setQuery}
          placeholder={t.friends.screen.searchPlaceholder}
          autoCapitalize="none"
          style={styles.search}
        />

        {mutationError && (
          <Text
            accessibilityLiveRegion="polite"
            style={[componentTypography.inputError, styles.error, { color: colors.dangerText }]}>
            {mutationError.message}
          </Text>
        )}

        {searching ? (
          <View style={{ marginTop: m.sectionFirstMarginTop }}>{renderSearch()}</View>
        ) : (
          <>
            <InviteCard expanded={friends.isSuccess && friends.data.length === 0} onShare={onShare} />
            {renderLists()}
          </>
        )}

        {__DEV__ && (
          <Pressable onPress={() => router.push('/dev')} accessibilityRole="link" style={styles.devLink}>
            <Text style={[typography.meta, { color: colors.textSecondary }]}>Geliştirme ekranları</Text>
          </Pressable>
        )}
      </ScrollView>
      <ToastHost toast={toast} />
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
