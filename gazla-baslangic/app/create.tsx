import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons';
import { borderWidth, iconMetrics, layout, spacing, typography, useTheme } from '@/theme';

// Yeni challenge — tam ekran modal (alt menüdeki + butonu). Başlık satırı Create.dc.html'den;
// formun kendisi sıradaki adımlarda uygulanacak.

export default function CreateScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          style={[styles.close, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <CloseIcon
            color={colors.text}
            size={iconMetrics.closeSize}
            strokeWidth={iconMetrics.closeStrokeWidth}
          />
        </Pressable>
        <Text style={[typography.screenTitle, styles.title, { color: colors.text }]}>Yeni challenge</Text>
      </View>
      <Text style={[typography.body, styles.body, { color: colors.textBody }]}>
        Form sıradaki adımlarda Create.dc.html dosyasına göre uygulanacak.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: layout.screenTopGap,
  },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: layout.minTouchTarget / 2,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  body: {
    marginTop: spacing.md,
  },
});
