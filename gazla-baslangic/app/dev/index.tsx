import { Link, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { borderWidth, layout, radius, spacing, typography, useTheme } from '@/theme';

const SCREENS: { href: Href; title: string; detail: string }[] = [
  { href: '/dev/tokens', title: 'Renk ve yazı', detail: 'Tokens.dc.html · yazı ölçeği, renkler, boşluk' },
  { href: '/dev/diken', title: 'Diken', detail: 'Diken.dc.html · tüm ifadeler, aşamalar, aksesuarlar' },
];

export default function DevIndex() {
  const { colors } = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {SCREENS.map((screen) => (
        <Link key={screen.title} href={screen.href} asChild>
          <Pressable
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                borderColor: colors.border,
              },
            ]}>
            <View style={styles.texts}>
              <Text style={[typography.cardTitle, { color: colors.text }]}>{screen.title}</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{screen.detail}</Text>
            </View>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: layout.screenPadding,
    gap: spacing.sm,
  },
  row: {
    minHeight: layout.minTouchTarget,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: borderWidth.thin,
  },
  texts: {
    gap: spacing.xxs,
  },
});
