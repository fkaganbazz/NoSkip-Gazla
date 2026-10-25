import { StyleSheet, Text, View } from 'react-native';

import { Avatar, IconButton } from '@/components/ui';
import type { Profile } from '@/data';
import { useT } from '@/i18n';
import { typography, useTheme } from '@/theme';
import { gardenMetrics as m } from '@/theme/garden';

import { GearIcon } from './icons';

type Props = {
  profile: Profile;
  onSettings: () => void;
};

// Profil satırı: avatar, "Deniz'in bahçesi", kullanıcı adı ve ayarlar (Garden.dc.html).
export default function GardenHeader({ profile, onSettings }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const sub = t.garden.header.sub(profile.username, profile.harshMode);

  return (
    <View style={styles.row}>
      <Avatar name={profile.displayName} tint={profile.avatarTint} self url={profile.avatarUrl} size={m.avatarSize} />
      <View style={styles.texts}>
        <Text accessibilityRole="header" numberOfLines={2} style={[typography.screenTitle, { color: colors.text }]}>
          {t.garden.header.title(profile.displayName)}
        </Text>
        <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary }]}>
          {sub}
        </Text>
      </View>
      <IconButton
        icon={GearIcon}
        accessibilityLabel={t.common.settings}
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
