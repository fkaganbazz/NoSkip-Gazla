import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
  type WithTimingConfig,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import Flame from '@/components/Flame';
import { CheckIcon, SolidDropIcon } from '@/components/icons';
import { formatNumber, useT } from '@/i18n';
import { heavyHaptic, lightHaptic, successHaptic } from '@/media/haptics';
import {
  celebrationColors as c,
  flameColors as f,
  momentsMetrics as m,
  momentsTypography as ty,
  streakFlareMotion as k,
} from '@/theme/moments';

import { Ember } from './FlareParticles';
import type { StreakFlareKind, WeekCell } from './logic';

type Props = {
  streak: number;
  week: WeekCell[];
  /** Kutlama türü (Completion: bugün tamamlandıysa); yoksa kart durağan */
  flare?: StreakFlareKind | null;
  onLayout?: (e: LayoutChangeEvent) => void;
  /** Bugünün dairesinin merkezi, kartın sol üstüne göre (Completion'daki kıvılcımın hedefi) */
  onTodayCenter?: (x: number, y: number) => void;
};

const EASE_OUT = Easing.out(Easing.quad);
const SPRING = Easing.bezier(0.3, 1.4, 0.5, 1);

type Ease = NonNullable<WithTimingConfig['easing']>;

/** Değerler ve kesirli zamanlarla ardışık geçiş (anahtar kareler) */
function keyframes(values: number[], at: number[], total: number, easing: Ease = EASE_OUT): number {
  const steps = values
    .slice(1)
    .map((v, i) => withTiming(v, { duration: Math.max(1, (at[i + 1] - at[i]) * total), easing }));
  return withSequence<number>(...steps);
}

