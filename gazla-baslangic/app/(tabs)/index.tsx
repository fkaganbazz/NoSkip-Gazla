import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FriendBubble, InviteBubble } from '@/components/FriendRow';
import { TaskCard } from '@/components/TaskCard';
import { ErrorState, Skeleton, SkeletonTaskCard, useToast } from '@/components/ui';
import {
  ApiError,
  useAuth,
  useCheckin,
  useFriendsToday,
  useRescueStreak,
  useStreak,
  useTodayTasks,
  useUnreadCount,
  useUnseenFinished,
} from '@/data';
import EmptyToday from '@/features/today/EmptyToday';
import HeroCard from '@/features/today/HeroCard';
import SectionHeader from '@/features/today/SectionHeader';
import TodayHeader from '@/features/today/TodayHeader';
import TodayToasts from '@/features/today/TodayToasts';
import {
  formatDayLabel,
  greeting,
  heroState,
  minutesUntilMidnight,
  toFriendRow,
  toTaskRow,
} from '@/features/today/logic';
import { useNow } from '@/features/today/useNow';
import { useT } from '@/i18n';
import { layout, spacing, todayColors, todayMetrics as m, useTheme } from '@/theme';

// Bugün — design/Today.dc.html (açık) ve design/TodayDark.dc.html (koyu).
// Veri: my_today, my_streak, friends_today (src/data). Görev yoksa EmptyToday.dc.html.
// Durumlar: yükleniyor (iskelet kartlar), hata (Tekrar dene), boş (veri geldi, görev yok), çevrimdışı (alt tost).
export default function TodayScreen() {
  const { scheme } = useTheme();
  const t = useT();
  const router = useRouter();
  const now = useNow();
  const { profile } = useAuth();

  const today = useTodayTasks();
  const streak = useStreak();
  const friends = useFriendsToday();
  const unreadCount = useUnreadCount();
  const rescues = useRescueStreak();
  const finished = useUnseenFinished();
  const checkin = useCheckin();
  const toast = useToast();
  const [toastHeight, setToastHeight] = useState(0);

  const tasks = useMemo(() => today.data ?? [], [today.data]);
  const rows = useMemo(() => tasks.map((task) => toTaskRow(task, now, t)), [tasks, now, t]);
  const friendRows = useMemo(() => (friends.data ?? []).filter((f) => f.doneToday !== null).map(toFriendRow), [friends.data]);

  // Anlar yalnızca Bugün odaktayken açılır: işaretleme alt sayfası/fotoğraf ekranı kapanırken
  // (router.back) üstlerine açılan ekranı da kapatmasın.
  const focused = useIsFocused();

  // Günün son görevi işaretlenince tamamlama anı (her gün bir kez; ilk yüklemede değil)
  const allDone = tasks.length > 0 && tasks.every((task) => task.done);
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

  // Otomatik açılan anlar, odaktayken birer birer (biri kapanınca Bugün yeniden odak alır, sıradaki açılır):
  // 1) tamamlama anı, 2) seri koptu (her kaçırılan gün için oturumda bir kez), 3) challenge bitti
  // (her challenge bir kez; Finished ekranı açılınca "görüldü" işaretler, sunucu bir daha döndürmez).
  const rescueShown = useRef(new Set<string>());
  const finishShown = useRef(new Set<string>());
  useEffect(() => {
    if (!focused) return;
    const day = celebrate.current;
    if (allDone && day) {
      celebrate.current = null;
      celebrated.current.add(day);
      router.push('/completion');
      return;
    }
    // Seri koptu ilk bekleyen kurtarmanın challenge'ıyla açılır; ekran sıradakilere kendisi geçer, bu yüzden o an
    // bekleyenlerin hepsi gösterilmiş sayılır (kapatınca Bugün aynı kurtarmaları yeniden açmaz)
    const pendingRescues = rescues.data ?? [];
    const rescueKey = (r: (typeof pendingRescues)[number]) => `${r.challengeId}|${r.missedDate}`;
    const rescue = pendingRescues.find((r) => !rescueShown.current.has(rescueKey(r)));
    if (rescue) {
      pendingRescues.forEach((r) => rescueShown.current.add(rescueKey(r)));
      router.push({ pathname: '/streak-lost/[challengeId]', params: { challengeId: rescue.challengeId } });
      return;
    }
    const done = finished.data?.find((f) => !finishShown.current.has(f.challengeId));
    if (done) {
      finishShown.current.add(done.challengeId);
      router.push({ pathname: '/challenge/[id]/finished', params: { id: done.challengeId } });
    }
  }, [focused, allDone, rescues.data, finished.data, router]);

  const findTask = useCallback(
    (rowId: string) => tasks.find((task) => `${task.challengeId}|${task.localDate}` === rowId),
    [tasks],
  );
  const showError = useCallback((error: Error) => toast.show({ message: error.message }), [toast]);

  // Sağdaki buton (EKRANLAR 2.1): işaretle tipi tek dokunuşla işaretler / tamamlanmışsa geri alır (iyimser, ağ
  // beklemez). Sayı ve fotoğraf tipi tamamlanmış olsa da her zaman kendi ekranını açar (değeri değiştirmek, yeni
  // fotoğraf ya da "Bugünü geri al" orada).
  const onAction = useCallback(
    (rowId: string) => {
      const task = findTask(rowId);
      if (!task) return;
      const target = { challengeId: task.challengeId, localDate: task.localDate };
      if (task.taskType === 'check') {
        if (task.done) checkin.undo(target, { onError: showError });
        else checkin.mark(target, { onError: showError });
      } else {
        const params = { challengeId: task.challengeId, date: task.localDate };
        router.push({ pathname: task.taskType === 'number' ? '/checkin/number' : '/checkin/photo', params });
      }
    },
    [findTask, checkin.mark, checkin.undo, router, showError],
  );

  // Kart gövdesi: işaretle tipi → challenge detayı; sayı → sayı gir; fotoğraf → fotoğraf kanıtı
  const onBody = useCallback(
    (rowId: string) => {
      const task = findTask(rowId);
      if (!task) return;
      const params = { challengeId: task.challengeId, date: task.localDate };
      if (task.taskType === 'number') {
        router.push({ pathname: '/checkin/number', params });
      } else if (task.taskType === 'photo') {
        router.push({ pathname: '/checkin/photo', params });
      } else {
        router.push({ pathname: '/challenge/[id]', params: { id: task.challengeId } });
      }
    },
    [findTask, router],
  );

  const retry = () => {
    today.refetch();
    streak.refetch();
    friends.refetch();
  };

  const header = (
    <TodayHeader
      dayLabel={formatDayLabel(now, t)}
      title={t.today.greeting.withName(greeting(now, t), profile?.displayName ?? '')}
      unread={unreadCount.data ?? 0}
      onPressBell={() => router.push('/activity')}
    />
  );
  const toasts = <TodayToasts toast={toast} onHeightChange={setToastHeight} />;
  // Tost görünürken içeriğin sonu onun üstünde kalsın
  const paddingBottom = Math.max(m.contentPaddingBottom, toastHeight > 0 ? m.toastBottom + toastHeight + spacing.sm : 0);

  // Hata yalnızca hiç veri yokken; yenileme hatasında eldeki liste kalır
  const loadError = (today.isError && !today.data ? today.error : null) ?? (streak.isError && !streak.data ? streak.error : null);
  if (loadError) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={[styles.content, styles.fill]}>
          {header}
          <ErrorState message={loadError instanceof ApiError ? loadError.message : undefined} onRetry={retry} />
        </View>
        {toasts}
      </SafeAreaView>
    );
  }

  // Yükleniyor (çevrimdışı açılışta sorgu bekler): üst satır gerçek, kahraman kart ve görevler iskelet
  if (today.isPending || streak.isPending) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom }]}>
          {header}
          <View accessible accessibilityLabel={t.common.loading} accessibilityState={{ busy: true }}>
            <Skeleton height={m.heroHeight} radius={m.heroRadius} style={styles.hero} />
            <SectionHeader title={t.today.sections.tasks} style={styles.tasksHeader} />
            <View style={styles.tasks}>
              {Array.from({ length: m.skeletonTaskCount }, (_, i) => (
                <SkeletonTaskCard key={i} />
              ))}
            </View>
          </View>
        </ScrollView>
        {toasts}
      </SafeAreaView>
    );
  }

  if (tasks.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyToday name={profile?.displayName ?? ''} />
        {toasts}
      </View>
    );
  }

  const total = tasks.length;
  const doneCount = tasks.filter((task) => task.done).length;
  // Sunucu serisi bugünü de sayar (bugün tamamsa); kahraman kartı dünkü seriden hesaplar
  const s = streak.data;
  const serverAllDone = !!s && s.totalToday > 0 && s.doneToday === s.totalToday;
  const streakBefore = s ? s.currentStreak - (serverAllDone ? 1 : 0) : 0;
  const hero = heroState(doneCount, total, streakBefore, minutesUntilMidnight(now), t);
  const waiting = friendRows.filter((f) => !f.doneToday).length;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom }]}
        refreshControl={<RefreshControl refreshing={today.isRefetching} onRefresh={retry} />}>
        {header}

        <HeroCard done={doneCount} total={total} hero={hero} />

        <SectionHeader
          title={t.today.sections.tasks}
          detail={t.today.sections.tasksDone(doneCount, total)}
          style={styles.tasksHeader}
        />
        <View style={styles.tasks}>
          {rows.map((row) => (
            <TaskCard
              key={row.id}
              task={row}
              onPressAction={() => onAction(row.id)}
              onPressBody={() => onBody(row.id)}
            />
          ))}
        </View>

        {friendRows.length > 0 && (
          <>
            <SectionHeader
              title={t.today.sections.friends}
              detail={waiting > 0 ? t.today.sections.friendsWaiting(waiting) : undefined}
              detailColor={todayColors[scheme].waitingText}
              style={styles.friendsHeader}
            />
            {/* Arkadaş şeridi: bitirenler yeşil halka + tik, bekleyenler kesikli halka + Dürt, sonda davet */}
            <View style={styles.friends}>
              {friendRows.map((f) => (
                <FriendBubble
                  key={f.id}
                  person={f}
                  done={f.doneToday}
                  onPoke={() => router.push({ pathname: '/poke/[userId]', params: { userId: f.id } })}
                />
              ))}
              <InviteBubble onPress={() => router.push('/invite-friends')} />
            </View>
          </>
        )}
      </ScrollView>
      {toasts}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  content: {
    paddingTop: layout.screenTopGap,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: m.contentPaddingBottom,
  },
  hero: {
    marginTop: m.heroMarginTop,
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
  friends: {
    marginTop: m.sectionListMarginTop,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
