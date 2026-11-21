/**
 * Yeni challenge formunun yardımcıları: süre seçenekleri, saat/gün biçimi, sayı ayrıştırma, ad denetimi,
 * formdan CreateChallengeInput üretimi. Sınırlar (ad 3–60, süre 3–60, başlangıç bugün/yarın) sunucuda da denetlenir.
 * Metinler sözlükten (`t.create`, `t.common`).
 */
import type {
  ChallengeIconKey,
  ChallengeTintKey,
  ChallengeVisibility,
  CreateChallengeInput,
  FriendToday,
  TaskType,
  Template,
} from '@/data';
import { addLocalDays, deviceToday } from '@/features/checkin/logic';
import { joinNames } from '@/features/challenge/logic';
import type { Messages } from '@/i18n';
import { createMetrics } from '@/theme/create';

export type DurationChoice = 7 | 10 | 30 | 'custom';

/** Süre hücreleri: "7 gün" / "10 gün" / "30 gün" / "Özel" */
export function durationOptions(t: Messages): { value: DurationChoice; label: string }[] {
  return [
    ...([7, 10, 30] as const).map((value) => ({ value, label: t.common.days(value) })),
    { value: 'custom' as const, label: t.create.duration.custom },
  ];
}

const TASK_TYPES: TaskType[] = ['check', 'number', 'photo'];

/** "Nasıl tamamlanır?" kartları */
export function taskOptions(t: Messages): Choice<TaskType>[] {
  return TASK_TYPES.map((value) => ({ value, ...t.create.taskTypes[value] }));
}

/** Başlangıç: spesifikasyon "yarın veya bugün" */
export type StartOffset = 0 | 1;

export type CreateForm = {
  templateId: string | null;
  title: string;
  taskType: TaskType;
  duration: DurationChoice;
  customDays: number;
  unit: string;
  target: string;
  increment: string;
  startOffset: StartOffset;
  reminder: string | null;
  visibility: ChallengeVisibility;
  invitees: string[];
};

/** Seçim sayfasındaki seçenek (TaskOption kartıyla çizilir) */
export type Choice<T> = { value: T; title: string; desc: string };

const VISIBILITIES: ChallengeVisibility[] = ['invited', 'friends'];

export function visibilityOptions(t: Messages): Choice<ChallengeVisibility>[] {
  return VISIBILITIES.map((value) => ({ value, ...t.create.visibility.options[value] }));
}

export const visibilityLabel = (v: ChallengeVisibility, t: Messages) => t.create.visibility.options[v].title;

export const startLabel = (offset: StartOffset, t: Messages) =>
  offset === 0 ? t.common.dates.today : t.common.dates.tomorrow;

/** "Bugün" / "Yarın" + takvim günü ("Salı, 21 Ekim" / "Tuesday, October 21") */
export function startOptions(now: Date, t: Messages): Choice<StartOffset>[] {
  return ([0, 1] as const).map((offset) => ({
    value: offset,
    title: startLabel(offset, t),
    desc: t.common.dates.weekdayDayMonth(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)),
  }));
}

/** Ad uzunluğu (baştaki/sondaki boşluk sayılmaz; harf sayısı, UTF-16 birimi değil) */
const titleLength = (title: string) => Array.from(title.trim()).length;

/** Ad 3–60 karakter değilse sorun */
export function titleProblem(title: string): 'short' | 'long' | null {
  const n = titleLength(title);
  if (n < createMetrics.titleMinLength) return 'short';
  if (n > createMetrics.titleMaxLength) return 'long';
  return null;
}

/** Ad 3–60 karakter değilse alanın altındaki hata metni */
export function titleError(title: string, t: Messages): string | null {
  const problem = titleProblem(title);
  if (problem === 'short') return t.create.name.tooShort(createMetrics.titleMinLength);
  if (problem === 'long') return t.create.name.tooLong(createMetrics.titleMaxLength);
  return null;
}

