import type { ChallengeIcon } from '@/components/icons';
import type { AvatarTint, ChallengeTint } from '@/theme';

/** check: tek dokunuş · photo: fotoğraf kanıtı · number: sayı girişi */
export type TaskType = 'check' | 'photo' | 'number';

/** Bugün listesindeki bir görev (kullanıcının aktif challenge'ının bugünkü işi) */
export type TodayTask = {
  id: string;
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
