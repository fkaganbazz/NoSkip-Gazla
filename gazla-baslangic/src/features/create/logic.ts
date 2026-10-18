/**
 * Yeni challenge formunun yardımcıları: süre seçenekleri, saat/gün biçimi, sayı ayrıştırma,
 * formdan CreateChallengeInput üretimi. Sınırlar (süre 3–60, başlangıç bugün…+7) sunucuda da denetlenir.
 */
import type { CreateChallengeInput, FriendToday, TaskType, Template } from '@/data';
import { addLocalDays, deviceToday } from '@/features/checkin/logic';

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

export type CreateForm = {
  templateId: string | null;
  title: string;
  taskType: TaskType;
  duration: DurationChoice;
  customDays: number;
  unit: string;
  target: string;
  increment: string;
  startOffset: number;
  reminder: string | null;
  invitees: string[];
};

/** "2,5" → 2.5; boş ya da geçersizse null */
export function parseAmount(text: string) {
  const s = text.trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "20:00" + 30 dk → "20:30" (gün içinde döner) */
export function shiftTime(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

const SHORT_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

/** Başlangıç çipi: "Bugün", "Yarın", "Çar 21" */
export function startChipLabel(offset: number, now: Date) {
  if (offset === 0) return 'Bugün';
  if (offset === 1) return 'Yarın';
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  return `${SHORT_DAYS[d.getDay()]} ${d.getDate()}`;
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
  if (!title || days < 3 || days > 60) return null;

  const common = {
    durationDays: days,
    startDate: addLocalDays(deviceToday(), form.startOffset),
    reminderTime: form.reminder,
    inviteeIds: form.invitees,
  };
  // Şablon süreleri 7/10/30 (challenges_template_duration); özel sürede şablonun alanları ayrı gönderilir
  if (template && form.duration !== 'custom') {
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
