/**
 * Katalog etiketleri — design/Explore.dc.html (çipler, satır alt bilgisi), design/ChallengePreview.dc.html
 * (bilgi çipleri) ve design/Create.dc.html (görev türü adları).
 */
import type { ChallengeCategory, ChallengeDifficulty, TaskType } from '@/data';

/** Kategori çipleri, tasarımdaki sırayla */
export const CATEGORY_CHIPS: { value: ChallengeCategory; label: string }[] = [
  { value: 'detox', label: 'Detoks' },
  { value: 'social_courage', label: 'Sosyal cesaret' },
  { value: 'sport', label: 'Spor' },
  { value: 'food_drink', label: 'Yeme-içme' },
  { value: 'reading', label: 'Okuma' },
  { value: 'money', label: 'Para' },
  { value: 'quirky', label: 'Tuhaf' },
];

/** Satır alt bilgisindeki ve önizleme çipindeki uzun ad ("Tuhaf ve eğlenceli · Kolay") */
export const CATEGORY_NAMES: Record<ChallengeCategory, string> = {
  detox: 'Detoks',
  social_courage: 'Sosyal cesaret',
  sport: 'Spor',
  food_drink: 'Yeme-içme',
  reading: 'Okuma',
  money: 'Para',
  quirky: 'Tuhaf ve eğlenceli',
};

export const DIFFICULTY_NAMES: Record<ChallengeDifficulty, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

/** Görev türü adı (Create.dc.html) */
export const TASK_TYPE_NAMES: Record<TaskType, string> = {
  check: 'İşaretle',
  number: 'Sayı gir',
  photo: 'Fotoğraf kanıtı',
};

/** Önizlemedeki ilk özellik satırı; tasarımda yalnızca İşaretle için metin var */
export const TASK_TYPE_FEATURE: Record<TaskType, string> = {
  check: 'Her gün tek dokunuşla işaretle',
  number: 'Her gün sayını gir: dakika, adım, sayfa',
  photo: 'Her gün fotoğrafla kanıtla, grup görsün',
};

export const DURATION_OPTIONS = [7, 10, 30] as const;
export type DurationOption = (typeof DURATION_OPTIONS)[number];
