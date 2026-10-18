import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import Diken from '@/components/Diken';
import { flatShadowStyle } from '@/components/FlatShadow';
import { useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

/** Sanat alanı tasarımda y 100–494; içindeki öğeler bu alana göre konumlanır */
const ART_HEIGHT = m.welcomeArtBottom - m.welcomeArtTop;
const y = (designTop: number) => designTop - m.welcomeArtTop;

type Props = {
  /** Sanatın üstünde logo için ayrılan yükseklik */
  reservedTop: number;
};

// Karşılama ekranının yeşil üst alanı: halkalar, parıltılar, konuşma balonu ve el sallayan Diken
// (Main.dc.html). Alt sayfanın hemen üstüne oturur; kısa ekranlarda alttan küçülür.
export default function WelcomeArt({ reservedTop }: Props) {
  const { scheme } = useTheme();
  const c = onboardingColors[scheme];
  const [height, setHeight] = useState(0);
  const scale = height > 0 ? Math.min(1, (height - reservedTop) / ART_HEIGHT) : 1;

  return (
    <View style={styles.area} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      <View style={[styles.art, { transform: [{ scale: Math.max(scale, 0.5) }] }]}>
        <View
          style={[
            styles.circle,
            {
              left: m.circleOuter.left,
              top: y(m.circleOuter.top),
              width: m.circleOuter.size,
              height: m.circleOuter.size,
              borderRadius: m.circleOuter.size / 2,
              backgroundColor: c.welcomeCircleOuter,
            },
          ]}
        />
        <View
          style={[
            styles.circle,
            {
              left: m.circleInner.left,
              top: y(m.circleInner.top),
              width: m.circleInner.size,
              height: m.circleInner.size,
              borderRadius: m.circleInner.size / 2,
              backgroundColor: c.welcomeCircleInner,
            },
          ]}
        />

        {/* Parıltılar: tasarımdaki 390×500 SVG'nin sanat alanına düşen kısmı */}
        <Svg
          width={m.welcomeFrameWidth}
          height={ART_HEIGHT}
          viewBox={`0 ${m.welcomeArtTop} ${m.welcomeFrameWidth} ${ART_HEIGHT}`}
          style={styles.sparkles}>
          <Path
            d="M52 250 L55.5 260.5 L66 264 L55.5 267.5 L52 278 L48.5 267.5 L38 264 L48.5 260.5 Z"
            fill={c.sparkleYellow}
          />
          <Path
            d="M338 176 L340.8 184.2 L349 187 L340.8 189.8 L338 198 L335.2 189.8 L327 187 L335.2 184.2 Z"
            fill={c.sparkleYellow}
          />
          <Path
            d="M344 350 L346 356 L352 358 L346 360 L344 366 L342 360 L336 358 L342 356 Z"
            fill={c.sparkleLight}
            opacity={0.8}
          />
          <Circle cx={84} cy={400} r={4} fill={c.sparkleLight} opacity={0.55} />
          <Circle cx={312} cy={262} r={3} fill={c.sparkleLight} opacity={0.55} />
          <Circle cx={36} cy={150} r={3} fill={c.sparkleLight} opacity={0.45} />
        </Svg>

        <View
          style={[styles.bubble, { backgroundColor: c.bubbleBg }, flatShadowStyle(m.bubble.shadow, c.bubbleShadow)]}>
          <Text style={[t.bubble, { color: c.bubbleText }]}>Ben Diken. Seni dürtmeye geldim.</Text>
        </View>
        <Svg
          width={m.bubbleTail.width}
          height={m.bubbleTail.height}
          viewBox={`0 0 ${m.bubbleTail.width} ${m.bubbleTail.height}`}
          style={styles.tail}>
          <Path d="M0 0 H26 L20 18 Z" fill={c.bubbleBg} />
        </Svg>

        <View style={styles.diken}>
          <Diken mood="selam" stage="tam" size={m.welcomeDiken.size} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  art: {
    width: m.welcomeFrameWidth,
    height: ART_HEIGHT,
    transformOrigin: 'bottom',
  },
  circle: {
    position: 'absolute',
  },
  sparkles: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  bubble: {
    position: 'absolute',
    left: m.bubble.left,
    top: y(m.bubble.top),
    width: m.bubble.width,
    paddingVertical: m.bubble.paddingY,
    paddingHorizontal: m.bubble.paddingX,
    borderRadius: m.bubble.radius,
  },
  tail: {
    position: 'absolute',
    left: m.bubbleTail.left,
    top: y(m.bubbleTail.top),
  },
  diken: {
    position: 'absolute',
    left: m.welcomeDiken.left,
    top: y(m.welcomeDiken.top),
  },
});
