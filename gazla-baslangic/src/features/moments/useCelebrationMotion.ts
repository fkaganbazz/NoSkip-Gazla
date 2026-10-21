/**
 * Tamamlama anının hareketi (reanimated): Diken'in giriş zıplaması ve onunla uyumlu konfeti.
 * Bitiş hali tasarımla birebir (konum 0, ölçek 1, konfeti tam görünür). "Hareketi azalt" açıksa
 * değerler baştan bitiş halinde başlar; hiçbir şey oynamaz.
 */
import { useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { momentsMotion as k } from '@/theme/moments';

export function useCelebrationMotion() {
  const reduced = useReducedMotion();
  const lift = useSharedValue(reduced ? 0 : k.enterOffset);
  const scale = useSharedValue(reduced ? 1 : k.enterScale);
  const squash = useSharedValue(1);
  const confetti = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      lift.set(0);
      scale.set(1);
      squash.set(1);
      confetti.set(1);
      return;
    }
    const up = { duration: k.hopUpMs, easing: Easing.out(Easing.quad) };
    const down = { duration: k.hopDownMs, easing: Easing.in(Easing.quad) };
    const hop = () => withSequence(withTiming(-k.hopHeight, up), withTiming(0, down));
    const hops = Array.from({ length: k.hopCount }, (_, i) => (i === 0 ? hop() : withDelay(k.hopGapMs, hop())));
    const enter = { duration: k.enterDurationMs, easing: Easing.out(Easing.back(1.4)) };

    // Giriş: aşağıdan büyüyerek gelir, sonra iki küçük zıplama. Hepsi bir kare gecikmeyle başlar: gecikme
    // olmadan ilk karenin zamanı başlangıçtan önce düşebiliyor (web) ve geri yaylanma eğrisi sıçrıyor.
    // Bekleme her zaman en dışta: sıranın (withSequence) ilk adımı withDelay olursa web'de bekleme
    // sırasında sonraki adım oynuyor.
    const start = k.startDelayMs;
    lift.set(withDelay(start, withSequence(withTiming(0, enter), ...hops)));
    scale.set(withDelay(start, withTiming(1, enter)));

    // Her inişte saksı hafifçe basılır (ölçek tabandan; bkz. Completion transformOrigin)
    const landAt = (i: number) => start + k.enterDurationMs + (i + 1) * (k.hopUpMs + k.hopDownMs) + i * k.hopGapMs;
    const press = () =>
      withSequence(
        withTiming(k.landSquash, { duration: k.landSquashMs, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: k.landSquashMs, easing: Easing.out(Easing.quad) }),
      );
    const presses = Array.from({ length: k.hopCount }, (_, i) =>
      i === 0 ? press() : withDelay(landAt(i) - landAt(i - 1) - 2 * k.landSquashMs, press()),
    );
    squash.set(withDelay(landAt(0), withSequence(...presses)));

    // Konfeti ilk zıplamayla birlikte belirir ve yukarıdan süzülür
    confetti.set(
      withDelay(
        start + k.confettiDelayMs,
        withTiming(1, { duration: k.confettiDurationMs, easing: Easing.out(Easing.cubic) }),
      ),
    );

    return () => {
      cancelAnimation(lift);
      cancelAnimation(scale);
      cancelAnimation(squash);
      cancelAnimation(confetti);
    };
  }, [reduced, lift, scale, squash, confetti]);

  const dikenStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.get() }, { scale: scale.get() }, { scaleY: squash.get() }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confetti.get(),
    transform: [{ translateY: (confetti.get() - 1) * k.confettiDrop }],
  }));

  return { dikenStyle, confettiStyle };
}
