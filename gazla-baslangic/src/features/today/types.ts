import type { FriendRowPerson } from '@/components/FriendRow';
import type { TaskCardTask } from '@/components/TaskCard';

// Bugün ekranının görünüm modelleri. Veri `@/data` tiplerinden (TodayTask, FriendToday)
// `logic.ts`teki toTaskRow / toFriendRow ile çevrilir.

/** Bugün listesindeki bir görev satırı (kullanıcının aktif challenge'ının bugünkü işi) */
export type TaskRow = TaskCardTask & {
  /** challengeId|localDate (toleransta dünün görevi de listelenir) */
  id: string;
  challengeId: string;
};

export type TodayFriend = FriendRowPerson & {
  id: string;
  /** Bugünkü görevlerini bitirdi mi */
  doneToday: boolean;
};
