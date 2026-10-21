/**
 * Örnek veri — tasarım dosyalarındaki içerik (Today, Detail, Friends, Activity, Garden, Explore,
 * FriendProfile, Settings, InviteLanding, NumberEntry, Poke). Tarihler bugüne göre hesaplanır.
 * Supabase bağlanınca kullanılmaz; yalnızca `mockApi` okur.
 */
import { POKE_MESSAGES } from '../../content/pokes';
import type {
  ActivityItem,
  AvatarTintKey,
  Badge,
  BadgeKey,
  Challenge,
  GardenItem,
  PokeMessage,
  Profile,
  Template,
  UserSettings,
} from '../types';

// Tarih yardımcıları ------------------------------------------------------------------------------

/** Cihazın yerel günü 'YYYY-MM-DD' */
export function localDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return localDate(new Date(y, m - 1, d + days));
}

export function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

const today = localDate();
/** Challenge'ın bugün `dayIndex`. günü olacak şekilde başlangıç günü */
const startFor = (dayIndex: number) => addDays(today, -(dayIndex - 1));

// Kişiler ---------------------------------------------------------------------------------------

const person = (id: string, username: string, displayName: string, avatarTint: AvatarTintKey, harshMode = false): Profile => ({
  id,
  username,
  displayName,
  avatarUrl: null,
  avatarTint,
  harshMode,
});

export const ME_ID = 'u-deniz';

export const seedProfiles: Profile[] = [
  person(ME_ID, 'deniz.k', 'Deniz', 'peach', true),
  person('u-mert', 'mert.k', 'Mert', 'peach'),
  person('u-ece', 'ece.y', 'Ece', 'lavender', true),
  person('u-can', 'can.d', 'Can', 'mint'),
  person('u-selin', 'selin.a', 'Selin', 'butter'),
  person('u-kerem', 'kerem.a', 'Kerem', 'lavender'),
  // Aramada çıkanlar (henüz ilişki yok)
  person('u-zeynep', 'zeynep.t', 'Zeynep', 'mint'),
  person('u-baris', 'baris.k', 'Barış', 'butter'),
  person('u-elif', 'elif.s', 'Elif', 'lavender'),
];

export const seedSettings: UserSettings = {
  birthYear: 1998,
  timezone: 'Europe/Istanbul',
  locale: 'tr',
  pokePushEnabled: true,
  dailyReminderTime: '21:00',
  discoverability: 'everyone',
  dayEndGraceHours: 2,
};

/** Kabul edilmiş arkadaşlar */
export const seedFriendIds = ['u-mert', 'u-ece', 'u-can', 'u-selin'];

/** Diğer kişilerin kendi aralarındaki arkadaşlıkları (ortak arkadaş sayısı: Kerem "3 ortak") */
export const seedOtherFriendships: [string, string][] = [
  ['u-kerem', 'u-mert'],
  ['u-kerem', 'u-can'],
  ['u-kerem', 'u-selin'],
  ['u-mert', 'u-can'],
  ['u-ece', 'u-selin'],
  ['u-zeynep', 'u-ece'],
];

/** Bekleyen istekler: Kerem → Deniz */
export const seedFriendRequests = [
  { id: 'fr-kerem', fromId: 'u-kerem', toId: ME_ID, createdAt: minutesAgo(180) },
];

// Katalog (migration 900 ile aynı) ----------------------------------------------------------------

/** Şablonun katalog alanları; yapan sayısı ve popülerlik sırası mockApi'de hesaplanır */
export type SeedTemplate = Omit<Template, 'activeCount' | 'popularity'>;

const tpl = (t: Partial<SeedTemplate> & Pick<SeedTemplate, 'id' | 'slug' | 'title' | 'category' | 'difficulty' | 'taskType' | 'defaultDurationDays' | 'icon' | 'tint'>): SeedTemplate => ({
  shortTitle: null,
  description: null,
  number: null,
  onboardingOrder: null,
  featuredWeek: null,
  ...t,
});

/** Bu haftanın pazartesisi */
const monday = (() => {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return localDate(d);
})();

