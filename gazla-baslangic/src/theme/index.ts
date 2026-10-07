import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorRoles } from './colors';

export {
  avatarTints,
  challengeTints,
  type AvatarTint,
  type ChallengeTint,
  type Tint,
} from './accents';
export { darkColors, lightColors, palette, type ColorRoles } from './colors';
export { dikenColors } from './diken';
export { borderWidth, iconMetrics, layout, radius, spacing } from './spacing';
export { tabBarColors, tabBarMetrics, type TabBarColors } from './tabBar';
export { todayColors, todayMetrics, todayTypography, type TodayColors } from './today';
export { fontAssets, fonts, typography, type TypographyVariant } from './typography';

export type ColorScheme = 'light' | 'dark';

export const colorsFor = (scheme: ColorScheme): ColorRoles =>
  scheme === 'dark' ? darkColors : lightColors;

/** Sistemin açık/koyu moduna göre anlamsal renkleri döner. */
export function useTheme() {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, isDark: scheme === 'dark', colors: colorsFor(scheme) };
}
