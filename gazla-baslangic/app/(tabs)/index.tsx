import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
} from '@/features/today/logic';
import { useNow } from '@/features/today/useNow';
import { mockFriends, mockInitialDone, mockTasks, mockUser } from '@/mocks/today';
import { layout, todayColors, todayMetrics as m, useTheme } from '@/theme';

// Bugün — design/Today.dc.html (açık) ve design/TodayDark.dc.html (koyu). Şimdilik örnek veriyle.
export default function TodayScreen() {
  const { scheme } = useTheme();
  const now = useNow();
  const [done, setDone] = useState(mockInitialDone);

  const toggle = useCallback((id: string) => {
    setDone((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const total = mockTasks.length;
  const doneCount = mockTasks.filter((task) => done[task.id]).length;
  const hero = heroState(doneCount, total, mockUser.streakDays, minutesUntilMidnight(now));
  const waiting = mockFriends.filter((friend) => !friend.doneToday).length;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <TodayHeader
          dayLabel={formatDayLabel(now)}
          title={`${greeting(now)}, ${mockUser.firstName}`}
          unread={mockUser.unreadActivity}
        />

        <HeroCard done={doneCount} total={total} hero={hero} />

        <SectionHeader
          title="Bugünkü görevler"
          detail={`${doneCount}/${total} tamam`}
          style={styles.tasksHeader}
        />
        <View style={styles.tasks}>
          {mockTasks.map((task) => (
            <TaskCard key={task.id} task={task} done={!!done[task.id]} onToggle={toggle} />
          ))}
        </View>

        <SectionHeader
          title="Arkadaşların"
          detail={waiting > 0 ? `${waiting} kişi bekliyor` : undefined}
          detailColor={todayColors[scheme].waitingText}
          style={styles.friendsHeader}
        />
        <FriendsRow friends={mockFriends} />
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
