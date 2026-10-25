/**
 * Örnek verinin İngilizce içerikleri: dil İngilizceyken mock bunları gösterir (Supabase'te `*_en` sütunları,
 * seed'leri migration 900 ve 1000'de). Anahtarlar `seed.ts`'teki şablon id'leri (`t-kahvesiz`) ve rozet
 * anahtarları; metinler SQL seed'iyle aynı olmalı.
 */
export type TemplateEn = { title: string; shortTitle: string | null; description: string | null; numberUnit?: string | null };
export type BadgeEn = { title: string; description: string };

/** Kısa ad cümle içinde de kullanılır ("coffee detox is waiting for you"): küçük harfli, tekil ad öbeği */
export const templateEn: Record<string, TemplateEn> = {
  't-kahvesiz': {
    title: '7-day coffee detox',
    shortTitle: 'coffee detox',
    description: 'Quit coffee for a while. The first three days are rough, then it gets easier. No promises, but probably.',
  },
  't-telefonsuz': { title: 'Phone-free first hour', shortTitle: 'phone-free morning', description: null },
  't-iltifat': { title: 'A compliment a day', shortTitle: 'compliment duty', description: null },
  't-plank': { title: 'Plank: +5 seconds a day', shortTitle: 'plank', description: null, numberUnit: 'sec' },
  't-20-sayfa': { title: 'Read 20 pages a day', shortTitle: 'reading', description: null },
  't-harcamasiz': { title: 'No pointless spending', shortTitle: null, description: null },
  't-ters-el': { title: 'Brush teeth, wrong hand', shortTitle: null, description: null },
  't-sekersiz': { title: '10-day sugar detox', shortTitle: 'sugar detox', description: null },
};

export const badgeEn: Record<string, BadgeEn> = {
  ilk_30_gun: { title: 'First 30 days', description: 'Your overall streak hit 30 days' },
  laf_ustasi: { title: 'Roast master', description: 'You sent 10 roasts' },
  erkenci: { title: 'Early bird', description: 'You checked in before 8 a.m. on 5 days' },
  yuz_gun: { title: '100 club', description: 'Your overall streak hit 100 days' },
  maratoncu: { title: 'Marathon runner', description: 'You finished a 30-day challenge 3 times' },
  bahcivan: { title: 'Gardener', description: 'Your garden has 10 cacti' },
  sampiyon: { title: 'Champion', description: 'You finished first in a group of 3 or more' },
  gaz_pedali: { title: 'Hype machine', description: 'You hyped up friends 25 times' },
  son_dakika: { title: 'Last minute', description: 'You saved your streak with under an hour to go' },
  gece_kusu: { title: 'Night owl', description: "You finished yesterday's task after midnight" },
  sosyal_kaktus: { title: 'Social cactus', description: 'You made 10 friends' },
  objektif: { title: 'Paparazzi', description: 'You sent 30 photo proofs' },
};
