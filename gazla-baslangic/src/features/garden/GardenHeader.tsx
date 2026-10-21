import { StyleSheet, Text, View } from 'react-native';

import { Avatar, IconButton } from '@/components/ui';
import type { Profile } from '@/data';
import { typography, useTheme } from '@/theme';
import { gardenMetrics as m } from '@/theme/garden';

import { GearIcon } from './icons';
import { possessive } from './logic';

type Props = {
  profile: Profile;
  onSettings: () => void;
};

// Profil satırı: avatar, "Deniz'in bahçesi", kullanıcı adı ve ayarlar (Garden.dc.html).
export default function GardenHeader({ profile, onSettings }: Props) {
  const { colors } = useTheme();
  const sub = `@${profile.username} · Sert mod ${profile.harshMode ? 'açık' : 'kapalı'}`;

  return (
    <View style={styles.row}>
      <Avatar name={profile.displayName} tint={profile.avatarTint} self url={profile.avatarUrl} size={m.avatarSize} />
      <View style={styles.texts}>
        <Text accessibilityRole="header" numberOfLines={2} style={[typography.screenTitle, { color: colors.text }]}>
          {`${possessive(profile.displayName)} bahçesi`}
        </Text>
        <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary }]}>
          {sub}
        </Text>
      </View>
      <IconButton
        icon={GearIcon}
        accessibilityLabel="Ayarlar"
        onPress={onSettings}
        iconStrokeWidth={m.settingsIconStrokeWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.headerGap,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
});