export const seedTemplates: SeedTemplate[] = [
  tpl({
    id: 't-kahvesiz',
    slug: 'kahvesiz',
    title: '7 gün kahvesiz',
    shortTitle: 'kahvesiz',
    description:
      'Kahveyi bir süreliğine bırak. İlk üç gün zor geçer, sonrası kolaylaşır. Söz vermiyoruz ama muhtemelen.',
    category: 'food_drink',
    difficulty: 'medium',
    taskType: 'check',
    defaultDurationDays: 7,
    icon: 'coffee',
    tint: 'butter',
    onboardingOrder: 1,
    featuredWeek: monday,
  }),
  tpl({
    id: 't-telefonsuz',
    slug: 'telefonsuz-sabah',
    title: 'Uyanınca 1 saat telefonsuz',
    shortTitle: 'telefonsuz sabah',
    category: 'detox',
    difficulty: 'medium',
    taskType: 'check',
    defaultDurationDays: 30,
    icon: 'phoneOff',
    tint: 'lilac',
    onboardingOrder: 2,
  }),
  tpl({
    id: 't-iltifat',
    slug: 'iltifat',
    title: 'Her gün birine iltifat et',
    shortTitle: 'iltifat',
    category: 'social_courage',
    difficulty: 'hard',
    taskType: 'check',
    defaultDurationDays: 7,
    icon: 'chatHeart',
    tint: 'peach',
    onboardingOrder: 3,
  }),
  tpl({
    id: 't-plank',
    slug: 'plank',
    title: 'Plank: her gün +5 saniye',
    shortTitle: 'plank',
    category: 'sport',
    difficulty: 'medium',
    taskType: 'number',
    defaultDurationDays: 10,
    icon: 'timer',
    tint: 'green',
    number: { unit: 'sn', baseTarget: 60, dailyIncrement: 5, step: 5, max: 600 },
    onboardingOrder: 4,
  }),
  tpl({
    id: 't-20-sayfa',
    slug: '20-sayfa',
    title: 'Her gün 20 sayfa oku',
    shortTitle: 'okuma',
    category: 'reading',
    difficulty: 'easy',
    taskType: 'photo',
    defaultDurationDays: 30,
    icon: 'book',
    tint: 'rose',
    onboardingOrder: 5,
  }),
  tpl({
    id: 't-harcamasiz',
    slug: 'harcamasiz',
    title: 'Gereksiz harcama yok',
    category: 'money',
    difficulty: 'medium',
    taskType: 'check',
    defaultDurationDays: 7,
    icon: 'wallet',
    tint: 'teal',
    onboardingOrder: 6,
  }),
  tpl({
    id: 't-ters-el',
    slug: 'ters-el',
    title: 'Ters elle diş fırçala',
    category: 'quirky',
    difficulty: 'easy',
    taskType: 'check',
    defaultDurationDays: 10,
    icon: 'toothbrush',
    tint: 'sky',
  }),
  tpl({
    id: 't-sekersiz',
    slug: 'sekersiz',
    title: '10 gün şekersiz',
    shortTitle: 'şekersiz',
    category: 'food_drink',
    difficulty: 'medium',
    taskType: 'check',
    defaultDurationDays: 10,
    icon: 'candy',
    tint: 'butter',
  }),
];

/** template_stats için "şu an yapan" sayıları */
export const seedTemplateActive: Record<string, number> = {
  't-kahvesiz': 312,
  't-telefonsuz': 1248,
  't-iltifat': 486,
  't-plank': 905,
  't-20-sayfa': 1630,
  't-harcamasiz': 274,
  't-ters-el': 158,
  't-sekersiz': 640,
};

// Challenge'lar ve üyelik ---------------------------------------------------------------------------

/** Challenge satırı; durum, gün numarası ve üye sayısı izleyiciye göre mockApi'de hesaplanır */
export type SeedChallenge = Omit<Challenge, 'status' | 'dayIndex' | 'memberCount'>;

const challenge = (c: Omit<SeedChallenge, 'endDate' | 'visibility'> & Partial<Pick<SeedChallenge, 'visibility'>>): SeedChallenge => ({
  visibility: 'invited',
  ...c,
  endDate: addDays(c.startDate, c.durationDays - 1),
});

