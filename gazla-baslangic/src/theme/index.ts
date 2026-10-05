import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorRoles } from './colors';

export { darkColors, lightColors, palette, type ColorRoles } from './colors';
export { dikenColors } from './diken';
export { borderWidth, layout, radius, spacing } from './spacing';
export { fontAssets, fonts, typography, type TypographyVariant } from './typography';

export type ColorScheme = 'light' | 'dark';

export const colorsFor = (scheme: ColorScheme): ColorRoles =>
  scheme === 'dark' ? darkColors : lightColors;

/** Sistemin açık/koyu moduna göre anlamsal renkleri döner. */
export function useTheme() {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, isDark: scheme === 'dark', colors: colorsFor(scheme) };
}
