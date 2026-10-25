import type { ChallengeVisibility, TaskType } from '@/data';

/** Yeni challenge formu (src/features/create; app/create.tsx ve onboarding) */
export const create = {
  title: 'Yeni challenge',

  name: {
    label: 'Challenge adı',
    placeholder: 'Akşam 20 dakika yürüyüş',
    tooShort: (min: number) => `Ad en az ${min} karakter olmalı`,
    tooLong: (max: number) => `Ad en fazla ${max} karakter olabilir`,
  },

  /** Süre hücreleri: 7 / 10 / 30 gün (`common.days`) ve Özel */
  duration: {
    label: 'Süre',
    custom: 'Özel',
    decrease: 'Bir gün azalt',
    increase: 'Bir gün artır',
  },

  /** "Nasıl tamamlanır?" kartları; adlar önizleme çipinde ve davet sayfasında da kullanılır */
  taskLabel: 'Nasıl tamamlanır?',
  taskTypes: {
    check: { title: 'İşaretle', desc: 'Tek dokunuşla günü tamamla' },
    number: { title: 'Sayı gir', desc: 'Dakika, adım, sayfa gibi' },
    photo: { title: 'Fotoğraf kanıtı', desc: 'Grup görsün, tepki versin' },
  } satisfies Record<TaskType, { title: string; desc: string }>,

  /** Sayı ayarları (Sayı gir seçiliyken) */
  number: {
    unit: 'Birim',
    unitPlaceholder: 'dk',
    target: 'Hedef',
    increment: 'Her gün +',
  },

  reminder: {
    label: 'Hatırlatma',
    /** Satırdaki değer: "Her gün 20:00" */
    daily: (time: string) => `Her gün ${time}`,
    off: 'Kapalı',
    /** Panel açıkken, hatırlatma kapalıysa */
    offLong: 'Hatırlatma kapalı',
    earlier: (minutes: number) => `${minutes} dakika erken`,
    later: (minutes: number) => `${minutes} dakika geç`,
  },

  visibility: {
    label: 'Kimler görebilir',
    options: {
      invited: { title: 'Davetliler', desc: 'Yalnızca davet ettiğin kişiler görür' },
      friends: { title: 'Arkadaşlarım', desc: 'Arkadaşların profilinde görür ve katılabilir' },
    } satisfies Record<ChallengeVisibility, { title: string; desc: string }>,
  },

  /** "Başlangıç" satırı; seçenekler `common.dates.today` / `tomorrow` + takvim günü */
  start: {
    label: 'Başlangıç',
  },

  invite: {
    add: 'Arkadaş ekle',
    none: 'Arkadaşlarını davet et',
    /** names: "Mert, Ece ve Can" */
    summary: (names: string) => `${names} davet edilecek`,
    noFriends: 'Davet linkini challenge açılınca paylaşabilirsin',
  },

  submit: "Challenge'ı başlat",
};
