import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActionSheet, { type ActionSheetItem } from '@/components/ActionSheet';
import { CategoryTile } from '@/components/CategoryTile';
import { AddIcon, CameraIcon, CheckIcon, HandIcon, type IconProps } from '@/components/icons';
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
import {
  CATEGORY_LABELS,
  accusative,
  buildDays,
  challengePhase,
  formatShortDate,
  isoDate,
  addDays,
} from '@/features/challenge/logic';
import ProgressCard from '@/features/challenge/ProgressCard';
import { useNow } from '@/features/today/useNow';
import { challengeColors, challengeMetrics as m, challengeTypography as t } from '@/theme/challenge';
import { challengeTints, componentMetrics as cm, layout, radius, useTheme } from '@/theme';

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

  const goPoke = (userId: string) => router.push({ pathname: '/poke/[userId]', params: { userId, challengeId: id } });

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
          <IconButton icon="back" accessibilityLabel="Geri" />
        </View>
        <LoadingState />
      </View>
    );
  }

  if (challenge.error || !challenge.data) {
    return (
      <View style={[styles.screen, { paddingTop: top }]}>
        <View style={styles.headerRow}>
          <IconButton icon="back" accessibilityLabel="Geri" />
        </View>
        <ErrorState message={challenge.error?.message} onRetry={refetchAll} />
      </View>
    );
  }

  const ch = challenge.data;
  const members = board.data ?? [];
  const tint = challengeTints[ch.tint][scheme];
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
    const markIcon = openTask.taskType === 'photo' ? CameraIcon : openTask.taskType === 'number' ? AddIcon : CheckIcon;
    const markTitle =
      openTask.taskType === 'photo' ? 'Fotoğrafla tamamla' : openTask.taskType === 'number' ? 'Bugünkü değeri gir' : 'Bugünü tamamla';
    cta = <Button title={markTitle} icon={ctaIcon(markIcon)} loading={checkin.isPending} onPress={onMark} />;
  } else if (waitingFriend) {
    cta = (
      <Button
        title={`${accusative(waitingFriend.displayName)} dürt`}
        variant="orange"
        icon={ctaIcon(HandIcon)}
        onPress={() => goPoke(waitingFriend.id)}
      />
    );
  } else if (active && phase.kind !== 'finished') {
    cta = <Button title="Arkadaş davet et" variant="secondary" onPress={() => router.push({ pathname: '/invite-friends', params: { challengeId: ch.id } })} />;
  }

  const ctaBottom = Math.max(m.ctaBottom, insets.bottom);

  // "…" menüsü: davet ve ayrılma yalnızca süren challenge'ın aktif üyesine
  const canChange = active && phase.kind !== 'finished';
  const menuItems: ActionSheetItem[] = [
    ...(canChange
      ? [
          {
            key: 'invite',
            label: 'Arkadaş davet et',
            onPress: () => router.push({ pathname: '/invite-friends', params: { challengeId: ch.id } }),
          },
        ]
      : []),
    {
      key: 'report',
      label: 'Şikayet et',
      // Challenge şikayeti, oluşturan kişiye yazılır (submit_report)
      onPress: () =>
        router.push({
          pathname: '/report',
          params: { targetType: 'challenge', targetId: ch.id, ...(ch.createdBy ? { userId: ch.createdBy } : {}) },
        }),
    },
    ...(canChange
      ? [
          {
            key: 'leave',
            label: "Challenge'dan ayrıl",
            danger: true,
            confirm: {
              title: "Challenge'dan ayrıl?",
              message: 'Bu challenge artık Bugün listende görünmez ve grup sıralamasından çıkarsın.',
              confirmLabel: 'Ayrıl',
              loading: leave.isPending,
              error: leave.error?.message ?? null,
            },
            onPress: () =>
              leave.mutate(ch.id, {
                onSuccess: () => {
                  setMenuOpen(false);
                  router.canGoBack() ? router.back() : router.replace('/');
                },
              }),
          },
        ]
      : []),
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: top, paddingBottom: (cta ? m.ctaReserve : 0) + ctaBottom },
        ]}
        refreshControl={<RefreshControl refreshing={challenge.isRefetching || board.isRefetching} onRefresh={refetchAll} />}>
        <View style={styles.headerRow}>
          <IconButton icon="back" accessibilityLabel="Geri" />
          <IconButton icon="options" accessibilityLabel="Challenge seçenekleri" onPress={() => setMenuOpen(true)} />
        </View>

        <View style={styles.titleRow}>
          <CategoryTile icon={ch.icon} tint={ch.tint} size={56} />
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

      <ActionSheet
        visible={menuOpen}
        onClose={() => {
          setMenuOpen(false);
          leave.reset();
        }}
        title={ch.title}
        accessibilityLabel="Challenge seçenekleri"
        items={menuItems}
      />
    </View>
  );
}

/** Alt butonun ikonu: buton metninin renginde, 20 / 2.6 (Detail.dc.html) */
function ctaIcon(Icon: ComponentType<IconProps>) {
  return (color: string) => <Icon color={color} size={cm.buttonIconSize} strokeWidth={cm.buttonIconStroke} />;
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
  titleRow: {
    marginTop: m.titleMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.titleGap,
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
