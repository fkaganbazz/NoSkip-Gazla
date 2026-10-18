import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, upperTr } from '@/components/ui';
import type { Profile } from '@/data';
import { avatarTints, borderWidth, typography, useTheme } from '@/theme';
import { gardenMetrics as m, gardenTypography } from '@/theme/garden';

import { GearIcon } from './icons';
import { possessive } from './logic';

type Props = {
  profile: Profile;
  onSettings: () => void;
};

// Profil satırı: avatar, "Deniz'in bahçesi", kullanıcı adı ve ayarlar (Garden.dc.html).
export default function GardenHeader({ profile, onSettings }: Props) {
  const { colors, scheme } = useTheme();
  const t = avatarTints[profile.avatarTint][scheme];
  const sub = `@${profile.username} · Sert mod ${profile.harshMode ? 'açık' : 'kapalı'}`;

  return (
    <View style={styles.row}>
      {profile.avatarUrl ? (
        <Avatar name={profile.displayName} tint={profile.avatarTint} url={profile.avatarUrl} size={m.avatarSize} />
      ) : (
        <View
          accessible
          accessibilityLabel={profile.displayName}
          style={[styles.avatar, { backgroundColor: t.bg }]}>
          <Text style={[gardenTypography.avatarInitial, { color: t.ink }]}>{upperTr(profile.displayName.charAt(0))}</Text>
        </View>
      )}
      <View style={styles.texts}>
        <Text accessibilityRole="header" numberOfLines={2} style={[typography.screenTitle, { color: colors.text }]}>
          {`${possessive(profile.displayName)} bahçesi`}
        </Text>
        <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary }]}>
          {sub}
        </Text>
      </View>
      <Pressable
        onPress={onSettings}
        accessibilityRole="button"
        accessibilityLabel="Ayarlar"
        style={({ pressed }) => [
          styles.settings,
          { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border },
        ]}>
        <GearIcon color={colors.text} size={m.settingsIconSize} strokeWidth={m.settingsIconStrokeWidth} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.headerGap,
  },
  avatar: {
    width: m.avatarSize,
    height: m.avatarSize,
    borderRadius: m.avatarSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  settings: {
    width: m.settingsButton,
    height: m.settingsButton,
    borderRadius: m.settingsButton / 2,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