export const seedChallenges: SeedChallenge[] = [
  challenge({
    id: 'c-phone',
    templateId: 't-telefonsuz',
    createdBy: ME_ID,
    title: 'Uyanınca 1 saat telefonsuz',
    shortTitle: 'telefonsuz sabah',
    taskType: 'check',
    durationDays: 30,
    startDate: startFor(12),
    reminderTime: '08:00',
    inviteMessage: 'Sabahları telefonu bırakıyoruz, sen de gel.',
    category: 'detox',
    icon: 'phoneOff',
    tint: 'lilac',
    number: null,
  }),
  challenge({
    id: 'c-read',
    templateId: 't-20-sayfa',
    createdBy: 'u-selin',
    title: 'Her gün 20 sayfa oku',
    shortTitle: 'okuma',
    taskType: 'photo',
    durationDays: 30,
    startDate: startFor(4),
    reminderTime: '22:00',
    inviteMessage: null,
    category: 'reading',
    icon: 'book',
    tint: 'rose',
    number: null,
  }),
  challenge({
    id: 'c-plank',
    templateId: 't-plank',
    createdBy: 'u-can',
    title: 'Plank: her gün +5 saniye',
    shortTitle: 'plank',
    taskType: 'number',
    durationDays: 10,
    startDate: startFor(3),
    reminderTime: '19:00',
    inviteMessage: null,
    category: 'sport',
    icon: 'timer',
    tint: 'green',
    number: { unit: 'sn', baseTarget: 60, dailyIncrement: 5, step: 5, max: 600 },
  }),
  // Deniz'in üye olmadığı, davet linkiyle (InviteLanding) ya da Mert'in profilinden ("Arkadaşlarım"
  // görünürlük) katılabileceği challenge
  challenge({
    id: 'c-coffee',
    visibility: 'friends',
    templateId: 't-kahvesiz',
    createdBy: 'u-mert',
    title: '7 gün kahvesiz',
    shortTitle: 'kahvesiz',
    taskType: 'check',
    durationDays: 7,
    startDate: addDays(today, 1),
    reminderTime: '09:00',
    inviteMessage: 'Yarın başlıyoruz, kahveyi birlikte bırakalım.',
    category: 'food_drink',
    icon: 'coffee',
    tint: 'butter',
    number: null,
  }),
];

/** [challengeId, userId, joinedDayOffset] — dayOffset: başlangıçtan kaç gün sonra katıldı */
export const seedMembers: { challengeId: string; userId: string; role: 'owner' | 'member' }[] = [
  { challengeId: 'c-phone', userId: ME_ID, role: 'owner' },
  { challengeId: 'c-phone', userId: 'u-mert', role: 'member' },
  { challengeId: 'c-phone', userId: 'u-ece', role: 'member' },
  { challengeId: 'c-phone', userId: 'u-can', role: 'member' },
  { challengeId: 'c-read', userId: 'u-selin', role: 'owner' },
  { challengeId: 'c-read', userId: ME_ID, role: 'member' },
  { challengeId: 'c-plank', userId: 'u-can', role: 'owner' },
  { challengeId: 'c-plank', userId: ME_ID, role: 'member' },
  { challengeId: 'c-coffee', userId: 'u-mert', role: 'owner' },
  { challengeId: 'c-coffee', userId: 'u-kerem', role: 'member' },
  { challengeId: 'c-coffee', userId: 'u-can', role: 'member' },
];

/** Kişisel hatırlatma saatleri (challenge_members.reminder_time): Deniz okumayı 21:30'da hatırlar */
export const seedPersonalReminders: { challengeId: string; userId: string; time: string }[] = [
  { challengeId: 'c-read', userId: ME_ID, time: '21:30' },
];

/**
 * Geçmiş işaretlemeler: her üye için kaçırdığı günler (gün numarası) ve bugünü bitirip bitirmediği.
 * Detail: Deniz 12, Mert 12, Ece 11 (bugün bekliyor), Can 4 (seri koptu).
 * Sayı görevinde günlerin değerleri `values` (gün numarası → değer) ve `todayValue`; NumberEntry
 * "Dün 65 sn · En iyin 65 sn · Grupta en iyi 90 sn" (NumberEntry.dc.html, plank 3. gün).
 */
