import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Avatar } from '@/components/ui';
import type { Profile } from '@/data';
import { borderWidth, radius, typography, useTheme } from '@/theme';
import { settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

/**
 * Ayarlar üstündeki profil kartı: avatar, ad, "@kullanıcı · Profili düzenle".
 * Avatar rengi veriye bağlı (`avatarTints`); tasarımdaki #FFE3D2 sabit örnek rengiydi.
 */
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
      <Avatar
        name={profile.displayName}
        tint={profile.avatarTint}
        url={profile.avatarUrl}
        size={m.profileAvatar}
        decorative
      />
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
