/**
 * Yeni challenge formunun yardımcıları: süre seçenekleri, saat/gün biçimi, sayı ayrıştırma, ad denetimi,
 * formdan CreateChallengeInput üretimi. Sınırlar (ad 3–60, süre 3–60, başlangıç bugün/yarın) sunucuda da denetlenir.
 */
import type { ChallengeVisibility, CreateChallengeInput, FriendToday, TaskType, Template } from '@/data';
import { addLocalDays, deviceToday } from '@/features/checkin/logic';
import { formatDayLabel } from '@/features/today/logic';
import { createMetrics } from '@/theme/create';

export type DurationChoice = 7 | 10 | 30 | 'custom';

export const DURATION_OPTIONS: { value: DurationChoice; label: string }[] = [
  { value: 7, label: '7 gün' },
  { value: 10, label: '10 gün' },
  { value: 30, label: '30 gün' },
  { value: 'custom', label: 'Özel' },
];

export const TASK_OPTIONS: { value: TaskType; title: string; desc: string }[] = [
  { value: 'check', title: 'İşaretle', desc: 'Tek dokunuşla günü tamamla' },
  { value: 'number', title: 'Sayı gir', desc: 'Dakika, adım, sayfa gibi' },
  { value: 'photo', title: 'Fotoğraf kanıtı', desc: 'Grup görsün, tepki versin' },
];

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

export const VISIBILITY_OPTIONS: Choice<ChallengeVisibility>[] = [
  { value: 'invited', title: 'Davetliler', desc: 'Yalnızca davet ettiğin kişiler görür' },
  { value: 'friends', title: 'Arkadaşlarım', desc: 'Arkadaşların profilinde görür ve katılabilir' },
];

export const visibilityLabel = (v: ChallengeVisibility) =>
  VISIBILITY_OPTIONS.find((o) => o.value === v)?.title ?? '';

export const startLabel = (offset: StartOffset) => (offset === 0 ? 'Bugün' : 'Yarın');

/** "Bugün" / "Yarın" + takvim günü ("Salı, 21 Ekim") */
export function startOptions(now: Date): Choice<StartOffset>[] {
  return ([0, 1] as const).map((offset) => ({
    value: offset,
    title: startLabel(offset),
    desc: formatDayLabel(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)),
  }));
}

/** Ad uzunluğu (baştaki/sondaki boşluk sayılmaz; harf sayısı, UTF-16 birimi değil) */
const titleLength = (title: string) => Array.from(title.trim()).length;

/** Ad 3–60 karakter değilse alanın altındaki hata metni */
export function titleError(title: string): string | null {
  const n = titleLength(title);
  if (n < createMetrics.titleMinLength) return `Ad en az ${createMetrics.titleMinLength} karakter olmalı`;
  if (n > createMetrics.titleMaxLength) return `Ad en fazla ${createMetrics.titleMaxLength} karakter olabilir`;
  return null;
}

/** "2,5" → 2.5; boş ya da geçersizse null */
export function parseAmount(text: string) {
  const s = text.trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "Mert", "Mert ve Ece", "Mert, Ece ve Can" davet edilecek */
export function inviteSummary(friends: Pick<FriendToday, 'displayName'>[]) {
  if (friends.length === 0) return 'Arkadaşlarını davet et';
  const names = friends.map((f) => f.displayName);
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} ve ${names[names.length - 1]}`;
  return `${list} davet edilecek`;
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
  if (titleError(title) || days < createMetrics.customMin || days > createMetrics.customMax) return null;

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
