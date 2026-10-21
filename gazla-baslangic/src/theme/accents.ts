/**
 * Veriye bağlı vurgu renkleri: avatar ve challenge ikon zeminleri (açık/koyu).
 * Kaynak: design/Today.dc.html ve design/TodayDark.dc.html (Components.dc.html avatarları da aynı).
 */
import type { ChallengeCategory } from '@/data/types';

export type Tint = {
  /** Zemin */
  bg: string;
  /** Üstündeki harf veya ikon */
  ink: string;
};

type Scheme = 'light' | 'dark';

/** Arkadaş avatarlarının zemin/harf renkleri */
export const avatarTints = {
  peach: {
    light: { bg: '#FFD8C2', ink: '#9A3412' },
    dark: { bg: '#5A2E1C', ink: '#FFD8C2' },
  },
  lavender: {
    light: { bg: '#E4DBF2', ink: '#4B3A78' },
    dark: { bg: '#3A2C5C', ink: '#E4DBF2' },
  },
  mint: {
    light: { bg: '#CDEBD8', ink: '#1F6B40' },
    dark: { bg: '#1F4D33', ink: '#CDEBD8' },
  },
  butter: {
    light: { bg: '#FFF1C7', ink: '#8A5A00' },
    dark: { bg: '#4A3A12', ink: '#FFF1C7' },
  },
} as const satisfies Record<string, Record<Scheme, Tint>>;

/** Challenge ikon karolarının zemin/ikon renkleri */
export const challengeTints = {
  lilac: {
    light: { bg: '#EDE7F6', ink: '#4B3A78' },
    dark: { bg: '#2E2352', ink: '#CDBEF5' },
  },
  rose: {
    light: { bg: '#FFE3EC', ink: '#A3275A' },
    dark: { bg: '#42203A', ink: '#FFB3CF' },
  },
  green: {
    light: { bg: '#DDF3E4', ink: '#1F6B40' },
    dark: { bg: '#16372A', ink: '#8BE0AE' },
  },
  // PickChallenge.dc.html / Explore.dc.html. Bu renklerin koyu tasarımı yok: koyu modda aynı tonun
  // avatar karşılığı (butter, peach) ya da en yakın challenge rengi (teal → green, sky → lilac).
  butter: {
    light: { bg: '#FFF1C7', ink: '#8A5A00' },
    dark: { bg: '#4A3A12', ink: '#FFF1C7' },
  },
  peach: {
    light: { bg: '#FFE3D2', ink: '#9A3412' },
    dark: { bg: '#5A2E1C', ink: '#FFD8C2' },
  },
  teal: {
    light: { bg: '#D9F2EF', ink: '#0F6B63' },
    dark: { bg: '#16372A', ink: '#8BE0AE' },
  },
  sky: {
    light: { bg: '#E0EEFF', ink: '#1E4F9A' },
    dark: { bg: '#2E2352', ink: '#CDBEF5' },
  },
} as const satisfies Record<string, Record<Scheme, Tint>>;

export type AvatarTint = keyof typeof avatarTints;
export type ChallengeTint = keyof typeof challengeTints;

/**
 * Kategori → challenge rengi (docs/EKRANLAR.md "CategoryTile"; PickChallenge.dc.html, Explore.dc.html):
 * detoks #EDE7F6/#4B3A78, sosyal #FFE3D2/#9A3412, spor #DDF3E4/#1F6B40, yeme #FFF1C7/#8A5A00,
 * okuma #FFE3EC/#A3275A, para #D9F2EF/#0F6B63, tuhaf #E0EEFF/#1E4F9A. Koyu karşılıkları `challengeTints`ten.
 */
export const categoryTints = {
  detox: 'lilac',
  social_courage: 'peach',
  sport: 'green',
  food_drink: 'butter',
  reading: 'rose',
  money: 'teal',
  quirky: 'sky',
} as const satisfies Record<ChallengeCategory, ChallengeTint>;

/** Kategorisi olmayan (özel) challenge'ın rengi — challenges.tint sütununun varsayılanı ('green') */
export const customChallengeTint: ChallengeTint = 'green';

/** Kategorinin challenge rengi; kategori yoksa (özel challenge) varsayılan renk */
export function categoryTint(category: ChallengeCategory | null | undefined): ChallengeTint {
  return category ? categoryTints[category] : customChallengeTint;
}
