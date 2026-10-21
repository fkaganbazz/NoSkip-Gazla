/**
 * İskelet (yükleniyor) görünümü. Components.dc.html'de çizilmedi; tasarım dili: kart yüzeyi + 1 px kenar,
 * kart köşesi 22, yer tutucular ikincil yüzeyde (`surfaceMuted`), hafif nabız (opaklık, reanimated).
 * "Hareketi azalt" açıksa nabız yok.
 *
 *   import { Skeleton, SkeletonPulse, SkeletonTaskCard } from '@/components/ui';
 *   <Skeleton width={120} height={13} />          // tek blok (kendi nabzıyla)
 *   <SkeletonTaskCard />                           // Bugün görev kartı ölçüsünde (Today.dc.html)
 *   <SkeletonPulse>…düz yer tutucular…</SkeletonPulse>  // birden çok bloğu birlikte nabızlat
 *
 * Ekran, iskeleti saran görünüme `accessibilityLabel="Yükleniyor"` verir; bloklar ekran okuyucuya kapalı.
 */
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { borderWidth, cardColors, cardMetrics as cm, cardTypography, componentMetrics, radius, useTheme } from '@/theme';

type PulseProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** İçindeki her şeyi birlikte nabızlatır (opaklık 1 ↔ en düşük nabız opaklığı) */
export function SkeletonPulse({ children, style }: PulseProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      opacity.set(1);
      return;
    }
    // Tam opaklıktan en düşük nabız opaklığına iner ve döner (süre bir yön)
    opacity.set(
      withRepeat(
        withTiming(componentMetrics.skeletonPulseMinOpacity, {
          duration: componentMetrics.skeletonPulseDurationMs,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [reduced, opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[style, animated]}>
      {children}
    </Animated.View>
  );
}

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  /** Köşe; verilmezse tam yuvarlak (metin satırı) */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Tek yer tutucu blok (ikincil yüzey), kendi nabzıyla */
export function Skeleton({ width = '100%', height, radius: r = radius.full, style }: SkeletonProps) {
  const { colors } = useTheme();
  return <SkeletonPulse style={[{ width, height, borderRadius: r, backgroundColor: colors.surfaceMuted }, style]} />;
}

/** Nabızsız düz blok (SkeletonPulse içinde kullanılır) */
function Bone({ width = '100%', height, radius: r = radius.full, style }: SkeletonProps) {
  const { colors } = useTheme();
  return <View style={[{ width, height, borderRadius: r, backgroundColor: colors.surfaceMuted }, style]} />;
}

/**
 * Görev kartı iskeleti (TaskCard ölçüleri: 72 yükseklik, köşe 22, 44 karo, başlık + alt bilgi + 6 px çubuk,
 * sağda 52 daire). Metin satırları yazı boyu kalınlığında.
 */
export function SkeletonTaskCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors, scheme } = useTheme();
  const c = cardColors[scheme];
  const tileRadius = cm.categoryTile[cm.taskTile].radius;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          boxShadow: c.taskCardShadow ? `0 ${cm.taskShadowY}px ${cm.taskShadowBlur}px ${c.taskCardShadow}` : undefined,
        },
        style,
      ]}>
      <SkeletonPulse style={styles.row}>
        <Bone width={cm.taskTile} height={cm.taskTile} radius={tileRadius} />
        <View style={styles.texts}>
          <Bone width="72%" height={cardTypography.taskTitle.fontSize} />
          <Bone width="46%" height={cardTypography.taskMeta.fontSize ?? cardTypography.taskTitle.fontSize} />
          <Bone height={cm.progressHeight} />
        </View>
        <Bone width={cm.actionSize} height={cm.actionSize} />
      </SkeletonPulse>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: cm.taskHeight,
    paddingLeft: cm.taskPaddingLeft,
    paddingRight: cm.taskPaddingRight,
    borderRadius: cm.taskRadius,
    borderWidth: borderWidth.thin,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.taskInnerGap,
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: cm.taskTextGap,
  },
});
