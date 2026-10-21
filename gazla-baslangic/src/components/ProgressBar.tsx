import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { cardColors, cardMetrics as m, useTheme } from '@/theme';

type Props = {
  /** 0–1 arası ilerleme */
  value: number;
  /** Dolgu rengi (varsayılan Diken yeşili) */
  color?: string;
  /** Zemin rengi (varsayılan #F1E9DF; koyuda çizgi rengi) */
  trackColor?: string;
  /** Yükseklik (varsayılan 6); köşe yüksekliğin yarısı */
  height?: number;
  /** Verilirse ekran okuyucuya ilerleme çubuğu olarak okunur; yoksa süs sayılır */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// İnce ilerleme çubuğu (Today.dc.html görev kartı: 6 px, köşe 3, zemin #F1E9DF, dolgu #3BAE6A).
export function ProgressBar({ value, color, trackColor, height = m.progressHeight, accessibilityLabel, style }: Props) {
  const { scheme } = useTheme();
  const c = cardColors[scheme];
  const ratio = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const shape = { height, borderRadius: height / 2 };

  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'progressbar' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityLabel ? { min: 0, max: 100, now: Math.round(ratio * 100) } : undefined}
      style={[styles.track, shape, { backgroundColor: trackColor ?? c.progressTrack }, style]}>
      <View style={[shape, { width: `${ratio * 100}%`, backgroundColor: color ?? c.progressFill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
});
