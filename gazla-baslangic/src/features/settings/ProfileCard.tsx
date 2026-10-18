import { Image, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { upperTr } from '@/components/ui';
import type { Profile } from '@/data';
import { avatarTints, borderWidth, radius, typography, useTheme } from '@/theme';
import { settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

type AvatarProps = {
  profile: Pick<Profile, 'displayName' | 'avatarTint'>;
  /** Fotoğraf adresi (yeni seçilen yerel dosya da olabilir) */
  url: string | null;
  size: number;
  initialStyle: TextStyle;
};

/**
 * Ayarlar/Profil avatarı: Baloo baş harf (UI kitindeki Avatar Nunito kullanıyor).
 * Renk veriye bağlı (`avatarTints`); tasarımdaki #FFE3D2 sabit örnek rengiydi.
 */
export function ProfileAvatar({ profile, url, size, initialStyle }: AvatarProps) {
  const { scheme } = useTheme();
  const tint = avatarTints[profile.avatarTint][scheme];
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: tint.bg }]}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[initialStyle, { color: tint.ink }]}>{upperTr(profile.displayName.charAt(0))}</Text>
      )}
    </View>
  );
}

/** Ayarlar üstündeki profil kartı: avatar, ad, "@kullanıcı · Profili düzenle" */
export default function ProfileCard({ profile, onPress }: { profile: Profile; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${profile.displayName}, profili düzenle`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border },
      ]}>
      <ProfileAvatar profile={profile} url={profile.avatarUrl} size={m.profileAvatar} initialStyle={t.profileInitial} />
      <View style={styles.texts}>
        <Text numberOfLines={1} style={[t.profileName, { color: colors.text }]}>
          {profile.displayName}
        </Text>
        <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary }]}>
          @{profile.username} · Profili düzenle
        </Text>
      </View>
      <ChevronRightIcon color={colors.textSecondary} size={m.profileChevronSize} strokeWidth={m.chevronStrokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  card: {
    marginTop: m.profileCardMarginTop,
    paddingVertical: m.profileCardPaddingY,
    paddingHorizontal: m.profileCardPaddingX,
    borderRadius: radius.card,
    borderWidth: borderWidth.thin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.profileCardGap,
  },
  texts: {
    flex: 1,
  },
});