// Completion: seri sayısı ve son 7 gün (Completion.dc.html) + alevli kutlama. Kum zeminli kart iki modda aynı.
// Kutlama (flare): bugünün dairesi dolar, alev harlanır ve sayı kayar (ilk günde alev sıfırdan tutuşur, kilometre
// taşında kart alev alır); her adımda titreşim. "Hareketi azalt" açıksa kart son haliyle gelir, tek bir "başarılı"
// titreşimi kalır. Alev ekran açık kaldıkça hafifçe titrer. Zamanlar streakFlareMotion (theme/moments).
export default function StreakCard({ streak, week, flare = null, onLayout, onTodayCenter }: Props) {
  const t = useT();
  const ts = t.moments.streakCard;
  const reduced = useReducedMotion();
  const play = !!flare && !reduced;
  const start = flare === 'start';
  const milestone = flare === 'milestone';
  const todayIndex = useMemo(() => {
    for (let i = week.length - 1; i >= 0; i -= 1) if (week[i].isToday) return i;
    return -1;
  }, [week]);

  // Bugünün dairesi
  const fill = useSharedValue(play ? 0 : 1);
  const ripple = useSharedValue(0);
  const check = useSharedValue(play ? 0 : 1);
  // Alev: harlanma (sx, sy, dönüş) × titreme
  const fsx = useSharedValue(play && start ? 0 : 1);
  const fsy = useSharedValue(play && start ? 0 : 1);
  const frot = useSharedValue(0);
  const flameOpacity = useSharedValue(play && start ? 0 : 1);
  const tsx = useSharedValue(1);
  const tsy = useSharedValue(1);
  const trot = useSharedValue(0);
  const inner = useSharedValue(1);
  const heat = useSharedValue(play && start ? 0 : milestone ? 0.8 : 0.45);
  const heatScale = useSharedValue(1);
  const embers = useSharedValue(0);
  // Sayı
  const oldY = useSharedValue(0);
  const oldOpacity = useSharedValue(play && !start ? 1 : 0);
  const newY = useSharedValue(0);
  const newOpacity = useSharedValue(play ? 0 : 1);
  const newScale = useSharedValue(1);
  const flash = useSharedValue(0);
  const plus = useSharedValue(0);
  // Etiket ve kart
  const pill = useSharedValue(play ? 0 : flare && flare !== 'up' ? 1 : 0);
  const glow = useSharedValue(play ? 0 : milestone ? 0.7 : 0);
  const cardScale = useSharedValue(1);

  const emberCount = milestone ? k.milestoneEmberCount : start ? k.startEmberCount : k.emberCount;
  const emberSpread = milestone ? k.milestoneEmberSpread : k.emberSpread;

  // Titreşim (web'de yok). Kutlama yoksa ya da hareket azaltılmışsa açılışta tek "başarılı" titreşimi
  // Completion'da çalar; burada yalnızca kutlamanın adımları.
  const buzzed = useRef(false);
  useEffect(() => {
    if (!play || buzzed.current) return;
    buzzed.current = true;
    const at = (ms: number, fn: () => void) => setTimeout(fn, ms);
    const timers = [at(k.hapticLightAt, lightHaptic)];
    if (start) {
      timers.push(at(k.hapticIgniteAt, heavyHaptic), at(k.hapticStartSuccessAt, successHaptic));
    } else {
      timers.push(at(k.hapticSuccessAt, successHaptic));
      if (milestone) k.hapticMilestoneAt.forEach((ms) => timers.push(at(ms, heavyHaptic)));
    }
    return () => timers.forEach(clearTimeout);
  }, [play, start, milestone]);

  useEffect(() => {
    const flicker = () => {
      if (reduced) return;
      tsx.set(withRepeat(keyframes([1, 0.97, 1.02, 0.98, 1], [0, 0.25, 0.5, 0.75, 1], k.flickerMs, Easing.inOut(Easing.quad)), -1));
      tsy.set(withRepeat(keyframes([1, 1.05, 0.97, 1.03, 1], [0, 0.25, 0.5, 0.75, 1], k.flickerMs, Easing.inOut(Easing.quad)), -1));
      trot.set(withRepeat(keyframes([0, -2, 1.5, -1, 0], [0, 0.25, 0.5, 0.75, 1], k.flickerMs, Easing.inOut(Easing.quad)), -1));
      inner.set(withRepeat(keyframes([1, 1.08, 0.96, 1], [0, 0.4, 0.75, 1], k.innerFlickerMs, Easing.inOut(Easing.quad)), -1));
    };
    if (!play) {
      flicker();
      return;
    }
    const d = (ms: number, anim: number) => withDelay(ms, anim);

    // Gün dolar
    fill.set(d(k.dayFillAt, keyframes([0, 1.18, 1], [0, 0.6, 1], k.dayFillMs, SPRING)));
    ripple.set(d(k.dayFillAt, withTiming(1, { duration: k.rippleMs, easing: EASE_OUT })));
    check.set(d(k.checkAt, withTiming(1, { duration: k.checkMs, easing: SPRING })));

    if (start) {
      // Tutuşma: küçük bir kıvılcımdan alev çıkar, sonra "1"
      const at = [0, 0.18, 0.5, 0.72, 1];
      flameOpacity.set(d(k.igniteAt, withTiming(1, { duration: k.igniteMs * 0.18 })));
      fsx.set(d(k.igniteAt, keyframes([0.1, 0.5, 1.25, 0.92, 1], at, k.igniteMs, SPRING)));
      fsy.set(d(k.igniteAt, keyframes([0.1, 0.35, 1.45, 0.9, 1], at, k.igniteMs, SPRING)));
      frot.set(d(k.igniteAt, keyframes([0, 0, -6, 4, 0], at, k.igniteMs)));
      heat.set(d(k.igniteAt, keyframes([0, 1, 0.45], [0, 0.4, 1], k.heatMs)));
      heatScale.set(d(k.igniteAt, keyframes([0.3, 1.3, 1], [0, 0.4, 1], k.heatMs)));
      embers.set(d(k.igniteAt + 80, withTiming(k.emberMs * 1.3 + emberCount * k.emberStaggerMs, { duration: k.emberMs * 1.3 + emberCount * k.emberStaggerMs, easing: Easing.linear })));
      newOpacity.set(d(k.startNumberAt, withTiming(1, { duration: k.numberPopMs * 0.4 })));
      newScale.set(d(k.startNumberAt, keyframes([0.3, 1.25, 1], [0, 0.6, 1], k.numberPopMs, SPRING)));
    } else {
      // Harlanma: alev büyür, savrulur, közler uçar; sayı kayar, yeni sayı turuncu parlayıp yeşile döner
      const big = milestone ? k.milestoneFlareScale : k.flareScale;
      const at = [0, 0.28, 0.48, 0.7, 1];
      fsx.set(d(k.flareAt, keyframes([1, big * 0.92, big * 0.85, 1.12, 1], at, k.flareMs, Easing.inOut(Easing.quad))));
      fsy.set(d(k.flareAt, keyframes([1, big, big * 1.06, 1.18, 1], at, k.flareMs, Easing.inOut(Easing.quad))));
      frot.set(d(k.flareAt, keyframes([0, -7, 6, -3, 0], at, k.flareMs, Easing.inOut(Easing.quad))));
      heat.set(d(k.flareAt, keyframes([0.45, 1, milestone ? 0.8 : 0.45], [0, 0.35, 1], k.heatMs)));
      heatScale.set(d(k.flareAt, keyframes([1, big, 1], [0, 0.35, 1], k.heatMs)));
      embers.set(d(k.flareAt + 40, withTiming(k.emberMs * 1.3 + emberCount * k.emberStaggerMs, { duration: k.emberMs * 1.3 + emberCount * k.emberStaggerMs, easing: Easing.linear })));
      oldY.set(d(k.flareAt + 40, withTiming(-1, { duration: k.numberOutMs, easing: Easing.in(Easing.quad) })));
      oldOpacity.set(d(k.flareAt + 40, withTiming(0, { duration: k.numberOutMs, easing: Easing.in(Easing.quad) })));
      newY.set(1);
      newY.set(d(k.flareAt + 100, keyframes([1, -0.12, 0], [0, 0.6, 1], k.numberInMs, SPRING)));
      newOpacity.set(d(k.flareAt + 100, withTiming(1, { duration: k.numberInMs * 0.35 })));
      flash.set(1);
      flash.set(d(k.flareAt + 100 + k.numberInMs * 0.6, withTiming(0, { duration: k.numberInMs * 0.4 })));
      plus.set(d(k.flareAt + 120, withTiming(1, { duration: k.plusMs, easing: Easing.linear })));
    }
    if (milestone) {
      glow.set(d(k.milestoneAt, keyframes([0, 1, 0.35, 1, 0.7], [0, 0.2, 0.45, 0.65, 1], k.glowMs)));
      cardScale.set(d(k.milestoneAt, keyframes([1, 1.045, 1, 1.03, 1], [0, 0.25, 0.5, 0.72, 1], k.cardPulseMs)));
    }
    if (flare !== 'up') pill.set(d(k.pillAt, keyframes([0, 1.08, 1], [0, 0.6, 1], k.pillMs, SPRING)));

    // Kutlama bitince sakin titreme
    const id = setTimeout(flicker, (start ? k.igniteAt + k.igniteMs : k.flareAt + k.flareMs) + 20);
    return () => {
      clearTimeout(id);
      [fill, ripple, check, fsx, fsy, frot, flameOpacity, tsx, tsy, trot, inner, heat, heatScale, embers, oldY, oldOpacity, newY, newOpacity, newScale, flash, plus, pill, glow, cardScale].forEach(cancelAnimation);
    };
    // Kutlama karta bir kez, ilk çizimde verilir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: flameOpacity.get(),
    transform: [
      { scaleX: fsx.get() * tsx.get() },
      { scaleY: fsy.get() * tsy.get() },
      { rotate: `${frot.get() + trot.get()}deg` },
    ],
  }));
  const innerStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: inner.get() }] }));
  const heatStyle = useAnimatedStyle(() => ({ opacity: heat.get(), transform: [{ scale: heatScale.get() }] }));
  const lineH = ty.streakNumber.lineHeight;
  const oldStyle = useAnimatedStyle(() => ({ opacity: oldOpacity.get(), transform: [{ translateY: oldY.get() * lineH }] }));
  const newStyle = useAnimatedStyle(() => ({
    opacity: newOpacity.get(),
    color: interpolateColor(flash.get(), [0, 1], [c.streakNumber, f.numberFlash]),
    transform: [{ translateY: newY.get() * lineH }, { scale: newScale.get() }],
  }));
  const plusStyle = useAnimatedStyle(() => {
    const p = plus.get();
    return {
      opacity: p <= 0 || p >= 1 ? 0 : p < 0.25 ? p / 0.25 : p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3,
      transform: [{ translateY: 6 - 24 * p }, { scale: p < 0.25 ? 0.6 + 1.6 * p : 1 }],
    };
  });
  const pillStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pill.get() * 1.6),
    transform: [{ translateY: (1 - pill.get()) * -24 }, { scale: 0.7 + 0.3 * pill.get() }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.get() }));
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.get() }] }));

  const oldNumber = Math.max(0, streak - 1);
  const pillText = start ? ts.started : milestone ? ts.milestone(streak) : null;

  return (
    <Animated.View onLayout={onLayout} style={[styles.card, { backgroundColor: c.cardBg }, cardStyle]}>
      <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]} />
      <View accessible accessibilityLabel={ts.a11y(streak)} style={styles.column}>
        <View style={styles.numberRow}>
          <View style={styles.flameBox}>
            <Animated.View pointerEvents="none" style={[styles.heat, heatStyle]}>
              <Svg width={m.heatSize} height={m.heatSize}>
                <Defs>
                  <RadialGradient id="streakHeat" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor={f.heat} stopOpacity={0.55} />
                    <Stop offset="0.45" stopColor={f.glow} stopOpacity={0.25} />
                    <Stop offset="1" stopColor={f.glow} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={m.heatSize / 2} cy={m.heatSize / 2} r={m.heatSize / 2} fill="url(#streakHeat)" />
              </Svg>
            </Animated.View>
            <Flame height={m.flameHeight} style={flameStyle} innerStyle={innerStyle} />
            {play && Array.from({ length: emberCount }, (_, i) => <Ember key={i} elapsed={embers} index={i} spread={emberSpread} />)}
          </View>
          <View style={[styles.numberBox, { height: lineH }]}>
            {/* Görünmez ölçü: kutu iki sayının genişi kadar (12 → 13 kayarken eski sayı alt satıra düşmesin) */}
            <View style={styles.sizer}>
              <Text style={ty.streakNumber}>{formatNumber(streak)}</Text>
              {play && !start && <Text style={ty.streakNumber}>{formatNumber(oldNumber)}</Text>}
            </View>
            <Animated.Text numberOfLines={1} style={[ty.streakNumber, styles.number, { color: c.streakNumber }, newStyle]}>
              {formatNumber(streak)}
            </Animated.Text>
            {play && !start && (
              <Animated.Text numberOfLines={1} style={[ty.streakNumber, styles.number, { color: c.streakNumber }, oldStyle]}>
                {formatNumber(oldNumber)}
              </Animated.Text>
            )}
          </View>
        </View>
        <Text style={[ty.streakLabel, { color: c.streakLabel }]}>{ts.label}</Text>
        {play && !start && (
          <Animated.View pointerEvents="none" style={[styles.plus, { backgroundColor: f.plusBg }, plusStyle]}>
            <Text style={[ty.plusOne, { color: f.plusText }]}>{ts.plusOne}</Text>
          </Animated.View>
        )}
      </View>
      <View
        style={styles.week}
        onLayout={(e) => {
          if (!onTodayCenter || todayIndex < 0) return;
          const { x, y, width } = e.nativeEvent.layout;
          const cell = (width - (week.length - 1) * m.weekGap) / week.length;
          onTodayCenter(x + todayIndex * (cell + m.weekGap) + cell / 2, y + m.dayDot / 2);
        }}>
        {week.map((d, i) => (
          <View key={d.key} style={styles.day}>
            <DayDot cell={d} animated={play && i === todayIndex} fill={fill} ripple={ripple} check={check} label={`${d.label}: ${ts.dayState[d.state]}`} />
            <View style={styles.label}>
              <Text numberOfLines={1} style={[ty.dayLabel, styles.labelText, { color: d.isToday ? c.dayLabelToday : c.dayLabel }]}>
                {d.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {pillText && (
        <View pointerEvents="none" style={styles.pillRow}>
          <Animated.View style={[styles.pill, { backgroundColor: f.pillBg, boxShadow: `0 ${m.pillShadowY}px 0 ${f.pillShadow}` }, pillStyle]}>
            <Flame height={m.pillFlameHeight} />
            <Text style={[ty.flarePill, { color: f.pillText }]}>{pillText}</Text>
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}

type DotProps = {
  cell: WeekCell;
  animated: boolean;
  fill: SharedValue<number>;
  ripple: SharedValue<number>;
  check: SharedValue<number>;
  label: string;
};

/** Gün dairesi; bugünün dairesi kutlamada boştan dolar (yeşil dolgu büyür, onay belirir, halka açılıp söner) */
function DayDot({ cell: d, animated, fill, ripple, check, label }: DotProps) {
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scale: fill.get() }] }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: check.get(), transform: [{ scale: 0.4 + 0.6 * check.get() }] }));
  const rippleStyle = useAnimatedStyle(() => {
    const p = ripple.get();
    return { opacity: p <= 0 || p >= 1 ? 0 : 0.9 * (1 - p), transform: [{ scale: 1 + (m.rippleScale - 1) * p }] };
  });
  const color =
    d.state === 'empty' ? c.dayEmpty : d.state === 'saved' ? c.daySaved : d.isToday ? c.dayToday : c.dayDone;
  const ring = d.isToday ? { boxShadow: `0 0 0 ${m.dayRing}px ${c.dayTodayRing}` } : null;

  if (animated) {
    return (
      <View accessible accessibilityLabel={label} style={[styles.dot, { backgroundColor: c.dayEmpty }, ring]}>
        <Animated.View style={[styles.ripple, { borderColor: f.ripple }, rippleStyle]} />
        <Animated.View style={[styles.dotFill, { backgroundColor: color }, fillStyle]} />
        <Animated.View style={checkStyle}>
          <CheckIcon color={c.dayCheck} size={m.dayCheckSize} strokeWidth={m.dayCheckStroke} />
        </Animated.View>
      </View>
    );
  }
  return (
    <View accessible accessibilityLabel={label} style={[styles.dot, { backgroundColor: color }, ring]}>
      {d.state === 'done' ? (
        <CheckIcon color={c.dayCheck} size={m.dayCheckSize} strokeWidth={m.dayCheckStroke} />
      ) : d.state === 'saved' ? (
        <SolidDropIcon color={c.daySavedDrop} size={m.dayDropSize} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.streakCardTop,
    paddingVertical: m.streakCardPaddingY,
    paddingHorizontal: m.streakCardPaddingX,
    borderRadius: m.streakCardRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.streakCardGap,
  },
  glow: {
    position: 'absolute',
    top: -m.glowInset,
    left: -m.glowInset,
    right: -m.glowInset,
    bottom: -m.glowInset,
    borderRadius: m.streakCardRadius + m.glowInset,
    borderWidth: m.glowBorder,
    borderColor: f.glow,
    boxShadow: `0 0 ${m.glowBlur}px ${f.glow}`,
  },
  column: {
    width: m.streakColumnFlame,
    alignItems: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.flameNumberGap,
  },
  flameBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heat: {
    position: 'absolute',
    width: m.heatSize,
    height: m.heatSize,
  },
  numberBox: {
    overflow: 'hidden',
  },
  sizer: {
    opacity: 0,
  },
  number: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    textAlign: 'center',
  },
  plus: {
    position: 'absolute',
    top: m.plusTop,
    right: m.plusRight,
    paddingHorizontal: m.plusPaddingX,
    paddingVertical: m.plusPaddingY,
    borderRadius: 999,
  },
  week: {
    flex: 1,
    flexDirection: 'row',
    gap: m.weekGap,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: m.weekGap,
  },
  // "Bugün" sütundan geniş; tasarımdaki gibi iki yana taşar
  label: {
    width: m.dayLabelWidth,
    alignItems: 'center',
  },
  labelText: {
    textAlign: 'center',
  },
  dot: {
    width: m.dayDot,
    height: m.dayDot,
    borderRadius: m.dayDot / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: m.dayDot / 2,
  },
  ripple: {
    position: 'absolute',
    top: -m.dayRing,
    left: -m.dayRing,
    right: -m.dayRing,
    bottom: -m.dayRing,
    borderRadius: m.dayDot / 2 + m.dayRing,
    borderWidth: m.rippleBorder,
  },
  pillRow: {
    position: 'absolute',
    top: m.pillTop,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.pillGapFlame,
    paddingLeft: m.pillPaddingLeft,
    paddingRight: m.pillPaddingRight,
    paddingTop: m.pillPaddingYTop,
    paddingBottom: m.pillPaddingYBottom,
    borderRadius: 999,
  },
});
