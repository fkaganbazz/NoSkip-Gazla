import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons';
import { ErrorState } from '@/components/ui';
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
import { ListCard, PersonRow, SectionTitle, SmallButton } from '@/features/friends/list';
import { friendSub, groupFriends, searchTerm, useDebounced } from '@/features/friends/logic';
import PersonAvatar from '@/features/friends/PersonAvatar';
import SearchField from '@/features/friends/SearchField';
import { componentTypography, layout, typography, useTheme } from '@/theme';
import { socialColors, socialMetrics as m } from '@/theme/social';

// Arkadaşlar — design/Friends.dc.html. Veri: friends_today, bekleyen istekler, search_profiles.
// Arama 2 harften sonra (gecikmeli) sonuçları gösterir; boşken istekler ve bugünkü durum listelenir.
export default function FriendsScreen() {
  const { colors, scheme } = useTheme();
  const c = socialColors[scheme];
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
    <PersonRow
      key={r.id}
      divider={i < all.length - 1}
      avatar={<PersonAvatar person={r.person} size={m.rowAvatar} />}
      title={r.person.displayName}
      sub={`@${r.person.username}`}
      trailing={
        <>
          {r.direction === 'incoming' && (
            <SmallButton
              title="Kabul et"
              variant="action"
              loading={accept.isPending && accept.variables === r.id}
              onPress={() => accept.mutate(r.id)}
              accessibilityLabel={`${r.person.displayName} isteğini kabul et`}
            />
          )}
          <SmallButton
            title=""
            variant="muted"
            icon={<CloseIcon color={colors.textBody} size={m.dismissIconSize} strokeWidth={m.dismissIconStrokeWidth} />}
            loading={remove.isPending && remove.variables === r.person.id}
            onPress={() => remove.mutate(r.person.id)}
            accessibilityLabel={r.direction === 'incoming' ? 'İsteği sil' : 'İsteği geri çek'}
          />
        </>
      }
    />
  );

  const friendRow = (f: FriendToday, i: number, all: FriendToday[]) => {
    const state = f.doneToday === true ? 'done' : f.doneToday === false ? 'pending' : 'plain';
    return (
      <PersonRow
        key={f.id}
        divider={i < all.length - 1}
        onPress={() => openProfile(f.id)}
        accessibilityLabel={`${f.displayName} profili`}
        avatar={<PersonAvatar person={f} size={m.rowAvatar} state={state} />}
        title={f.displayName}
        sub={friendSub(f)}
        trailing={
          state === 'pending' ? (
            <SmallButton
              title="Dürt"
              variant="poke"
              paddingX={m.pokePillPaddingX}
              onPress={() => openPoke(f.id)}
              accessibilityLabel={`${f.displayName} kişisini dürt`}
            />
          ) : state === 'done' ? (
            <SmallButton
              title="Gaz ver"
              variant="hype"
              onPress={() => openPoke(f.id, 'hype')}
              accessibilityLabel={`${f.displayName} kişisine gaz ver`}
            />
          ) : undefined
        }
      />
    );
  };

  const resultRow = (p: SearchResult, i: number, all: SearchResult[]) => {
    const incoming = incomingBy.get(p.id);
    let trailing;
    if (p.isFriend) {
      trailing = undefined;
    } else if (incoming) {
      trailing = (
        <SmallButton
          title="Kabul et"
          variant="action"
          loading={accept.isPending && accept.variables === incoming.id}
          onPress={() => accept.mutate(incoming.id)}
        />
      );
    } else if (p.requestPending) {
      trailing = <SmallButton title="Gönderildi" variant="muted" disabled />;
    } else {
      trailing = (
        <SmallButton
          title="Ekle"
          variant="action"
          loading={sendRequest.isPending && sendRequest.variables === p.id}
          onPress={() => sendRequest.mutate(p.id)}
          accessibilityLabel={`${p.displayName} kişisine arkadaşlık isteği gönder`}
        />
      );
    }
    return (
      <PersonRow
        key={p.id}
        divider={i < all.length - 1}
        onPress={p.isFriend ? () => openProfile(p.id) : undefined}
        avatar={<PersonAvatar person={p} size={m.rowAvatar} />}
        title={p.displayName}
        sub={`@${p.username}`}
        trailing={trailing}
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
    return <ListCard style={styles.list}>{results.map(resultRow)}</ListCard>;
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
    const sections = [
      { key: 'requests', label: 'İSTEKLER', color: undefined, rows: requestList.map(requestRow) },
      { key: 'pending', label: 'BUGÜN BEKLEYENLER', color: c.pendingLabel, rows: groups.pending.map(friendRow) },
      { key: 'done', label: 'BUGÜNÜ TAMAMLAYANLAR', color: c.doneLabel, rows: groups.done.map(friendRow) },
      { key: 'idle', label: 'BUGÜN GÖREVİ OLMAYANLAR', color: undefined, rows: groups.idle.map(friendRow) },
    ].filter((s) => s.rows.length > 0);
    return (
      <>
        {sections.map((s, i) => (
          <View key={s.key}>
            <SectionTitle color={s.color} style={{ marginTop: i === 0 ? m.sectionFirstMarginTop : m.sectionMarginTop }}>
              {`${s.label} · ${s.rows.length}`}
            </SectionTitle>
            <ListCard style={styles.list}>{s.rows}</ListCard>
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
          <Pressable
            onPress={() => searchRef.current?.focus()}
            accessibilityRole="button"
            accessibilityLabel="Arkadaş ekle"
            style={({ pressed }) => [styles.addButton, { backgroundColor: c.inkButtonBg }, pressed && styles.pressed]}>
            <UserPlusIcon color={c.inkButtonText} size={m.addIconSize} strokeWidth={m.addIconStrokeWidth} />
          </Pressable>
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
  addButton: {
    width: m.addButtonSize,
    height: m.addButtonSize,
    borderRadius: m.addButtonSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
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
