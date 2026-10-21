import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActionSheet, { type ActionSheetItem } from '@/components/ActionSheet';
import { CategoryTile } from '@/components/CategoryTile';
import { AddIcon, CameraIcon, CheckIcon, HandIcon, type IconProps } from '@/components/icons';
import { Button, Chip, ErrorState, IconButton, LoadingState, Toast, ToastHost, useToast } from '@/components/ui';
import {
  useAuth,
  useChallenge,
  useChallengeBoard,
  useChallengeCalendar,
  useCheckinMutation,
  useLeaveChallengeMutation,
  useMyMembership,
  useSetMyReminderMutation,
  useToday,
} from '@/data';
import BoardCard from '@/features/challenge/BoardCard';
import {
  CATEGORY_LABELS,
  accusative,
  buildDays,
  challengePhase,
  formatShortDate,
  hhmm,
  isoDate,
  addDays,
} from '@/features/challenge/logic';
import ProgressCard from '@/features/challenge/ProgressCard';
import ReminderSheet from '@/features/challenge/ReminderSheet';
import { useNow } from '@/features/today/useNow';
import { challengeMetrics as m, challengeTypography as t } from '@/theme/challenge';
import { componentMetrics as cm, layout, useTheme } from '@/theme';

// Challenge detayı — design/Detail.dc.html (açık) ve design/DetailDark.dc.html (koyu).
// Veri: challenge_detail (durum ve gün numarası sunucudan), challenge_members (kendi satırı: etkin hatırlatma
// saati), challenge_board, takvim; bugünkü görev my_today'den.
export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
  const setReminder = useSetMyReminderMutation();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  // Gece 00:00–02:00 arası dünün satırı da gelir: "Bugün tamam"da en yeni gün, işaretlemede bekleyen ilk gün
  const tasks = useMemo(
    () => (today.data ?? []).filter((x) => x.challengeId === id).sort((a, b) => a.localDate.localeCompare(b.localDate)),
    [today.data, id],
  );
  const task = tasks[tasks.length - 1];
  const openTask = tasks.find((x) => !x.done);

  // Takvimde "bugün": sunucunun gün numarası (yalnızca süren challenge'da)
  const todayIndex = challenge.data?.status === 'active' ? challenge.data.dayIndex : null;
  const days = useMemo(
    () => (challenge.data ? buildDays(challenge.data, calendar.data, todayIndex) : []),
    [challenge.data, calendar.data, todayIndex],
  );

  const onMark = useCallback(() => {
    if (!openTask) return;
    if (openTask.taskType === 'check') {
      checkin.mutate({ challengeId: openTask.challengeId, localDate: openTask.localDate });
    } else {
      const params = { challengeId: openTask.challengeId, date: openTask.localDate };
      router.push({ pathname: openTask.taskType === 'number' ? '/checkin/number' : '/checkin/photo', params });
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
  const active = membership.data?.status === 'active';
  const phase = challengePhase(ch);
  // Etkin hatırlatma saati: üyelikte kişisel, yoksa grubun (üye değilse grubun saati)
  const reminderTime = membership.data ? membership.data.reminderTime : ch.reminderTime;

  const progressTitle =
    phase.kind === 'upcoming' ? `Gün 0/${ch.durationDays}` : `Gün ${phase.dayIndex}/${ch.durationDays}`;
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

  // "…" menüsü (EKRANLAR 2.5 sırası): ayrıl, hatırlatma saati, davet — yalnızca süren challenge'ın aktif
  // üyesine; şikayet herkese
  const canChange = active && phase.kind !== 'finished';
  const memberItems: ActionSheetItem[] = canChange
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
        {
          key: 'reminder',
          label: 'Hatırlatma saatini değiştir',
          onPress: () => setReminderOpen(true),
        },
        {
          key: 'invite',
          label: 'Arkadaş davet et',
          onPress: () => router.push({ pathname: '/invite-friends', params: { challengeId: ch.id } }),
        },
      ]
    : [];
  // Challenge şikayeti, oluşturan kişiye yazılır (submit_report: /report/<kurucu>?target=challenge); kendi
  // challenge'ında ya da kurucunun hesabı silindiyse şikayet edilecek kişi yok, satır gösterilmez
  const creatorId = ch.createdBy && ch.createdBy !== meId ? ch.createdBy : null;
  const menuItems: ActionSheetItem[] = [
    ...memberItems,
    ...(creatorId
      ? [
          {
            key: 'report',
            label: 'Şikayet et',
            onPress: () =>
              router.push({
                pathname: '/report/[userId]',
                params: { userId: creatorId, target: 'challenge', challengeId: ch.id },
              }),
          },
        ]
      : []),
  ];

  const onReminder = (time: string | null) =>
    setReminder.mutate({ challengeId: ch.id, time }, { onError: (e) => toast.show({ message: e.message }) });

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
          {menuItems.length > 0 && (
            <IconButton icon="options" accessibilityLabel="Challenge seçenekleri" onPress={() => setMenuOpen(true)} />
          )}
        </View>

        <View style={styles.titleRow}>
          <CategoryTile icon={ch.icon} tint={ch.tint} size={56} />
          <Text accessibilityRole="header" style={[t.title, styles.title, { color: colors.text }]}>
            {ch.title}
          </Text>
        </View>

        <View style={styles.chips}>
          <Chip size="xs" tone="ink" label={`${ch.durationDays} gün`} />
          {ch.category && <Chip size="xs" tint={ch.tint} label={CATEGORY_LABELS[ch.category]} />}
          {ch.memberCount > 0 && <Chip size="xs" tone="warning" label={`${ch.memberCount} kişi`} />}
          {reminderTime && <Chip size="xs" tone="muted" label={`Hatırlatma ${hhmm(reminderTime)}`} />}
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
          members.length > 0 && <BoardCard members={members} meId={meId} running={phase.kind === 'running'} onPoke={goPoke} />
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

      <ReminderSheet
        visible={reminderOpen}
        groupTime={ch.reminderTime}
        personalTime={membership.data?.personalReminderTime ?? null}
        onSelect={onReminder}
        onClose={() => setReminderOpen(false)}
      />

      {/* Alt butonun üstünde */}
      <ToastHost toast={toast} offset={cta ? m.ctaReserve + ctaBottom - Math.max(insets.bottom, layout.screenPadding) : 0} />
    </View>
  );
}

/** Alt butonun ikonu: buton metninin renginde, 20 / 2.6 (Detail.dc.html) */
function ctaIcon(Icon: ComponentType<IconProps>) {
  return (color: string) => <Icon color={color} size={cm.buttonIconSize} strokeWidth={cm.buttonIconStroke} />;
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
  cta: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
    gap: m.chipsGap,
  },
});
