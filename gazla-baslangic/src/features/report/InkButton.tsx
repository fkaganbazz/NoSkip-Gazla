import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { flatShadowStyle } from '@/components/FlatShadow';
import { componentMetrics as cm, componentTypography, layout, radius, useTheme } from '@/theme';
import { socialColors } from '@/theme/social';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
};

// Koyu tok buton: gece moru zemin, kum metin, altta 4 px gölge (Report.dc.html "Şikayeti gönder").
export default function InkButton({ title, onPress, loading }: Props) {
  const { scheme } = useTheme();
  const c = socialColors[scheme];
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: c.inkButtonBg },
        pressed
          ? { transform: [{ translateY: cm.buttonShadow }] }
          : flatShadowStyle(cm.buttonShadow, c.inkButtonShadow),
      ]}>
      {loading ? (
        <ActivityIndicator color={c.inkButtonText} />
      ) : (
        <Text style={[componentTypography.button, { color: c.inkButtonText }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: layout.buttonHeight,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
