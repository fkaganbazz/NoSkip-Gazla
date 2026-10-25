/**
 * Yeni challenge formunun yardımcıları: süre seçenekleri, saat/gün biçimi, sayı ayrıştırma, ad denetimi,
 * formdan CreateChallengeInput üretimi. Sınırlar (ad 3–60, süre 3–60, başlangıç bugün/yarın) sunucuda da denetlenir.
 * Metinler sözlükten (`t.create`, `t.common`).
 */
import type { ChallengeVisibility, CreateChallengeInput, FriendToday, TaskType, Template } from '@/data';
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

/** Form geçerliyse gönderilecek girdi, değilse null */
export function toCreateInput(form: CreateForm, template: Template | undefined): CreateChallengeInput | null {
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

  if (form.taskType !== 'number') {
    return { title, taskType: form.taskType, ...common };
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
    ...common,
  };
}
