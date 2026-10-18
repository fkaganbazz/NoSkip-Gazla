import { StyleSheet, Text, View, type TextStyle } from 'react-native';

import { upperTr } from '@/components/ui';
import type { AvatarTintKey } from '@/data';
import { avatarTints, useTheme } from '@/theme';

export type Face = { name: string; tint: AvatarTintKey };

type Props = {
  faces: Face[];
  size: number;
  border: number;
  /** Halka rengi: altındaki zemin */
  ringColor: string;
  /** Üst üste binme (negatif) */
  overlap: number;
  textStyle: TextStyle;
};

// Üst üste binen baş harfli avatarlar (ChallengePreview, InviteLanding). Ölçü kenarı içerir (border-box).
export default function FaceStack({ faces, size, border, ringColor, overlap, textStyle }: Props) {
  const { scheme } = useTheme();
  return (
    <View style={styles.row} accessible accessibilityLabel={faces.map((f) => f.name).join(', ')}>
      {faces.map((f, i) => {
        const t = avatarTints[f.tint][scheme];
        return (
          <View
            key={`${f.name}-${i}`}
            style={[
              styles.face,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: border,
                borderColor: ringColor,
                backgroundColor: t.bg,
                marginLeft: i === 0 ? 0 : overlap,
              },
            ]}>
            <Text style={[textStyle, { color: t.ink }]}>{upperTr(f.name.charAt(0))}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
