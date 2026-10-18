import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

import { THEME_OPTIONS, type ThemePreference } from './themePreference';

/** Görünüm seçici: Açık / Koyu / Sistem (Settings.dc.html; UI kitindeki Segmented'den 2 px yüksek) */
export default function ThemePicker({ value, onChange }: { value: ThemePreference; onChange: (v: ThemePreference) => void }) {
  const { colors, scheme } = useTheme();
  const c = settingsColors[scheme];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Tema" style={[styles.track, { backgroundColor: c.themeTrack }]}>
      {THEME_OPTIONS.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[styles.cell, on && { backgroundColor: c.themeThumb, boxShadow: `0 1px 3px ${c.themeShadow}` }]}>
            <Text style={[t.themeCell, { color: on ? colors.text : colors.textSecondary }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    marginTop: m.groupMarginTop,
    flexDirection: 'row',
    gap: m.themeTrackPadding,
    padding: m.themeTrackPadding,
    borderRadius: m.themeTrackRadius,
  },
  cell: {
    flex: 1,
    height: m.themeCellHeight,
    borderRadius: m.themeCellRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
