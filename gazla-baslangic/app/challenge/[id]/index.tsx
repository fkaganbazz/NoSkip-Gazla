import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddIcon, CameraIcon, CheckIcon, challengeIcons } from '@/components/icons';
import { Button, ErrorState, IconButton, LoadingState, Toast } from '@/components/ui';
import {
  useAuth,
  useChallenge,
  useChallengeBoard,
  useChallengeCalendar,
  useCheckinMutation,
  useLeaveChallengeMutation,
  useMyMembership,
  useToday,
} from '@/data';
import BoardCard from '@/features/challenge/BoardCard';
import { DotsIcon } from '@/features/challenge/icons';
import {
  CATEGORY_LABELS,
  accusative,
  buildDays,
  challengePhase,
  formatShortDate,
  isoDate,
  addDays,
} from '@/features/challenge/logic';
import OptionsMenu from '@/features/challenge/OptionsMenu';
import PokeCta from '@/features/challenge/PokeCta';
import ProgressCard from '@/features/challenge/ProgressCard';
import { useNow } from '@/features/today/useNow';
import { challengeColors, challengeMetrics as m, challengeTypography as t } from '@/theme/challenge';
import { borderWidth, challengeTints, layout, radius, useTheme } from '@/theme';

// Challenge detayı — design/Detail.dc.html (açık) ve design/DetailDark.dc.html (koyu).
// Veri: challenges, challenge_members (kendi satırı), challenge_board, takvim; gün numarası my_today'den.
export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const c = challengeColors[scheme];
  const now = useNow();
  const { session } = useAuth();
  const meId = session?.userId;

  const challenge = useChallenge(id);
  const membership = useMyMembership(id);
  const board = useChallengeBoard(id);
  const calendar = useChallengeCalendar(id);
  const today = useToday();
  const checkin = useCheckinMutation();
  const leave = useLeaveChallengeMutation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Gece 00:00–02:00 arası dünün satırı da gelir: başlıkta en yeni gün, işaretlemede bekleyen ilk gün
  const tasks = useMemo(
    () => (today.data ?? []).filter((x) => x.challengeId === id).sort((a, b) => a.localDate.localeCompare(b.localDate)),
    [today.data, id],
  );
  const task = tasks[tasks.length - 1];
  const openTask = tasks.find((x) => !x.done);
  const todayIso = task?.localDate ?? isoDate(now);

  const days = useMemo(
    () => (challenge.data ? buildDays(challenge.data, calendar.data, todayIso) : []),
    [challenge.data, calendar.data, todayIso],
  );

  const onMark = useCallback(() => {
    if (!openTask) return;
    if (openTask.taskType === 'check') {
      checkin.mutate({ challengeId: openTask.challengeId, localDate: openTask.localDate });
    } else if (openTask.taskType === 'number') {
      router.push({ pathname: '/checkin/number/[id]', params: { id: openTask.challengeId, date: openTask.localDate } });
    } else {
      router.push({ pathname: '/checkin/photo/[id]', params: { id: openTask.challengeId, date: openTask.localDate } });
    }
  }, [openTask, checkin, router]);

  const goPoke = (userId: string) => router.push({ pathname: '/poke/[userId]', params: { userId } });

  const refetchAll = () => {
    challenge.refetch();
    membership.refetch();
    board.refetch();
    calendar.refetch();
    today.refetch();
  };

  const top = insets.top + layout.screenTopGap;

  if (challenge.isPending || board.isPending || membership.isPending) {
    return (
      <View style={[styles.screen, { paddingTop: top }]}>
        <View style={styles.headerRow}>
          <IconButton icon="back" />
        </View>
        <LoadingState />
      </View>
    );
  }

  if (challenge.error || !challenge.data) {
    return (
      <View style={[styles.screen, { paddingTop: top }]}>
        <View style={styles.headerRow}>
          <IconButton icon="back" />
        </View>
        <ErrorState message={challenge.error?.message} onRetry={refetchAll} />
      </View>
    );
  }

  const ch = challenge.data;
  const members = board.data ?? [];
  const tint = challengeTints[ch.tint][scheme];
  const Icon = challengeIcons[ch.icon];
  const active = membership.data?.status === 'active';
  const phase = challengePhase(ch, membership.data, task, todayIso);

  const progressTitle =
    phase.kind === 'running'
      ? `Gün ${phase.dayIndex}/${ch.durationDays}`
      : phase.kind === 'upcoming'
        ? `Gün 0/${ch.durationDays}`
        : `Gün ${ch.durationDays}/${ch.durationDays}`;
  const progressDetail =
    phase.kind === 'running'
      ? phase.daysLeft > 0
        ? `${phase.daysLeft} gün kaldı`
        : 'Son gün'
      : phase.kind === 'upcoming'
        ? phase.startDate === addDays(isoDate(now), 1)
          ? 'Yarın başlıyor'
          : `${formatShortDate(phase.startDate)} başlıyor`
        : 'Bitti';

  // Alt buton: bitti → özet; bugün bekliyor → işaretle; bekleyen arkadaş → dürt; yoksa davet
  const waitingFriend = phase.kind === 'running' ? members.find((x) => x.id !== meId && !x.doneToday) : undefined;
  let cta: ReactNode = null;
  if (phase.kind === 'finished' && membership.data && membership.data.status !== 'left') {
    cta = <Button title="Özeti gör" onPress={() => router.push({ pathname: '/challenge/[id]/finished', params: { id: ch.id } })} />;
  } else if (active && openTask) {
    const markIcon =
      openTask.taskType === 'photo' ? (
        <CameraIcon color={colors.onAction} size={m.ctaIconSize} strokeWidth={m.ctaIconStroke} />
      ) : openTask.taskType === 'number' ? (
        <AddIcon color={colors.onAction} size={m.ctaIconSize} strokeWidth={m.ctaIconStroke} />
      ) : (
        <CheckIcon color={colors.onAction} size={m.ctaIconSize} strokeWidth={m.ctaIconStroke} />
      );
    const markTitle =
      openTask.taskType === 'photo' ? 'Fotoğrafla tamamla' : openTask.taskType === 'number' ? 'Bugünkü değeri gir' : 'Bugünü tamamla';
    cta = <Button title={markTitle} icon={markIcon} loading={checkin.isPending} onPress={onMark} />;
  } else if (waitingFriend) {
    cta = <PokeCta title={`${accusative(waitingFriend.displayName)} dürt`} onPress={() => goPoke(waitingFriend.id)} />;
  } else if (active && phase.kind !== 'finished') {
    cta = <Button title="Arkadaş davet et" variant="secondary" onPress={() => router.push({ pathname: '/invite-friends', params: { challengeId: ch.id } })} />;
  }

  const ctaBottom = Math.max(m.ctaBottom, insets.bottom);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: top, paddingBottom: (cta ? m.ctaReserve : 0) + ctaBottom },
        ]}
        refreshControl={<RefreshControl refreshing={challenge.isRefetching || board.isRefetching} onRefresh={refetchAll} />}>
        <View style={styles.headerRow}>
          <IconButton icon="back" />
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Challenge seçenekleri"
            hitSlop={4}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border },
            ]}>
            <DotsIcon color={colors.text} size={m.iconSize} />
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <View style={[styles.tile, { backgroundColor: tint.bg }]}>
            <Icon color={tint.ink} size={m.tileIconSize} strokeWidth={m.tileIconStroke} />
          </View>
          <Text accessibilityRole="header" style={[t.title, styles.title, { color: colors.text }]}>
            {ch.title}
          </Text>
        </View>

        <View style={styles.chips}>
          <ChipTag label={`${ch.durationDays} gün`} bg={c.durationChipBg} fg={c.durationChipText} />
          {ch.category && <ChipTag label={CATEGORY_LABELS[ch.category]} bg={tint.bg} fg={tint.ink} />}
          {members.length > 0 && <ChipTag label={`${members.length} kişi`} bg={c.membersChipBg} fg={c.membersChipText} />}
          {ch.reminderTime && (
            <ChipTag label={`Hatırlatma ${ch.reminderTime}`} bg={c.reminderChipBg} fg={c.reminderChipText} />
          )}
        </View>

        <ProgressCard
          title={progressTitle}
          detail={progressDetail}
          doneToday={phase.kind === 'running' && !!task?.done}
          days={days}
        />

        {board.error ? (
          <ErrorState message={board.error.message} onRetry={() => board.refetch()} />
        ) : (
          members.length > 0 && <BoardCard members={members} meId={meId} onPoke={goPoke} />
        )}
      </ScrollView>

      {cta && (
        <View style={[styles.cta, { bottom: ctaBottom }]}>
          {checkin.error && <Toast message={checkin.error.message} />}
          {cta}
        </View>
      )}

      <OptionsMenu
        visible={menuOpen}
        onClose={() => {
          setMenuOpen(false);
          leave.reset();
        }}
        onInvite={
          active && phase.kind !== 'finished'
            ? () => {
                setMenuOpen(false);
                router.push({ pathname: '/invite-friends', params: { challengeId: ch.id } });
              }
            : undefined
        }
        onReport={() => {
          setMenuOpen(false);
          router.push({ pathname: '/report', params: { target: 'challenge', challengeId: ch.id } });
        }}
        onLeave={
          active && phase.kind !== 'finished'
            ? () =>
                leave.mutate(ch.id, {
                  onSuccess: () => {
                    setMenuOpen(false);
                    router.canGoBack() ? router.back() : router.replace('/');
                  },
                })
            : undefined
        }
        leaving={leave.isPending}
        leaveError={leave.error?.message ?? null}
      />
    </View>
  );
}

function ChipTag({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[t.chip, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: m.iconButton,
    height: m.iconButton,
    borderRadius: m.iconButton / 2,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    marginTop: m.titleMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.titleGap,
  },
  tile: {
    width: m.tile,
    height: m.tile,
    borderRadius: m.tileRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  chips: {
    marginTop: m.chipsMarginTop,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m.chipsGap,
  },
  chip: {
    paddingVertical: m.chipPaddingY,
    paddingHorizontal: m.chipPaddingX,
    borderRadius: radius.full,
  },
  cta: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
    gap: m.chipsGap,
  },
});
