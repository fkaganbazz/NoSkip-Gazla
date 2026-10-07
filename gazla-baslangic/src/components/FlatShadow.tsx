/**
 * Düz alt gölge — tasarımdaki `box-shadow: 0 Ypx 0 renk` (tok butonlar).
 * RN `boxShadow` Android 9 (API 28) altında çizilmiyor; orada gölge, butonun arkasında
 * aynı ölçüde bir View olarak çizilir. Diğer platformlarda tasarımdaki gölge aynen kullanılır.
 */
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

export const BOX_SHADOW_SUPPORTED = !(
  Platform.OS === 'android' &&
  typeof Platform.Version === 'number' &&
  Platform.Version < 28
);

/** Butonun kendi stiline eklenir; gölge desteklenmiyorsa veya renk yoksa hiçbir şey eklemez. */
export function flatShadowStyle(offset: number, color: string | undefined): ViewStyle | undefined {
  return BOX_SHADOW_SUPPORTED && color ? { boxShadow: `0 ${offset}px 0 ${color}` } : undefined;
}

type UnderlayProps = {
  offset: number;
  color: string | undefined;
  size: number;
  radius: number;
};

/** Butonla aynı çerçevede, butondan önce render edilir; yalnızca boxShadow desteklenmezse çizer. */
export function FlatShadowUnderlay({ offset, color, size, radius }: UnderlayProps) {
  if (BOX_SHADOW_SUPPORTED || !color) {
    return null;
  }
  return (
    <View
      style={[
        styles.underlay,
        { top: offset, width: size, height: size, borderRadius: radius, backgroundColor: color },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  underlay: {
    position: 'absolute',
    left: 0,
    pointerEvents: 'none',
  },
});
