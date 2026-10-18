import type { ChallengeIcon } from '@/components/icons';
import type { AvatarTint, ChallengeTint } from '@/theme';

// Bugün ekranının görünüm modelleri. Veri `@/data` tiplerinden (TodayTask, FriendToday)
// `logic.ts`teki toTaskRow / toFriendRow ile çevrilir.

/** check: tek dokunuş · photo: fotoğraf kanıtı · number: sayı girişi */
export type TaskType = 'check' | 'photo' | 'number';

/** Bugün listesindeki bir görev satırı (kullanıcının aktif challenge'ının bugünkü işi) */
export type TaskRow = {
  /** challengeId|localDate (toleransta dünün görevi de listelenir) */
  id: string;
  challengeId: string;
  done: boolean;
  type: TaskType;
  title: string;
  meta: string;
  /** Challenge ilerlemesi, yüzde (0–100) */
  progress: number;
  tint: ChallengeTint;
  icon: ChallengeIcon;
};

export type TodayFriend = {
  id: string;
  name: string;
  tint: AvatarTint;
  /** Bugünkü görevlerini bitirdi mi */
  doneToday: boolean;
};
