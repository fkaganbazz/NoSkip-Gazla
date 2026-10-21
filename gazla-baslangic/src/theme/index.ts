import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorRoles } from './colors';

export {
  avatarTints,
  challengeTints,
  selfAvatarTints,
  type AvatarTint,
  type ChallengeTint,
  type Tint,
} from './accents';
export { avatarInitialStyle, cardColors, cardMetrics, cardTypography, categoryTint, categoryTints, customChallengeTint, type CardColors, type CategoryTileSize } from './cards';
export { darkColors, lightColors, palette, type ColorRoles } from './colors';
export { componentColors, componentMetrics, componentTypography, type ComponentColors } from './components';
export { dikenColors } from './diken';
export { actionSheetMetrics, actionSheetTypography, sheetColors, sheetDikenMetrics, sheetMetrics, type SheetColors } from './sheet';
export { speechBubbleColors, speechBubbleMetrics, speechBubbleTypography, type SpeechBubbleColors } from './speechBubble';
export { borderWidth, iconMetrics, layout, radius, spacing } from './spacing';
export { tabBarColors, tabBarMetrics, type TabBarColors } from './tabBar';
export { todayColors, todayMetrics, todayTypography, type TodayColors } from './today';
export { fontAssets, fonts, typography, type TypographyVariant } from './typography';

export type ColorScheme = 'light' | 'dark';

export const colorsFor = (scheme: ColorScheme): ColorRoles =>
  scheme === 'dark' ? darkColors : lightColors;

/**
 * Alt ağacı temadan bağımsız sabit bir modda çizer: `<SchemeProvider value="dark">` içindeki her `useTheme()`
 * koyu döner (ör. iki modda koyu PhotoProof'tan açılan alt sayfa: `Sheet scheme="dark"`). `null` sistem moduna döner.
 */
const SchemeContext = createContext<ColorScheme | null>(null);
export const SchemeProvider = SchemeContext.Provider;

/** Sistemin (ya da üstteki `SchemeProvider`ın) açık/koyu moduna göre anlamsal renkleri döner. */
export function useTheme() {
  const system: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const scheme: ColorScheme = useContext(SchemeContext) ?? system;
  return { scheme, isDark: scheme === 'dark', colors: colorsFor(scheme) };
}
