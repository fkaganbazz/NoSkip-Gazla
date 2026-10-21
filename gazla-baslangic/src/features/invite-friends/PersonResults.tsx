import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FriendList, FriendRow, FriendRowButton } from '@/components/FriendRow';
import {
  ApiError,
  useAcceptFriendRequestMutation,
  useFriendRequests,
  useSendFriendRequestMutation,
  type SearchResult,
} from '@/data';
import { componentTypography, useTheme } from '@/theme';
import { onboardingMetrics as m } from '@/theme/onboarding';

/**
 * Kişi sonuçları (search_profiles, find_contacts): "Ekle" arkadaşlık isteği gönderir, gelen isteği olan kişi
 * "Kabul et" ile çıkar, arkadaşsa alt satırda "Arkadaşın" (Friends araması gibi). Liste sabit bir sonuçtan
 * gelse de (rehber) gönderilen / kabul edilen istekler satırda hemen görünür.
 */
export default function PersonResults({ people }: { people: SearchResult[] }) {
  const { colors } = useTheme();
  const requests = useFriendRequests();
  const sendRequest = useSendFriendRequestMutation();
  const accept = useAcceptFriendRequestMutation();
  const [sent, setSent] = useState<ReadonlySet<string>>(new Set());
  const [accepted, setAccepted] = useState<ReadonlySet<string>>(new Set());

  const incomingBy = useMemo(
    () => new Map((requests.data ?? []).filter((r) => r.direction === 'incoming').map((r) => [r.person.id, r])),
    [requests.data],
  );
  const mutationError = [sendRequest.error, accept.error].find((e) => e instanceof ApiError) as ApiError | undefined;

  const row = (p: SearchResult, i: number, all: SearchResult[]) => {
    const friend = p.isFriend || accepted.has(p.id);
    const incoming = friend ? undefined : incomingBy.get(p.id);
    return (
      <FriendRow
        key={p.id}
        divider={i < all.length - 1}
        person={p}
        sub={friend ? `@${p.username} · Arkadaşın` : `@${p.username}`}
        action={
          friend || incoming
            ? undefined
            : p.requestPending || sent.has(p.id)
              ? { type: 'sent' }
              : {
                  type: 'add',
                  onPress: () =>
                    sendRequest.mutate(p.id, { onSuccess: () => setSent((s) => new Set(s).add(p.id)) }),
                  loading: sendRequest.isPending && sendRequest.variables === p.id,
                }
        }
        trailing={
          incoming ? (
            <FriendRowButton
              title="Kabul et"
              variant="action"
              loading={accept.isPending && accept.variables === incoming.id}
              accessibilityLabel={`${p.displayName} isteğini kabul et`}
              onPress={() => accept.mutate(incoming.id, { onSuccess: () => setAccepted((s) => new Set(s).add(p.id)) })}
            />
          ) : undefined
        }
      />
    );
  };

  return (
    <View style={styles.root}>
      {mutationError && (
        <Text accessibilityLiveRegion="polite" style={[componentTypography.inputError, { color: colors.dangerText }]}>
          {mutationError.message}
        </Text>
      )}
      <FriendList>{people.map(row)}</FriendList>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: m.listMarginTop,
  },
});
