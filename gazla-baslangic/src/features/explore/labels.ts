/**
 * Katalog sırası ve süreleri — design/Explore.dc.html (çipler), design/ChallengePreview.dc.html (süre seçici).
 * Adlar sözlükte: kategori `t.explore.chips.categories` (çip) / `t.explore.categoryNames` (uzun ad), zorluk
 * `t.explore.difficulty`, görev türü `t.create.taskTypes`.
 */
import type { ChallengeCategory, TaskType } from '@/data';
import { getT } from '@/i18n';

/** Kategori çipleri, tasarımdaki sırayla */
export const CATEGORY_ORDER: ChallengeCategory[] = [
  'detox',
  'social_courage',
  'sport',
  'food_drink',
  'reading',
  'money',
  'quirky',
];

/**
 * Görev türü adı, o anki dilde (bileşen dışı kullanım için; okunduğu anda sözlükten gelir).
 * Bileşende `t.create.taskTypes[tür].title` kullan.
 */
export const TASK_TYPE_NAMES: Readonly<Record<TaskType, string>> = {
  get check() {
    return getT().create.taskTypes.check.title;
  },
  get number() {
    return getT().create.taskTypes.number.title;
  },
  get photo() {
    return getT().create.taskTypes.photo.title;
  },
};

export const DURATION_OPTIONS = [7, 10, 30] as const;
export type DurationOption = (typeof DURATION_OPTIONS)[number];
