import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ErrorState, IconButton, LoadingState } from '@/components/ui';
import { useTodayTasks } from '@/data';
import InviteFriends from '@/features/invite-friends/InviteFriends';
import { StepIntro } from '@/features/onboarding/StepScreen';
import { useT } from '@/i18n';
import { layout, spacing, useTheme } from '@/theme';

// Arkadaşlarını çağır (modal) — design/InviteFriends.dc.html. `challengeId` verilmezse bugünkü ilk
// challenge'a davet edilir. Kapatınca geri döner. "Kullanıcı adıyla ara" onboarding'deki gibi alt sayfada.
export default function InviteFriendsModal() {
  const router = useRouter();
  const t = useT();
  const { challengeId: param } = useLocalSearchParams<{ challengeId?: string }>();
  const today = useTodayTasks();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const challengeId = param ?? today.data?.[0]?.challengeId ?? null;

  if (!param && (today.isPending || today.isError || !challengeId)) {
    return (
      <Fallback onClose={close}>
        {today.isPending ? (
          <LoadingState />
        ) : today.isError ? (
          <ErrorState onRetry={() => today.refetch()} />
        ) : (
          // Davet edilecek challenge yok: önce bir tane oluşturulmalı
          <View style={styles.empty}>
            <StepIntro marginTop={0} title={t.invite.friends.noChallengeTitle} body={t.invite.friends.noChallengeBody} />
            <Button title={t.invite.friends.createChallenge} onPress={() => router.replace('/create')} />
          </View>
        )}
      </Fallback>
    );
  }

  return <InviteFriends variant="modal" challengeId={challengeId} onClose={close} />;
}

function Fallback({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + layout.screenTopGap }]}>
      <View style={styles.header}>
        <IconButton icon="close" accessibilityLabel={t.common.close} onPress={onClose} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  header: {
    flexDirection: 'row',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
});
