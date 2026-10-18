import { Pressable, StyleSheet, Text } from 'react-native';

import { flatShadowStyle } from '@/components/FlatShadow';
import { challengeColors, challengeMetrics as m, challengeTypography as t } from '@/theme/challenge';
import { useTheme } from '@/theme';

import { HandIcon } from './icons';

// Alttaki turuncu "Ece'yi dürt" butonu: 56 yükseklik, 17 yazı (ortak poke butonu 52/16).
export default function PokeCta({ title, onPress }: { title: string; onPress: () => void }) {
  const { colors, scheme } = useTheme();
  const shadow = challengeColors[scheme].pokeShadow;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.accent },
        pressed ? { transform: [{ translateY: m.ctaShadow }] } : flatShadowStyle(m.ctaShadow, shadow),
      ]}>
      <HandIcon color={colors.onAccent} size={m.ctaIconSize} strokeWidth={m.ctaIconStroke} />
      <Text style={[t.cta, { color: colors.onAccent }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: m.ctaHeight,
    borderRadius: m.ctaRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.ctaGap,
  },
});
