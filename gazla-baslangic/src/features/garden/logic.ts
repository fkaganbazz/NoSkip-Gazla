/** Bahçem metin ve yerleşim kuralları — design/Garden.dc.html */
import type { DikenGear, DikenMood } from '@/components/Diken';
import type { GardenItem } from '@/data';

const BACK_VOWELS = 'aıou';
const VOWELS = 'aeıioöuü';

/** Türkçe tamlayan eki: Deniz'in, Can'ın, Ece'nin, Mert'in, Selin'in, Utku'nun */
export function possessive(name: string) {
  const lower = name.toLocaleLowerCase('tr');
  const last = [...lower].reverse().find((ch) => VOWELS.includes(ch)) ?? 'e';
  const vowel = BACK_VOWELS.includes(last) ? (last === 'o' || last === 'u' ? 'u' : 'ı') : last === 'ö' || last === 'ü' ? 'ü' : 'i';
  const buffer = VOWELS.includes(lower.charAt(lower.length - 1)) ? 'n' : '';
  return `${name}'${buffer}${vowel}n`;
}

/** Raf etiketi: "7 gün kahvesiz", "30 gün okuma" */
export const plantLabel = (item: GardenItem) => `${item.durationDays} gün ${item.shortTitle ?? item.title}`;

/**
 * Bitkinin ifadesi ve aksesuarı. my_garden yalnızca aşamayı (stage) döner; tasarımdaki çeşitlilik
 * için ifade/aksesuar sırayla verilir (Garden.dc.html'deki sıra).
 */
const LOOKS: { mood: DikenMood; gear: DikenGear }[] = [
  { mood: 'mutlu', gear: 'yok' },
  { mood: 'cosku', gear: 'bant' },
  { mood: 'gurur', gear: 'yok' },
  { mood: 'selam', gear: 'yok' },
  { mood: 'gurur', gear: 'gozluk' },
];
export const plantLook = (index: number) => LOOKS[index % LOOKS.length];

/** Rafları 3'erli böler; son rafta boş yer varsa "Sıradaki" kutusu için yer kalır */
export function toShelves<T>(items: T[], perShelf: number): (T | 'next')[][] {
  const slots: (T | 'next')[] = [...items, 'next'];
  const shelves: (T | 'next')[][] = [];
  for (let i = 0; i < slots.length; i += perShelf) {
    shelves.push(slots.slice(i, i + perShelf));
  }
  return shelves;
}
