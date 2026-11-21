/**
 * Seri alevi — kutlama kartındaki renkli alev (çizgi hali: icons/StreakIcon). Diken gibi koyu dış çizgili,
 * turuncudan açık turuncuya dış alev ve sarı iç alev. İki katman ayrı çizilir ki hareket ayrı verilebilsin:
 * `style` bütün alevi (harlanma, titreme), `innerStyle` yalnızca iç alevi (kıpırtı) taşır.
 */
import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { flameColors as c } from '@/theme/moments';

/** Çizimin kendi ölçüsü (viewBox) */
const VIEW_W = 30;
const VIEW_H = 38;
const OUTER =
  'M15 2 C18 9 26 13 26 23 C26 30 21 35 15 35 C9 35 4 30 4 23 C4 17 8 14 10 9 C11 13 13 15 15 15 C15 10 14 6 15 2 Z';
const INNER =
  'M15 18 C17 21 20 23 20 27 C20 30.5 17.8 32.5 15 32.5 C12.2 32.5 10 30.5 10 27 C10 24.5 12 22.5 13 20.5 C13.6 22 14.4 22.6 15 22.6 C15 21 14.7 19.6 15 18 Z';
const OUTLINE_WIDTH = 2.4;

type Props = {
  /** Yükseklik; genişlik orana göre */
  height: number;
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  innerStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
};

export default function Flame({ height, style, innerStyle }: Props) {
  // Gradyan kimliği örnek başına (web'de aynı kimlik iki alevde çakışır); SVG url() iki nokta sevmez
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const width = (height * VIEW_W) / VIEW_H;
  const box = { width, height };
  return (
    <Animated.View style={[box, styles.origin, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Defs>
          <LinearGradient id={`fo${id}`} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={c.outerBottom} />
            <Stop offset="1" stopColor={c.outerTop} />
          </LinearGradient>
        </Defs>
        <Path d={OUTER} fill={`url(#fo${id})`} stroke={c.outline} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, styles.innerOrigin, innerStyle]} pointerEvents="none">
        <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          <Defs>
            <LinearGradient id={`fi${id}`} x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor={c.innerBottom} />
              <Stop offset="1" stopColor={c.innerTop} />
            </LinearGradient>
          </Defs>
          <Path d={INNER} fill={`url(#fi${id})`} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** Pill ve benzeri küçük yerler için hareketsiz alev */
export function StaticFlame({ height, style }: { height: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Flame height={height} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Alev tabanından büyür ve savrulur
  origin: { transformOrigin: '50% 92%' },
  innerOrigin: { transformOrigin: '50% 85%' },
});
