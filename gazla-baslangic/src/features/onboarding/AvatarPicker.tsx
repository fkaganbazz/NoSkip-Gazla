import * as ImagePicker from 'expo-image-picker';
import { StyleSheet, Text, View } from 'react-native';

import { CameraIcon } from '@/components/icons';
import { Avatar, IconButton } from '@/components/ui';
import { componentColors, componentMetrics as cm, typography, useTheme } from '@/theme';
import { onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

type Props = {
  name: string;
  uri: string | null;
  onChange: (uri: string | null) => void;
};

// Profil fotoğrafı satırı (Profile.dc.html): 84 px baş harfli avatar, sağ altta kamera butonu.
// Fotoğraf isteğe bağlı; seçilen dosya profil tamamlanınca yüklenir.
export default function AvatarPicker({ name, uri, onChange }: Props) {
  const { colors, scheme } = useTheme();
  const camera = cm.cameraBadge;

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
        {/* Fotoğraf yoksa yalnızca baş harf: ekran okuyucuya ad alanı yeterli */}
        <Avatar
          name={name.trim()}
          tint="peach"
          self
          url={uri}
          size={m.avatarSize}
          accessibilityLabel="Profil fotoğrafın"
          decorative={!uri}
        />
        {/* Kamera rozeti: dış 36 (3 px ekran zemini kenarı dahil), dokunma alanı 44 */}
        <IconButton
          icon={CameraIcon}
          tone="ink"
          size={camera.size}
          outlineColor={colors.background}
          iconSize={camera.iconSize}
          iconStrokeWidth={camera.iconStroke}
          iconColor={componentColors[scheme].cameraBadgeIcon}
          accessibilityLabel={uri ? 'Profil fotoğrafını değiştir' : 'Profil fotoğrafı ekle'}
          onPress={pick}
          style={styles.camera}
        />
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
  camera: {
    position: 'absolute',
    right: cm.cameraBadge.offset,
    bottom: cm.cameraBadge.offset,
  },
  texts: {
    flex: 1,
    gap: m.avatarTextGap,
  },
});
