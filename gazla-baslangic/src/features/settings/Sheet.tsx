/**
 * Ayarlar içi alt sayfa (seçenek listesi, profil düzenleme, bilgi). Tasarımda açık hali çizilmedi;
 * Tokens/CLAUDE.md alt sayfa kuralı: yüzey, üst köşeler 28, kenar boşluğu 20.
 */
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, radius, typography, useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m } from '@/theme/settings';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export default function Sheet({ visible, onClose, title, children }: Props) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: settingsColors[scheme].backdrop }]}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              maxHeight: height * m.sheetMaxHeightRatio,
              paddingBottom: insets.bottom + layout.screenPadding,
            },
          ]}>
          <Text accessibilityRole="header" style={[typography.title2, { color: colors.text }]}>
            {title}
          </Text>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: m.sheetPaddingTop,
    paddingHorizontal: layout.screenPadding,
    gap: m.groupMarginTop,
  },
  body: {
    paddingTop: m.groupMarginTop,
    // Butonun alttaki düz gölgesi kırpılmasın
    paddingBottom: layout.buttonShadowOffset,
  },
});
