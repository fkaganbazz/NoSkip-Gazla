import { Stack } from 'expo-router';

import { fonts, useTheme } from '@/theme';

// Geliştirme ekranları: başlıklı, geri dönülebilir yığın.
export default function DevLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.extraBold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'Geliştirme' }} />
      <Stack.Screen name="tokens" options={{ title: 'Renk ve yazı' }} />
      <Stack.Screen name="diken" options={{ title: 'Diken' }} />
    </Stack>
  );
}
