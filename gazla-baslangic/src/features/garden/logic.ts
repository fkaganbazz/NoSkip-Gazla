/** Bahçem metin ve yerleşim kuralları — design/Garden.dc.html */
import type { DikenGear, DikenMood, DikenStage } from '@/components/Diken';
import type { Badge, GardenItem } from '@/data';
import type { Messages } from '@/i18n';

// "Deniz'in bahçesi" tamlayan eki Türkçe sözlükte (locales/tr/garden.ts)

/** Raf etiketi: "7 gün kahvesiz", "30 gün okuma" */
export const plantLabel = (item: GardenItem, t: Messages) =>
  t.garden.shelves.plantLabel(item.durationDays, item.shortTitle ?? item.title);

/** Raf sırası: en eski bitirilen solda, en yenisi "Sıradaki"nin yanında (my_garden yeniden eskiye döner) */
export const gardenOrder = (items: GardenItem[]) => [...items].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));


/** Aşamaya göre ifade; aynı aşama tekrar ettikçe sıradaki (Garden.dc.html: genç mutlu → selam) */
const STAGE_MOODS: Record<DikenStage, DikenMood[]> = {
  filiz: ['mutlu', 'selam'],
  genc: ['mutlu', 'selam'],
  tam: ['cosku'],
  cicek: ['gurur'],
};

export type PlantLook = { mood: DikenMood; gear: DikenGear };

/**
 * Bitkilerin ifadesi ve aksesuarı. Aşama sunucudan (`stage`: süreye göre 7→genç, 10→tam, 30→çiçek);
 * 10 günlük (tam) bandanalı, en uzun seri olan (my_garden `is_longest`) gözlüklü (EKRANLAR 5.1).
 */
export function plantLooks(items: GardenItem[]): PlantLook[] {
  const seen: Partial<Record<DikenStage, number>> = {};
  return items.map((item) => {
    const n = seen[item.stage] ?? 0;
    seen[item.stage] = n + 1;
    const moods = STAGE_MOODS[item.stage];
    const gear: DikenGear = item.isLongest ? 'gozluk' : item.stage === 'tam' ? 'bant' : 'yok';
    return { mood: moods[n % moods.length], gear };
  });
}

/** Rozetler: kazanılanlar önce, sonra kilitliler; her grup katalog sırasıyla */
export const badgeOrder = (badges: Badge[]) =>
  [...badges].sort((a, b) => Number(!a.earnedAt) - Number(!b.earnedAt) || a.sortOrder - b.sortOrder);

/** Satırlara böl (son satır eksik kalabilir) */
export function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

/** Rafları 3'erli böler; son rafta boş yer varsa "Sıradaki" kutusu için yer kalır */
export function toShelves<T>(items: T[], perShelf: number): (T | 'next')[][] {
  const slots: (T | 'next')[] = [...items, 'next'];
  const shelves: (T | 'next')[][] = [];
  for (let i = 0; i < slots.length; i += perShelf) {
    shelves.push(slots.slice(i, i + perShelf));
  }
  return shelves;
}
