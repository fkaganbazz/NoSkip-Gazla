/**
 * Konuşma balonu token'ları — kaynak: design/Main.dc.html (karşılama balonu), NotifPermission.dc.html (izin kartı),
 * Poke.dc.html ve NumberEntry.dc.html (Diken'in sözü), InviteLanding.dc.html (davet eden kişinin notu ve Diken),
 * Activity.dc.html (alıntı balonu). Koyu karşılıkları tasarlanmadı; en yakın koyu rollere bağlandı.
 */
import type { TextStyle } from 'react-native';

import { darkColors, palette } from './colors';
import { fonts } from './typography';

type Scheme = 'light' | 'dark';

export type SpeechBubbleColors = {
  bg: string;
  text: string;
  /** Açık zeminde (kum, yeşil 50) alt gölge — NotifPermission, InviteLanding */
  shadowSoft: string | undefined;
  /** Yeşil zeminde alt gölge — Main */
  shadowDeep: string;
  /** Alıntı balonu (Activity) */
  quoteBg: string;
  quoteText: string;
};

export const speechBubbleColors: Record<Scheme, SpeechBubbleColors> = {
  light: {
    bg: palette.white,
    text: palette.nightPurple,
    shadowSoft: '#CFE6D7',
    shadowDeep: 'rgba(22, 92, 52, 0.55)',
    quoteBg: palette.fill,
    quoteText: palette.ink700,
  },
  dark: {
    // Koyu balon tasarlanmadı: ikincil yüzey; karartma ve koyu zemin üstünde karttan daha iyi ayrışıyor
    bg: darkColors.surfaceMuted,
    text: darkColors.text,
    shadowSoft: undefined, // koyu modda kart gölgeleri yok (TodayDark)
    shadowDeep: 'rgba(22, 92, 52, 0.55)', // yeşil zemin koyu modda da yeşil
    quoteBg: darkColors.surfaceMuted,
    quoteText: darkColors.textBody,
  },
};

/** Balon boyları: iç boşluk, köşe ve alt gölge yüksekliği */
export const speechBubbleMetrics = {
  /** Diken'in kısa sözü — Poke, NumberEntry, InviteLanding: padding 10 12, köşe 16, gölge 4 */
  sm: { paddingY: 10, paddingX: 12, radius: 16, shadow: 4 },
  /** Karşılama balonu — Main: padding 12 14, köşe 18, gölge 6 */
  md: { paddingY: 12, paddingX: 14, radius: 18, shadow: 6 },
  /** İzin kartı — NotifPermission: padding 18 20, köşe 24, gölge 5 */
  lg: { paddingY: 18, paddingX: 20, radius: 24, shadow: 5 },
  /** Kişinin notu — InviteLanding: padding 12 14, köşe 18 (sol alt 4), gölge 4 */
  message: { paddingY: 12, paddingX: 14, radius: 18, pinchedRadius: 4, shadow: 4 },
  /** Alıntı — Activity: padding 8 12, köşe 14 (sol üst 4), gölgesiz */
  quote: { paddingY: 8, paddingX: 12, radius: 14, pinchedRadius: 4, shadow: 0 },

  /**
   * Kuyruklar (tasarımdaki SVG'ler). `overlap`: balonun içine giren kısım; `offset`: kenar boyunca varsayılan
   * konum (yan kuyrukta üstten, alt/üst kuyrukta adı geçen yandan).
   */
  tail: {
    /** Poke/NumberEntry: 16×22, left -12 (4 içeride), top 12 */
    side: { width: 16, height: 22, overlap: 4, offset: 12 },
    /** Main: 26×20, balonun altına 5 giriyor, sağ kenardan 26 içeride */
    bottomRight: { width: 26, height: 20, overlap: 5, offset: 26 },
    /** NotifPermission: 28×20, balonun altına 2 giriyor (konumu ekrana göre verilir) */
    bottomLeft: { width: 28, height: 20, overlap: 2, offset: 24 },
  },
} as const;

/** Yazılar (renk içermez) */
export const speechBubbleTypography = {
  /** Nunito 800 · 13 · satır 1.3 */
  sm: { fontFamily: fonts.extraBold, fontSize: 13, lineHeight: 13 * 1.3 },
  /** Nunito 800 · 15 · satır 1.3 (lg balonda metin verilirse de bu) */
  md: { fontFamily: fonts.extraBold, fontSize: 15, lineHeight: 15 * 1.3 },
  /** Nunito 700 · 15 · satır 1.4 */
  message: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 15 * 1.4 },
  /** Nunito 700 · 14 */
  quote: { fontFamily: fonts.bold, fontSize: 14 },
} as const satisfies Record<string, TextStyle>;
