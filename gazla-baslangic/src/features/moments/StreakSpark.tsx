/**
 * Completion: Diken'in tepesinden bugünün dairesine yay çizerek uçan kıvılcım, arkasında sönen ışık noktaları
 * (seri kutlamasının ilk adımı; ardından kart gün dairesini doldurur). Koordinatlar ekranın kaydırma içeriğine göre.
 */
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { flameColors as f, momentsMetrics as m, streakFlareMotion as k } from '@/theme/moments';

import { TrailDot } from './FlareParticles';

type Point = { x: number; y: number };

/** Kübik bezier: başlangıç, iki kontrol noktası, hedef */
function bezier(p: Point[], t: number): Point {
  'worklet';
  const u = 1 - t;
  return {
    x: u * u * u * p[0].x + 3 * u * u * t * p[1].x + 3 * u * t * t * p[2].x + t * t * t * p[3].x,
    y: u * u * u * p[0].y + 3 * u * u * t * p[1].y + 3 * u * t * t * p[2].y + t * t * t * p[3].y,
  };
}

const RISE = { x: m.sparkRiseX, y: m.sparkRiseY };
const DIVE = { x: m.sparkDiveX, y: m.sparkDiveY };

export default function StreakSpark({ from, to }: { from: Point; to: Point }) {
  const half = m.sparkSize / 2;
  const path = [
    { x: from.x - half, y: from.y - half },
    { x: from.x - half + RISE.x, y: from.y - half + RISE.y },
    { x: to.x - half + DIVE.x, y: to.y - half + DIVE.y },
    { x: to.x - half, y: to.y - half },
  ];
  const progress = useSharedValue(0);
  const end = 1 + k.trailMs / k.sparkMs;

  useEffect(() => {
    progress.set(
      withDelay(k.sparkAt, withTiming(end, { duration: k.sparkMs * end, easing: Easing.bezier(0.45, 0, 0.75, 1) })),
    );
  }, [progress, end]);

  const sparkStyle = useAnimatedStyle(() => {
    const t = Math.min(1, progress.get());
    const p = bezier(path, t);
    return {
      opacity: progress.get() <= 0 || progress.get() >= 1 ? 0 : 1,
      transform: [{ translateX: p.x }, { translateY: p.y }, { rotate: `${t * m.sparkSpinDeg}deg` }, { scale: 0.4 + 0.6 * Math.min(1, t * 4) }],
    };
  });

  const trailHalf = m.sparkTrailSize / 2;
  return (
    <>
      {Array.from({ length: k.trailCount }, (_, i) => {
        const at = (i + 1) / (k.trailCount + 1);
        const p = bezier(path, at);
        return <TrailDot key={i} progress={progress} at={at} x={p.x + half - trailHalf} y={p.y + half - trailHalf} />;
      })}
      <Animated.View pointerEvents="none" style={[styles.spark, sparkStyle]}>
        <Svg width={m.sparkSize} height={m.sparkSize} viewBox="0 0 16 16">
          <Path d="M8 0 L9.8 6.2 L16 8 L9.8 9.8 L8 16 L6.2 9.8 L0 8 L6.2 6.2 Z" fill={f.spark} stroke={f.sparkStroke} strokeWidth={1} />
        </Svg>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  spark: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
