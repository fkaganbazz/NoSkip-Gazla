/**
 * Seri kutlamasının küçük parçaları: alevden yükselen közler ve kıvılcımın arkasındaki ışık noktaları.
 * Her parça tek bir ortak ilerleme değerinden (reanimated) kendi gecikmesiyle okur; rastgelelik
 * sıraya göre sabittir (her çizimde aynı).
 */
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { flameColors, momentsMetrics as m, streakFlareMotion as k } from '@/theme/moments';

/** 0..1 arası, sıraya göre sabit "rastgele" sayı */
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

type EmberProps = {
  /** Patlamanın başından beri geçen süre (ms) */
  elapsed: SharedValue<number>;
  index: number;
  spread: number;
};

export function Ember({ elapsed, index, spread }: EmberProps) {
  const dx = (seeded(index, 1) - 0.5) * spread;
  const dy = -(k.emberRise + seeded(index, 2) * spread * 0.9);
  const scale = 0.6 + seeded(index, 3) * 0.8;
  const duration = k.emberMs * (0.8 + seeded(index, 4) * 0.45);
  const start = index * k.emberStaggerMs;
  const color = flameColors.embers[index % flameColors.embers.length];

  const style = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, (elapsed.get() - start) / duration));
    const opacity = t <= 0 || t >= 1 ? 0 : t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
    const ease = 1 - (1 - t) * (1 - t);
    return {
      opacity,
      transform: [{ translateX: dx * ease }, { translateY: dy * ease }, { scale: scale * (1 - 0.7 * t) }],
    };
  });
  return <Animated.View pointerEvents="none" style={[styles.ember, { backgroundColor: color }, style]} />;
}

type TrailProps = {
  /** Kıvılcımın ilerlemesi (1 = hedefte; iz sönene kadar 1'i geçer) */
  progress: SharedValue<number>;
  /** Bu noktanın yol üzerindeki yeri (0..1) */
  at: number;
  x: number;
  y: number;
};

export function TrailDot({ progress, at, x, y }: TrailProps) {
  const life = k.trailMs / k.sparkMs;
  const style = useAnimatedStyle(() => {
    const t = (progress.get() - at) / life;
    return {
      opacity: t < 0 || t > 1 ? 0 : 0.9 * (1 - t),
      transform: [{ translateX: x }, { translateY: y + 7 * Math.max(0, t) }, { scale: 1 - 0.8 * Math.max(0, t) }],
    };
  });
  return <Animated.View pointerEvents="none" style={[styles.trail, style]} />;
}

const styles = StyleSheet.create({
  ember: {
    position: 'absolute',
    width: m.emberSize,
    height: m.emberSize,
    borderRadius: m.emberSize / 2,
    left: '50%',
    top: '30%',
    marginLeft: -m.emberSize / 2,
  },
  trail: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: m.sparkTrailSize,
    height: m.sparkTrailSize,
    borderRadius: m.sparkTrailSize / 2,
    backgroundColor: flameColors.spark,
  },
});
