import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyToday from '@/features/today/EmptyToday';
import FriendsRow from '@/features/today/FriendsRow';
import HeroCard from '@/features/today/HeroCard';
import SectionHeader from '@/features/today/SectionHeader';
import TaskCard from '@/features/today/TaskCard';
import TodayHeader from '@/features/today/TodayHeader';
import {
  formatDayLabel,
  greeting,
  heroState,
  minutesUntilMidnight,
  toFriendRow,
  toTaskRow,
} from '@/features/today/logic';
import { useNow } from '@/features/today/useNow';
import {
  useActivity,
  useAuth,
  useCheckinMutation,
  useFriendsToday,
  usePendingRescues,
  useStreak,
  useToday,
  useUndoCheckinMutation,
} from '@/data';
import { layout, todayColors, todayMetrics as m, useTheme } from '@/theme';

// Bugün — design/Today.dc.html (açık) ve design/TodayDark.dc.html (koyu).
// Veri: my_today, my_streak, friends_today (src/data). Görev yoksa EmptyToday.dc.html.
export default function TodayScreen() {
  const { scheme, colors } = useTheme();
  const router = useRouter();
  const now = useNow();
  const { profile } = useAuth();

  const today = useToday();
  const streak = useStreak();
  const friends = useFriendsToday();
  const activity = useActivity();
  const rescues = usePendingRescues();
  const checkin = useCheckinMutation();
  const undo = useUndoCheckinMutation();

  const tasks = useMemo(() => today.data ?? [], [today.data]);
  const rows = useMemo(() => tasks.map((t) => toTaskRow(t, now)), [tasks, now]);
  const friendRows = useMemo(() => (friends.data ?? []).filter((f) => f.doneToday !== null).map(toFriendRow), [friends.data]);

  // Anlar yalnızca Bugün odaktayken açılır: işaretleme alt sayfası/fotoğraf ekranı kapanırken
  // (router.back) üstlerine açılan ekranı da kapatmasın.
  const focused = useIsFocused();

  // Günün son görevi işaretlenince tamamlama anı (her gün bir kez; ilk yüklemede değil)
  const allDone = tasks.length > 0 && tasks.every((t) => t.done);
  const prevAllDone = useRef<boolean | null>(null);
  const celebrate = useRef<string | null>(null);
  const celebrated = useRef(new Set<string>());
  useEffect(() => {
    if (today.isPending) return;
    const day = tasks[0]?.localDate;
    if (prevAllDone.current === false && allDone && day && !celebrated.current.has(day)) celebrate.current = day;
    if (!allDone) celebrate.current = null;
    prevAllDone.current = allDone;
  }, [allDone, today.isPending, tasks]);
  useEffect(() => {
    const day = celebrate.current;
    if (!focused || !allDone || !day) return;
    celebrate.current = null;
    celebrated.current.add(day);
    router.push('/completion');
  }, [focused, allDone, router]);

  // Seri koptuysa kurtarma ekranı (her kaçırılan gün için oturumda bir kez)
  const rescueShown = useRef(new Set<string>());
  useEffect(() => {
    const first = rescues.data?.[0];
    if (!focused || !first) return;
    const key = `${first.challengeId}|${first.missedDate}`;
    if (rescueShown.current.has(key)) return;
    rescueShown.current.add(key);
    router.push('/streak-lost');
  }, [focused, rescues.data, router]);

  const onTask = useCallback(
    (rowId: string) => {
      const task = tasks.find((t) => `${t.challengeId}|${t.localDate}` === rowId);
      if (!task) return;
      if (task.done) {
        undo.mutate({ challengeId: task.challengeId, localDate: task.localDate });
        return;
      }
      if (task.taskType === 'check') {
        checkin.mutate({ challengeId: task.challengeId, localDate: task.localDate });
      } else if (task.taskType === 'number') {
        router.push({ pathname: '/checkin/number/[id]', params: { id: task.challengeId, date: task.localDate } });
      } else {
        router.push({ pathname: '/checkin/photo/[id]', params: { id: task.challengeId, date: task.localDate } });
      }
    },
    [tasks, checkin, undo, router],
  );

  if (today.isPending || streak.isPending) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.action} />
      </SafeAreaView>
    );
  }

  if (tasks.length === 0) {
    return <EmptyToday name={profile?.displayName ?? ''} />;
  }

  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  // Sunucu serisi bugünü de sayar (bugün tamamsa); kahraman kartı dünkü seriden hesaplar
  const s = streak.data;
  const serverAllDone = !!s && s.totalToday > 0 && s.doneToday === s.totalToday;
  const streakBefore = s ? s.currentStreak - (serverAllDone ? 1 : 0) : 0;
  const hero = heroState(doneCount, total, streakBefore, minutesUntilMidnight(now));
  const waiting = friendRows.filter((f) => !f.doneToday).length;
  const unread = (activity.data ?? []).filter((a) => !a.readAt).length;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={today.isRefetching}
            onRefresh={() => {
              today.refetch();
              streak.refetch();
              friends.refetch();
            }}
          />
        }>
        <TodayHeader
          dayLabel={formatDayLabel(now)}
          title={`${greeting(now)}, ${profile?.displayName ?? ''}`}
          unread={unread}
          onPressBell={() => router.push('/activity')}
        />

        <HeroCard done={doneCount} total={total} hero={hero} />

        <SectionHeader
          title="Bugünkü görevler"
          detail={`${doneCount}/${total} tamam`}
          style={styles.tasksHeader}
        />
        <View style={styles.tasks}>
          {rows.map((row) => (
            <TaskCard
              key={row.id}
              task={row}
              done={row.done}
              onToggle={onTask}
              onOpen={() => router.push({ pathname: '/challenge/[id]', params: { id: row.challengeId } })}
            />
          ))}
        </View>

        {friendRows.length > 0 && (
          <>
            <SectionHeader
              title="Arkadaşların"
              detail={waiting > 0 ? `${waiting} kişi bekliyor` : undefined}
              detailColor={todayColors[scheme].waitingText}
              style={styles.friendsHeader}
            />
            <FriendsRow
              friends={friendRows}
              onPoke={(id) => router.push({ pathname: '/poke/[userId]', params: { userId: id } })}
              onInvite={() => router.push('/invite-friends')}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: layout.screenTopGap,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenPadding,
  },
  tasksHeader: {
    marginTop: m.tasksHeaderMarginTop,
  },
  tasks: {
    marginTop: m.sectionListMarginTop,
    gap: m.taskGap,
  },
  friendsHeader: {
    marginTop: m.friendsHeaderMarginTop,
  },
});
