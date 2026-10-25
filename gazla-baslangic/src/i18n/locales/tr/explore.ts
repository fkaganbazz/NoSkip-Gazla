import type { ChallengeCategory, ChallengeDifficulty, TaskType } from '@/data';

export const explore = {
  /** Keşfet ekranı (app/(tabs)/explore.tsx) */
  screen: {
    title: 'Keşfet',
    searchPlaceholder: 'Challenge ara',
    popular: 'Popüler',
    results: 'Sonuçlar',
    /** Popüler listesinin tamamını aç */
    seeAll: 'Tümü',
    empty: "Bu aramaya uyan challenge yok. Kendi challenge'ını oluşturabilirsin.",
    createOwn: 'Kendin oluştur',
  },

  /** Kategori çipleri (CategoryChips): ilk çip ve kısa adlar, tasarımdaki sırayla */
  chips: {
    all: 'Tümü',
    categories: {
      detox: 'Detoks',
      social_courage: 'Sosyal cesaret',
      sport: 'Spor',
      food_drink: 'Yeme-içme',
      reading: 'Okuma',
      money: 'Para',
      quirky: 'Tuhaf',
    } satisfies Record<ChallengeCategory, string>,
  },

  /** Satır alt bilgisindeki, liste başlığındaki ve önizleme çipindeki uzun ad ("Tuhaf ve eğlenceli · Kolay") */
  categoryNames: {
    detox: 'Detoks',
    social_courage: 'Sosyal cesaret',
    sport: 'Spor',
    food_drink: 'Yeme-içme',
    reading: 'Okuma',
    money: 'Para',
    quirky: 'Tuhaf ve eğlenceli',
  } satisfies Record<ChallengeCategory, string>,

  difficulty: {
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
  } satisfies Record<ChallengeDifficulty, string>,

  /** "Haftanın challenge'ı" kartı (FeaturedCard) */
  featured: {
    label: "HAFTANIN CHALLENGE'I",
    doingNow: (n: number) => `${n} kişi şu an yapıyor`,
    open: 'İncele',
    a11y: (title: string) => `Haftanın challenge'ı: ${title}. İncele`,
  },

  /** Popüler listesi (TemplateList) */
  list: {
    /** "Kahvesiz 7 gün, Detoks · Kolay, 7 gün" */
    rowA11y: (title: string, meta: string, days: number) => `${title}, ${meta}, ${days} gün`,
    createOwn: 'Kendin oluştur',
  },

  /** Banner reklamın etiketi */
  adTag: 'REKLAM',

  /** Challenge önizleme (app/challenge/preview/[templateId].tsx) */
  preview: {
    notFound: 'Bu challenge bulunamadı.',
    goBack: 'Geri dön',
    /** "Kolay zorluk" */
    difficulty: (level: string) => `${level} zorluk`,
    duration: 'Süre',
    withFriends: 'Arkadaşlarla',
    startSolo: 'Tek başıma başla',
    /** "Nasıl işler" satırları (PreviewFeatures); ilki görev türüne göre */
    features: {
      taskType: {
        check: 'Her gün tek dokunuşla işaretle',
        number: 'Her gün sayını gir: dakika, adım, sayfa',
        photo: 'Her gün fotoğrafla kanıtla, grup görsün',
      } satisfies Record<TaskType, string>,
      rescue: 'Kaçırırsan Diken solar, sulayıp kurtarabilirsin',
      garden: 'Son gün bahçene yeni bir kaktüs eklenir',
    },
    /** "Mert, Kerem ve 310 kişi şu an yapıyor" (explore/logic.ts doingNowText) */
    doingNow: {
      others: (n: number) => `${n} kişi şu an yapıyor`,
      one: (name: string) => `${name} şu an yapıyor`,
      two: (first: string, second: string) => `${first} ve ${second} şu an yapıyor`,
      /** names: virgülle birleştirilmiş adlar */
      namesAndOthers: (names: string, n: number) => `${names} ve ${n} kişi şu an yapıyor`,
    },
  },
};
