import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, typography, useTheme } from '@/theme';
import { onboardingMetrics as m } from '@/theme/onboarding';

type Props = {
  children: ReactNode;
  /** Alttaki butonlar (tasarımda margin-top: auto ile ekranın dibinde) */
  footer?: ReactNode;
  footerGap?: number;
  backgroundColor?: string;
  paddingBottom?: number;
};

// Onboarding adım ekranlarının iskeleti: üstte güvenli alan + 9, kenarlar 20, altta butonlar.
// Kısa ekranlarda ve klavye açıkken içerik kayar.
export default function StepScreen({
  children,
  footer,
  footerGap = m.bottomButtonsGap,
  backgroundColor,
  paddingBottom = m.screenPaddingBottom,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: backgroundColor ?? colors.background }]}>
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + layout.screenTopGap, paddingBottom: Math.max(insets.bottom, paddingBottom) },
        ]}>
        {children}
        {footer && <View style={[styles.footer, { gap: footerGap }]}>{footer}</View>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Adım başlığı ve açıklaması (Baloo 30 + gövde 15) */
export function StepIntro({
  title,
  body,
  marginTop = m.introMarginTop,
}: {
  title: string;
  body: string;
  marginTop?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.intro, { marginTop }]}>
      <Text accessibilityRole="header" style={[typography.title1, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[typography.body, { color: colors.textBody }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: m.introGap,
  },
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: layout.screenPadding,
  },
});
