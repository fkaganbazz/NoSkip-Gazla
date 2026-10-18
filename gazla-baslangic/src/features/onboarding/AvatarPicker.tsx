import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { CameraIcon } from '@/components/icons';
import { upperTr } from '@/components/ui';
import { typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

type Props = {
  name: string;
  uri: string | null;
  onChange: (uri: string | null) => void;
};

// Profil fotoğrafı satırı (Profile.dc.html): 84 px baş harfli avatar, sağ altta kamera butonu.
// Fotoğraf isteğe bağlı; seçilen dosya profil tamamlanınca yüklenir.
export default function AvatarPicker({ name, uri, onChange }: Props) {
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const initial = name.trim() ? upperTr(name.trim().charAt(0)) : '';

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
  };

  return (
    <View style={styles.row}>
      <View style={styles.avatarBox}>
        <View style={[styles.avatar, { backgroundColor: c.avatarBg }]}>
          {uri ? (
            <Image source={{ uri }} style={styles.photo} accessibilityLabel="Profil fotoğrafın" />
          ) : (
            <Text style={[t.avatarInitial, { color: c.avatarInk }]}>{initial}</Text>
          )}
        </View>
        <Pressable
          onPress={pick}
          accessibilityRole="button"
          accessibilityLabel={uri ? 'Profil fotoğrafını değiştir' : 'Profil fotoğrafı ekle'}
          hitSlop={4}
          style={({ pressed }) => [
            styles.camera,
            { backgroundColor: c.cameraBg, borderColor: colors.background, opacity: pressed ? 0.85 : 1 },
          ]}>
          <CameraIcon color={c.cameraIcon} size={m.cameraIconSize} strokeWidth={m.cameraIconStroke} />
        </Pressable>
      </View>
      <View style={styles.texts}>
        <Text style={[typography.cardTitle, { color: colors.text }]}>Profil fotoğrafı</Text>
        <Text style={[t.avatarNote, { color: colors.textSecondary }]}>İstersen sonra da ekleyebilirsin.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: m.avatarRowMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.avatarRowGap,
  },
  avatarBox: {
    width: m.avatarSize,
    height: m.avatarSize,
  },
  avatar: {
    width: m.avatarSize,
    height: m.avatarSize,
    borderRadius: m.avatarSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: m.avatarSize,
    height: m.avatarSize,
  },
  camera: {
    position: 'absolute',
    right: m.cameraOffset,
    bottom: m.cameraOffset,
    width: m.cameraSize,
    height: m.cameraSize,
    borderRadius: m.cameraSize / 2,
    borderWidth: m.cameraBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: m.avatarTextGap,
  },
});
