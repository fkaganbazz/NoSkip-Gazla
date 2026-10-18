import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { flatShadowStyle } from '@/components/FlatShadow';
import { photoProofColors as c, photoProofMetrics as m, photoProofTypography as t } from '@/theme/checkin';

type Props = {
  title: string;
  onPress: () => void;
  variant: 'retake' | 'send';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
};

// Fotoğraf ekranının koyu tok butonları: "Tekrar çek" (mor) ve "Gönder" (yeşil) — PhotoProof.dc.html.
export default function PhotoButton({ title, onPress, variant, icon, disabled = false, loading = false }: Props) {
  const send = variant === 'send';
  const bg = disabled ? c.disabledBg : send ? c.sendBg : c.retakeBg;
  const ink = disabled ? c.disabledText : send ? c.sendText : c.text;
  const shadow = disabled ? undefined : send ? c.sendShadow : c.retakeShadow;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        pressed && shadow ? { transform: [{ translateY: m.buttonShadow }] } : flatShadowStyle(m.buttonShadow, shadow),
      ]}>
      {loading ? (
        <ActivityIndicator color={ink} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text numberOfLines={1} style={[t.button, { color: ink }]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: m.buttonHeight,
    borderRadius: m.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.buttonGap,
  },
});
