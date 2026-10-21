import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, IconButton, LoadingState, upperTr } from '@/components/ui';
import { useBlockUserMutation, useFriendProfile, useRemoveFriendshipMutation, type FriendProfile } from '@/data';
import ActionSheet, { type SheetConfirm, type SheetItem } from '@/features/friends/ActionSheet';
import { BlockIcon, DotsIcon, FlagIcon, PokeHandIcon, UserMinusIcon } from '@/features/friends/icons';
import { SectionTitle } from '@/features/friends/list';
import { toAccusative } from '@/features/friends/names';
import SharedChallenges from '@/features/friends/SharedChallenges';
import { avatarTints, borderWidth, layout, typography, useTheme } from '@/theme';
import { socialMetrics as m, socialTypography } from '@/theme/social';

type Pending = 'remove' | 'block' | null;

// Arkadaş profili — design/FriendProfile.dc.html. Veri: friend_profile. Sağ üstteki "Seçenekler"
// işlem menüsünü açar: dürt, arkadaşlıktan çıkar, engelle (sayfa içi onayla), şikayet et.
export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, scheme } = useTheme();

  const profile = useFriendProfile(id);
  const remove = useRemoveFriendshipMutation();
  const block = useBlockUserMutation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState<Pending>(null);

  const closeMenu = () => {
    setMenuOpen(false);
    setPending(null);
    remove.reset();
    block.reset();
  };

  const header = (trailing?: boolean) => (
    <View style={styles.topRow}>
      <IconButton icon="back" accessibilityLabel="Geri" />
      {trailing && (
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Seçenekler"
          hitSlop={4}
          style={({ pressed }) => [
            styles.options,
            { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border },
          ]}>
          <DotsIcon color={colors.text} size={m.optionsIconSize} strokeWidth={0} />
        </Pressable>
      )}
    </View>
  );

  if (profile.isPending) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={styles.content}>{header()}</View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={styles.content}>{header()}</View>
        <ErrorState
          message={profile.isError ? undefined : 'Bu profil görüntülenemiyor.'}
          onRetry={profile.isError ? () => profile.refetch() : undefined}
        />
      </SafeAreaView>
    );
  }

  const p: FriendProfile = profile.data;
  const tint = avatarTints[p.avatarTint][scheme];
  const shared = p.sharedChallenges;
  const sub = shared.length > 0 ? `@${p.username} · ${shared.length} ortak challenge` : `@${p.username}`;

  const openPoke = () => {
    closeMenu();
    // Arkadaş değilse dürtme yalnızca ortak challenge üzerinden
    const challengeId = !p.isFriend ? shared[0]?.challengeId : undefined;
    router.push({ pathname: '/poke/[userId]', params: challengeId ? { userId: p.id, challengeId } : { userId: p.id } });
  };

  const items: SheetItem[] = [
    {
      key: 'poke',
      label: `${toAccusative(p.displayName)} dürt`,
      icon: (color) => <PokeHandIcon color={color} size={m.menuIconSize} strokeWidth={m.menuIconStrokeWidth} />,
      onPress: openPoke,
    },
    ...(p.isFriend
      ? [
          {
            key: 'remove',
            label: 'Arkadaşlıktan çıkar',
            icon: (color: string) => (
              <UserMinusIcon color={color} size={m.menuIconSize} strokeWidth={m.menuIconStrokeWidth} />
            ),
            onPress: () => setPending('remove'),
          },
        ]
      : []),
    {
      key: 'block',
      label: 'Engelle',
      danger: true,
      icon: (color) => <BlockIcon color={color} size={m.menuIconSize} strokeWidth={m.menuIconStrokeWidth} />,
      onPress: () => setPending('block'),
    },
    {
      key: 'report',
      label: 'Şikayet et',
      danger: true,
      icon: (color) => <FlagIcon color={color} size={m.menuIconSize} strokeWidth={m.menuIconStrokeWidth} />,
      onPress: () => {
        closeMenu();
        router.push({ pathname: '/report', params: { targetType: 'user', targetId: p.id } });
      },
    },
  ];

  const done = () => {
    closeMenu();
    router.back();
  };

  const confirm: SheetConfirm | null =
    pending === 'remove'
      ? {
          title: `${p.displayName} arkadaşlıktan çıkarılsın mı?`,
          message: 'İstersen sonra yeniden arkadaşlık isteği gönderebilirsin.',
          confirmLabel: 'Arkadaşlıktan çıkar',
          loading: remove.isPending,
          error: remove.error?.message,
          onConfirm: () => remove.mutate(p.id, { onSuccess: done }),
        }
      : pending === 'block'
        ? {
            title: `${toAccusative(p.displayName)} engelle?`,
            message: "Engellediğin kişi seni bulamaz ve dürtemez. Engeli Ayarlar'dan kaldırabilirsin.",
            confirmLabel: 'Engelle',
            loading: block.isPending,
            error: block.error?.message,
            onConfirm: () => block.mutate(p.id, { onSuccess: done }),
          }
        : null;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {header(true)}

        <View style={styles.identity}>
          <View accessible accessibilityLabel={p.displayName} style={[styles.avatar, { backgroundColor: tint.bg }]}>
            <Text style={[socialTypography.profileInitial, { color: tint.ink }]}>
              {upperTr(p.displayName.charAt(0))}
            </Text>
          </View>
          <Text accessibilityRole="header" style={[socialTypography.profileName, styles.name, { color: colors.text }]}>
            {p.displayName}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{sub}</Text>
        </View>

        <View style={styles.stats}>
          <Stat value={String(p.streak)} label="gün seri" />
          <Stat value={String(p.completedCount)} label="tamamlanan" />
          <Stat value={p.harshMode ? 'Açık' : 'Kapalı'} label="sert mod" />
        </View>

        {shared.length > 0 && (
          <>
            <SectionTitle style={styles.section}>ORTAK CHALLENGE&apos;LAR</SectionTitle>
            <SharedChallenges
              items={shared}
              onOpen={(challengeId) => router.push({ pathname: '/challenge/[id]', params: { id: challengeId } })}
            />
          </>
        )}
      </ScrollView>

      <ActionSheet
        visible={menuOpen}
        onClose={closeMenu}
        header={`${p.displayName} · @${p.username}`}
        items={items}
        confirm={confirm}
      />
    </SafeAreaView>
  );
}

/** Üçlü istatistik kartı: büyük değer + küçük etiket */
function Stat({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[socialTypography.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.smallStrong, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: layout.screenTopGap,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenPadding,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  options: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: layout.minTouchTarget / 2,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    marginTop: m.profileMarginTop,
    alignItems: 'center',
    gap: m.profileGap,
  },
  avatar: {
    width: m.profileAvatar,
    height: m.profileAvatar,
    borderRadius: m.profileAvatar / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: m.profileNameMarginTop,
  },
  stats: {
    marginTop: m.statsMarginTop,
    flexDirection: 'row',
    gap: m.statsGap,
  },
  stat: {
    flex: 1,
    paddingVertical: m.statPaddingY,
    paddingHorizontal: m.statPaddingX,
    borderRadius: m.statRadius,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
  },
  section: {
    marginTop: m.statsMarginTop,
  },
});
