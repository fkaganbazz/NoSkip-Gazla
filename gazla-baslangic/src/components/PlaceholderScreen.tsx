import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { borderWidth, layout, radius, spacing, typography, useTheme } from '@/theme';

type Props = {
  title: string;
  /** Tasarım dosyası, ör. "Explore.dc.html" */
  design: string;
};

// Henüz uygulanmamış ekranlar için geçici içerik. Geliştirme sürümünde dev ekranlarına bağlantı da var.
export default function PlaceholderScreen({ title, design }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.content}>
        <Text style={[typography.title1, { color: colors.text }]}>{title}</Text>
        <Text style={[typography.body, { color: colors.textBody }]}>
          Bu ekran sıradaki adımlarda {design} dosyasına göre uygulanacak.
        </Text>
        {__DEV__ && (
          <Pressable
            onPress={() => router.push('/dev')}
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.devLink,
              {
                backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
                borderColor: colors.border,
              },
            ]}>
            <Text style={[typography.cardTitle, { color: colors.text }]}>Geliştirme ekranları</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: layout.screenPadding,
    gap: spacing.sm,
  },
  devLink: {
    minHeight: layout.minTouchTarget,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.card,
    borderWidth: borderWidth.thin,
  },
});