/** "2,5" → 2.5; boş ya da geçersizse null */
export function parseAmount(text: string) {
  const s = text.trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "Mert", "Mert ve Ece", "Mert, Ece ve Can" davet edilecek (hepsi yazılır) */
export function inviteSummary(friends: Pick<FriendToday, 'displayName'>[], t: Messages) {
  if (friends.length === 0) return t.create.invite.none;
  const names = friends.map((f) => f.displayName);
  return t.create.invite.summary(joinNames(names, names.length, t));
}

/** Şablonun alanlarını forma kopyalar */
export function formFromTemplate(form: CreateForm, t: Template): CreateForm {
  return {
    ...form,
    templateId: t.id,
    title: t.title,
    taskType: t.taskType,
    duration: t.defaultDurationDays,
    unit: t.number?.unit ?? '',
    target: t.number ? String(t.number.baseTarget) : '',
    increment: t.number ? String(t.number.dailyIncrement) : '',
  };
}

export function durationDays(form: CreateForm) {
  return form.duration === 'custom' ? form.customDays : form.duration;
}

/** Ad içindeki kelimeye göre ikon (Türkçe ve İngilizce); eşleşme yoksa tik */
const ICON_WORDS: [ChallengeIconKey, string[]][] = [
  ['coffee', ['kahve', 'kafein', 'coffee', 'caffeine']],
  ['candy', ['şeker', 'seker', 'tatlı', 'tatli', 'çikolata', 'cikolata', 'sugar', 'sweet', 'candy', 'chocolate']],
  ['phoneOff', ['telefon', 'ekran', 'sosyal medya', 'instagram', 'tiktok', 'phone', 'screen', 'social']],
  ['book', ['kitap', 'oku', 'sayfa', 'book', 'read', 'page']],
  ['wallet', ['para', 'harca', 'alışveriş', 'alisveris', 'birikim', 'tasarruf', 'money', 'spend', 'saving', 'shopping']],
  ['toothbrush', ['diş', 'teeth', 'tooth', 'floss']],
  ['chatHeart', ['ara', 'mesaj', 'teşekkür', 'tesekkur', 'iltifat', 'aile', 'call', 'text', 'thank', 'compliment', 'family']],
  ['timer', ['dakika', 'meditasyon', 'egzersiz', 'spor', 'yürü', 'yuru', 'koş', 'kos', 'plank', 'minute', 'meditat', 'workout', 'walk', 'run']],
];

/** Renk sırası: Bugün'de yan yana kartlar ayrışsın diye kullanılmayan ilk renk */
const TINT_ORDER: ChallengeTintKey[] = ['green', 'lilac', 'peach', 'sky', 'butter', 'rose', 'teal'];

export function iconForTitle(title: string): ChallengeIconKey {
  const text = ` ${title.toLocaleLowerCase('tr')} `;
  const words = text.split(/[^\p{L}]+/u).filter(Boolean);
  for (const [icon, keys] of ICON_WORDS) {
    // Kısa kökler (ara, oku, kos) kelime başında aranır: "kahvaltı"da "ara" yok sayılsın
    if (keys.some((k) => (k.length <= 4 ? words.some((w) => w.startsWith(k.trim())) : text.includes(k)))) return icon;
  }
  return 'check';
}

export function pickTint(used: ChallengeTintKey[]): ChallengeTintKey {
  return TINT_ORDER.find((tint) => !used.includes(tint)) ?? TINT_ORDER[used.length % TINT_ORDER.length];
}

/**
 * Form geçerliyse gönderilecek girdi, değilse null. Özel challenge'ın ikonu addan (`iconForTitle`), rengi
 * kullanıcının süren challenge'larında olmayan ilk renkten (`usedTints`; şablondan gelen özel süreli
 * challenge şablonun ikon ve rengini korur).
 */
export function toCreateInput(
  form: CreateForm,
  template: Template | undefined,
  usedTints: ChallengeTintKey[] = [],
): CreateChallengeInput | null {
  const title = form.title.trim();
  const days = durationDays(form);
  if (titleProblem(title) || days < createMetrics.customMin || days > createMetrics.customMax) return null;

  const common = {
    durationDays: days,
    startDate: addLocalDays(deviceToday(), form.startOffset),
    reminderTime: form.reminder,
    inviteeIds: form.invitees,
    visibility: form.visibility,
  };
  // Şablonlu challenge yalnızca şablonun izin verdiği sürelerle (allowed_durations); özel ya da izin dışı sürede
  // şablonun alanları ayrı gönderilir (şablonsuz challenge)
  if (template && form.duration !== 'custom' && template.allowedDurations.includes(form.duration)) {
    return { templateId: template.id, ...common };
  }

  const look = {
    icon: template?.icon ?? iconForTitle(title),
    tint: template?.tint ?? pickTint(usedTints),
  };
  if (form.taskType !== 'number') {
    return { title, taskType: form.taskType, ...look, ...common };
  }
  const unit = form.unit.trim();
  const target = parseAmount(form.target);
  const increment = parseAmount(form.increment) ?? 0;
  if (!unit || target === null) return null;
  return {
    title,
    taskType: 'number',
    number: {
      unit,
      baseTarget: target,
      dailyIncrement: increment,
      // Şablondan geliyorsa onun adımı, değilse günlük artış (yoksa 1)
      step: template?.number?.step ?? (increment > 0 ? increment : 1),
      max: template?.number?.max ?? null,
    },
    ...look,
    ...common,
  };
}