export const seedHistory: {
  challengeId: string;
  userId: string;
  missedDays: number[];
  rescuedDays?: number[];
  values?: Record<number, number>;
  doneToday: boolean;
  todayValue?: number;
}[] = [
  { challengeId: 'c-phone', userId: ME_ID, missedDays: [], rescuedDays: [6], doneToday: true },
  { challengeId: 'c-phone', userId: 'u-mert', missedDays: [], doneToday: true },
  { challengeId: 'c-phone', userId: 'u-ece', missedDays: [], doneToday: false },
  { challengeId: 'c-phone', userId: 'u-can', missedDays: [8], doneToday: true },
  { challengeId: 'c-read', userId: ME_ID, missedDays: [], doneToday: false },
  { challengeId: 'c-read', userId: 'u-selin', missedDays: [], doneToday: false },
  { challengeId: 'c-plank', userId: ME_ID, missedDays: [], values: { 1: 60, 2: 65 }, doneToday: false },
  { challengeId: 'c-plank', userId: 'u-can', missedDays: [], values: { 1: 60, 2: 70 }, doneToday: true, todayValue: 90 },
];

/** Genel seriler (sunucu hesaplar; mock'ta sabit taban + bugün tamamsa 1) */
export const seedStreakBase: Record<string, number> = {
  [ME_ID]: 12,
  'u-mert': 12,
  'u-ece': 11,
  'u-can': 4,
  'u-selin': 4,
  'u-kerem': 2,
};

export const seedLongestStreak = 31;

/** Bahçe: tamamlananlar (Garden.dc.html) */
export const seedGarden: GardenItem[] = [
  { challengeId: 'g-kahve', title: '7 gün kahvesiz', shortTitle: 'kahvesiz', durationDays: 7, requiredDays: 7, stage: 'genc', finishedAt: minutesAgo(60 * 24 * 120), finalRescues: 0, finalRank: 1 },
  { challengeId: 'g-seker', title: '10 gün şekersiz', shortTitle: 'şekersiz', durationDays: 10, requiredDays: 10, stage: 'tam', finishedAt: minutesAgo(60 * 24 * 95), finalRescues: 1, finalRank: 2 },
  { challengeId: 'g-okuma', title: 'Her gün 20 sayfa oku', shortTitle: 'okuma', durationDays: 30, requiredDays: 30, stage: 'cicek', finishedAt: minutesAgo(60 * 24 * 70), finalRescues: 1, finalRank: 1 },
  { challengeId: 'g-iltifat', title: 'Her gün birine iltifat et', shortTitle: 'iltifat', durationDays: 7, requiredDays: 7, stage: 'genc', finishedAt: minutesAgo(60 * 24 * 40), finalRescues: 0, finalRank: 3 },
  { challengeId: 'g-plank', title: 'Plank: her gün +5 saniye', shortTitle: 'plank', durationDays: 30, requiredDays: 30, stage: 'cicek', finishedAt: minutesAgo(60 * 24 * 12), finalRescues: 0, finalRank: 1 },
];

// Dürtme mesajları (src/content/pokes.ts = migration 900) -------------------------------------------

/** Sabit listeden (id = poke_messages.key); sortOrder tondaki sıra */
export const seedPokeMessages: PokeMessage[] = POKE_MESSAGES.map((m) => ({
  key: m.id,
  tone: m.tone,
  sortOrder: POKE_MESSAGES.filter((x) => x.tone === m.tone).indexOf(m),
  text: m.text,
  isActive: true,
}));

// Rozetler (migration 1000 ile aynı katalog) ----------------------------------------------------------

