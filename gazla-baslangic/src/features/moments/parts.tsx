/**
 * An ekranlarının ortak parçaları: kapat butonu, renkli tok buton, metin buton, avatar yığını.
 * Ortak `Button`/`IconButton` bu ekranlardaki renklerle (kum zeminli yeşil buton, yarı saydam kapat) uyuşmuyor.
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { flatShadowStyle } from '@/components/FlatShadow';
import { CloseIcon } from '@/components/icons';
import { upperTr } from '@/components/ui';
import type { AvatarTintKey } from '@/data';
import { momentsMetrics as m, momentsTypography as t } from '@/theme/moments';
import { avatarTints, borderWidth, useTheme } from '@/theme';

export function CloseButton({
  onPress,
  bg,
  color,
  borderColor,
}: {
  onPress: () => void;
  bg: string;
  color: string;
  /** Finished: kart kenarı; diğerlerinde kenar yok */
  borderColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Kapat"
      style={({ pressed }) => [
        styles.close,
        { backgroundColor: bg, opacity: pressed ? 0.8 : 1 },
        borderColor ? { borderWidth: borderWidth.thin, borderColor } : null,
      ]}>
      <CloseIcon color={color} size={m.closeIconSize} strokeWidth={m.closeIconStroke} />
    </Pressable>
  );
}

type SolidButtonProps = {
  title: string;
  onPress?: () => void;
  bg: string;
  text: string;
  shadow?: string;
  height?: number;
  icon?: ReactNode;
  /** Metnin sağındaki öğe ("30 sn" rozeti) */
  trailing?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Tok buton: altta 4 px düz gölge, basılınca gölge kadar iner */
export function SolidButton({
  title,
  onPress,
  bg,
  text,
  shadow,
  height = m.buttonHeight,
  icon,
  trailing,
  loading,
  disabled,
  accessibilityLabel,
  style,
}: SolidButtonProps) {
  const inactive = !!loading || !!disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.solid,
        { height, backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
        pressed && shadow ? { transform: [{ translateY: m.buttonShadow }] } : flatShadowStyle(m.buttonShadow, shadow),
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <>
          {icon}
          <Text style={[t.button, { color: text }]}>{title}</Text>
          {trailing}
        </>
      )}
    </Pressable>
  );
}

/** Altta metin buton (48 yükseklik) */
export function TextButton({
  title,
  onPress,
  color,
  height = m.linkHeight,
  small,
}: {
  title: string;
  onPress: () => void;
  color: string;
  height?: number;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.link, { height, opacity: pressed ? 0.7 : 1 }]}>
      <Text style={[small ? t.linkSmall : t.link, { color }]}>{title}</Text>
    </Pressable>
  );
}

type Face = { id: string; name: string; tint: AvatarTintKey };

/** Üst üste binen avatarlar (kenarı zemin renginde) */
export function FaceStack({
  faces,
  size,
  borderColor,
  small,
}: {
  faces: Face[];
  size: number;
  borderColor: string;
  small?: boolean;
}) {
  const { scheme } = useTheme();
  return (
    <View style={styles.stack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {faces.map((f, i) => {
        const tint = avatarTints[f.tint][scheme];
        return (
          <View
            key={f.id}
            style={[
              styles.face,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor,
                backgroundColor: tint.bg,
                marginLeft: i === 0 ? 0 : m.stackOverlap,
              },
            ]}>
            <Text style={[small ? t.stackInitialSmall : t.stackInitial, { color: tint.ink }]}>
              {upperTr(f.name.charAt(0))}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  close: {
    width: m.closeButton,
    height: m.closeButton,
    borderRadius: m.closeButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: {
    borderRadius: m.buttonRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.buttonGap,
    paddingHorizontal: m.buttonPaddingX,
  },
  link: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    flexDirection: 'row',
  },
  face: {
    borderWidth: m.stackBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
