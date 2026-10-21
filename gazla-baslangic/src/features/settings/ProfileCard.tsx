import { StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Avatar, Card } from '@/components/ui';
import type { Profile } from '@/data';
import { typography, useTheme } from '@/theme';
import { settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

/**
 * Ayarlar üstündeki profil kartı (ortak basılabilir Card): avatar, ad, "@kullanıcı · Profili düzenle".
 * Avatar rengi veriye bağlı; kendi avatarın olduğu için şeftali tonu tasarımdaki #FFE3D2 (`self`).
 */
export default function ProfileCard({ profile, onPress }: { profile: Profile; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} accessibilityLabel={`${profile.displayName}, profili düzenle`} style={styles.card}>
      <Avatar
        name={profile.displayName}
        tint={profile.avatarTint}
        self
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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.profileCardMarginTop,
    paddingVertical: m.profileCardPaddingY,
    paddingHorizontal: m.profileCardPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.profileCardGap,
  },
  texts: {
    flex: 1,
  },
});
