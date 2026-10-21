/**
 * Konuşma balonu — beyaz balon, alt dolu gölge, yönlü kuyruk (Main.png, NotifPermission.png, Poke.png,
 * NumberEntry.png, InviteLanding.png) ve alıntı balonu (Activity.png). Ölçüler `src/theme/speechBubble.ts`.
 *
 * Kuyruk tasarımdaki SVG'lerden: `left`/`right` 16×22 (Poke, NumberEntry), `bottom-right` 26×20 (Main),
 * `bottom-left` 28×20 (NotifPermission); `top-*` bunların dikey aynası. `tailOffset` kuyruğun kenar boyunca
 * konumu: yan kuyrukta üstten, `*-left`'te soldan, `*-right`'ta sağdan.
 */
import { Children, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { flatShadowStyle } from '@/components/FlatShadow';
import { useTheme } from '@/theme';
import { speechBubbleColors, speechBubbleMetrics as m, speechBubbleTypography as t } from '@/theme/speechBubble';

export type SpeechBubbleTail = 'none' | 'left' | 'right' | 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

type Props = {
  /** Metin verilirse balonun yazı stiliyle çizilir; başka içerik (ör. başlık + açıklama) olduğu gibi */
  children: ReactNode;
  /** speech: Diken'in sözü (varsayılan) · message: kişinin notu, sol alt köşe sivri · quote: alıntı, dolgu zemin */
  variant?: 'speech' | 'message' | 'quote';
  /** Yalnızca speech: sm (Poke, NumberEntry, InviteLanding Diken) · md (Main, varsayılan) · lg (NotifPermission) */
  size?: 'sm' | 'md' | 'lg';
  tail?: SpeechBubbleTail;
  /** Kuyruğun kenar boyunca konumu (px); verilmezse token'daki varsayılan */
  tailOffset?: number;
  /** Alt dolu gölge: soft (açık zemin, varsayılan) · deep (yeşil zemin) · none (karartma üstü, alıntı) */
  shadow?: 'none' | 'soft' | 'deep';
  /** light: koyu modda da beyaz balon (yeşil zeminli karşılama gibi koyu modda değişmeyen sahneler) */
  tone?: 'auto' | 'light';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function SpeechBubble({
  children,
  variant = 'speech',
  size = 'md',
  tail = 'none',
  tailOffset,
  shadow,
  tone = 'auto',
  style,
  textStyle,
}: Props) {
  const { scheme } = useTheme();
  const c = speechBubbleColors[tone === 'light' ? 'light' : scheme];

  const box = variant === 'speech' ? m[size] : m[variant];
  const font = variant === 'speech' ? (size === 'sm' ? t.sm : t.md) : t[variant];
  const bg = variant === 'quote' ? c.quoteBg : c.bg;
  const color = variant === 'quote' ? c.quoteText : c.text;
  const shadowKind = shadow ?? (variant === 'quote' ? 'none' : 'soft');
  const shadowColor = shadowKind === 'soft' ? c.shadowSoft : shadowKind === 'deep' ? c.shadowDeep : undefined;

  // Sivri köşe: mesajda sol alt, alıntıda sol üst
  const corners: ViewStyle =
    variant === 'message'
      ? { borderBottomLeftRadius: m.message.pinchedRadius }
      : variant === 'quote'
        ? { borderTopLeftRadius: m.quote.pinchedRadius }
        : {};

  return (
    <View
      style={[
        styles.bubble,
        {
          paddingVertical: box.paddingY,
          paddingHorizontal: box.paddingX,
          borderRadius: box.radius,
          backgroundColor: bg,
        },
        corners,
        flatShadowStyle(box.shadow, shadowColor),
        style,
      ]}>
      {Children.toArray(children).every((x) => typeof x === 'string' || typeof x === 'number') ? (
        <Text style={[font, { color }, textStyle]}>{children}</Text>
      ) : (
        children
      )}
      {tail !== 'none' && <Tail tail={tail} offset={tailOffset} color={bg} />}
    </View>
  );
}

/** Kuyruk yolları — tasarımdaki SVG'ler (sağ ve üst olanlar aynaları) */
const TAIL_PATHS: Record<Exclude<SpeechBubbleTail, 'none'>, string> = {
  left: 'M16 0 V22 L0 16 Z',
  right: 'M0 0 V22 L16 16 Z',
  'bottom-right': 'M0 0 H26 L20 18 Z',
  'bottom-left': 'M0 0 H28 L10 20 Z',
  'top-right': 'M0 20 H26 L20 2 Z',
  'top-left': 'M0 20 H28 L10 0 Z',
};

function Tail({ tail, offset, color }: { tail: Exclude<SpeechBubbleTail, 'none'>; offset?: number; color: string }) {
  const side = tail === 'left' || tail === 'right';
  const size = side ? m.tail.side : tail.endsWith('right') ? m.tail.bottomRight : m.tail.bottomLeft;
  const along = offset ?? size.offset;
  const out = -(side ? size.width - size.overlap : size.height - size.overlap);

  const position: ViewStyle = side
    ? { top: along, [tail]: out }
    : {
        [tail.startsWith('top') ? 'top' : 'bottom']: out,
        [tail.endsWith('left') ? 'left' : 'right']: along,
      };

  return (
    <Svg
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      style={[styles.tail, position]}>
      <Path d={TAIL_PATHS[tail]} fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'relative',
  },
  tail: {
    position: 'absolute',
    pointerEvents: 'none',
  },
});
