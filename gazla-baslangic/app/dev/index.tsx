import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderWidth, layout, radius, spacing, typography, useTheme } from '@/theme';

const SCREENS: { href: Href; title: string; detail: string }[] = [
  { href: '/dev/tokens', title: 'Renk ve yazı', detail: 'Tokens.dc.html · yazı ölçeği, renkler, boşluk' },
  { href: '/dev/diken', title: 'Diken', detail: 'Diken.dc.html · tüm ifadeler, aşamalar, aksesuarlar' },
];

export default function DevIndex() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: layout.screenPadding + insets.bottom }]}>
      {SCREENS.map((screen) => (
        // Link asChild kullanılmıyor: Slot, Pressable'ın stil fonksiyonunu birleştirirken düşürüyor.
        <Pressable
          key={screen.title}
          onPress={() => router.push(screen.href)}
          accessibilityRole="link"
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