export const seedBadges: Omit<Badge, 'earnedAt'>[] = (
  [
    ['ilk_30_gun', 'İlk 30 gün', 'Genel serin 30 güne ulaştı', 'star', 'yellow'],
    ['laf_ustasi', 'Laf ustası', '10 kez laf soktun', 'speech', 'orange'],
    ['erkenci', 'Erkenci', "5 gün sabah 8'den önce işaretledin", 'sun', 'mint'],
    ['yuz_gun', 'Yüz gün', 'Genel serin 100 güne ulaştı', 'streak', 'yellow'],
    ['maratoncu', 'Maratoncu', "3 kez 30 günlük bir challenge'ı bitirdin", 'calendar', 'orange'],
    ['bahcivan', 'Bahçıvan', 'Bahçende 10 kaktüs var', 'sprout', 'mint'],
    ['sampiyon', 'Şampiyon', "En az 3 kişilik bir grupta challenge'ı birinci bitirdin", 'trophy', 'yellow'],
    ['gaz_pedali', 'Gaz pedalı', 'Arkadaşlarına 25 kez gaz verdin', 'hand', 'orange'],
    ['son_dakika', 'Son dakika', 'Serini kurtarma süresinin son saatinde kurtardın', 'clock', 'mint'],
    ['gece_kusu', 'Gece kuşu', 'Gece yarısından sonra dünün görevini tamamladın', 'moon', 'yellow'],
    ['sosyal_kaktus', 'Sosyal kaktüs', '10 arkadaşın oldu', 'friends', 'orange'],
    ['objektif', 'Objektif', '30 fotoğraf kanıtı gönderdin', 'camera', 'mint'],
  ] as const
).map(([key, title, description, icon, tint], i) => ({ key, sortOrder: i + 1, title, description, icon, tint }));

/** Garden.dc.html "Rozetler 3 / 12": İlk 30 gün, Laf ustası, Erkenci kazanılmış */
export const seedEarnedBadges: { key: BadgeKey; earnedAt: string }[] = [
  { key: 'ilk_30_gun', earnedAt: minutesAgo(60 * 24 * 75) },
  { key: 'laf_ustasi', earnedAt: minutesAgo(60 * 24 * 30) },
  { key: 'erkenci', earnedAt: minutesAgo(60 * 24 * 9) },
];

// Aktivite (Activity.dc.html) ------------------------------------------------------------------------

export const seedActivity = (lite: (id: string) => ActivityItem['actor']): ActivityItem[] => [
  {
    id: 'n-1',
    kind: 'poke_roast',
    actor: lite('u-ece'),
    challengeId: 'c-phone',
    challengeTitle: 'Uyanınca 1 saat telefonsuz',
    pokeText: 'Kaktüs bile senden hızlı büyüyor',
    friendshipId: null,
    payload: {},
    createdAt: minutesAgo(5),
    readAt: null,
  },
  {
    id: 'n-2',
    kind: 'friend_finished_challenge',
    actor: lite('u-mert'),
    challengeId: null,
    challengeTitle: '10 gün şekersiz',
    pokeText: null,
    friendshipId: null,
    payload: { title: '10 gün şekersiz', duration_days: 10 },
    createdAt: minutesAgo(60),
    readAt: null,
  },
  {
    id: 'n-3',
    kind: 'friend_request',
    actor: lite('u-kerem'),
    challengeId: null,
    challengeTitle: null,
    pokeText: null,
    friendshipId: 'fr-kerem',
    payload: {},
    createdAt: minutesAgo(180),
    readAt: null,
  },
  {
    id: 'n-4',
    kind: 'streak_milestone',
    actor: null,
    challengeId: null,
    challengeTitle: null,
    pokeText: null,
    friendshipId: null,
    payload: { text: 'Serin 12 gün oldu. Fena değilsin.' },
    createdAt: minutesAgo(60 * 20),
    readAt: minutesAgo(60 * 19),
  },
  {
    id: 'n-5',
    kind: 'poke_hype',
    actor: lite('u-selin'),
    challengeId: 'c-read',
    challengeTitle: 'Her gün 20 sayfa oku',
    pokeText: 'Beraber bitireceğiz',
    friendshipId: null,
    payload: {},
    createdAt: minutesAgo(60 * 22),
    readAt: minutesAgo(60 * 21),
  },
  {
    id: 'n-6',
    kind: 'challenge_invite',
    actor: lite('u-can'),
    challengeId: 'c-plank',
    challengeTitle: 'Plank: her gün +5 saniye',
    pokeText: null,
    friendshipId: null,
    payload: {},
    createdAt: minutesAgo(60 * 26),
    readAt: minutesAgo(60 * 25),
  },
];

/** Davet kodları → challenge ve davet eden */
export const seedInviteCodes: Record<string, { challengeId: string; inviterId: string }> = {
  MertKahve1: { challengeId: 'c-coffee', inviterId: 'u-mert' },
};
