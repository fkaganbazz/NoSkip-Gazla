import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionSheet, { type ActionSheetItem } from '@/components/ActionSheet';
import { HandIcon } from '@/components/icons';
import { Avatar, ErrorState, IconButton, LoadingState, SectionLabel, ToastHost, useToast } from '@/components/ui';
import {
  useBlock,
  useFriendProfile,
  useJoinFriendChallenge,
  useRemoveFriendship,
  type FriendProfile,
  type JoinableChallenge,
} from '@/data';
import { BlockIcon, FlagIcon, UserMinusIcon } from '@/features/friends/icons';
import JoinableChallenges from '@/features/friends/JoinableChallenges';
import SharedChallenges from '@/features/friends/SharedChallenges';
import { useT } from '@/i18n';
import { borderWidth, componentTypography, layout, typography, useTheme } from '@/theme';
import { socialMetrics as m, socialTypography } from '@/theme/social';

// Arkadaş profili — design/FriendProfile.dc.html. Veri: friend_profile. Sağ üstteki "Seçenekler"
// işlem sayfasını açar: dürt, arkadaşlıktan çıkar ve engelle (sayfa içi onayla), şikayet et.
// Arkadaşın "Arkadaşlarım" görünürlüklü challenge'ları ortak listenin altında "Katıl" ile (tasarlanmadı).
export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();

  const profile = useFriendProfile(id);
  const remove = useRemoveFriendship();
  const { block } = useBlock();
  const join = useJoinFriendChallenge();
  const toast = useToast();

  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
    remove.reset();
    block.reset();
  };

  const header = (trailing?: boolean) => (
    <View style={styles.topRow}>
      <IconButton icon="back" accessibilityLabel={t.common.back} />
      {trailing && <IconButton icon="options" accessibilityLabel={t.common.options} onPress={() => setMenuOpen(true)} />}
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
          message={profile.isError ? undefined : t.profile.notViewable}
          onRetry={profile.isError ? () => profile.refetch() : undefined}
        />
      </SafeAreaView>
    );
  }

  const p: FriendProfile = profile.data;
  const shared = p.sharedChallenges;
  const sub = shared.length > 0 ? t.profile.sharedCount(p.username, shared.length) : `@${p.username}`;

  const done = () => {
    closeMenu();
    router.back();
  };

  // Katılınca profil yenilenir: challenge bu listeden düşer, ortak challenge'lara geçer
  const joinChallenge = (c: JoinableChallenge) =>
    join.mutate(c.challengeId, {
      onSuccess: () => toast.show({ message: t.profile.joined(c.title), kind: 'success' }),
    });

  // Onaysız satırlar sayfa kapandıktan sonra çalışır; onaylı satırlar işlem bitince ekranı kapatır
  const items: ActionSheetItem[] = [
    {
      key: 'poke',
      label: t.profile.menu.poke(p.displayName),
      icon: HandIcon,
      onPress: () => {
        // Arkadaş değilse dürtme yalnızca ortak challenge üzerinden
        const challengeId = !p.isFriend ? shared[0]?.challengeId : undefined;
        router.push({ pathname: '/poke/[userId]', params: challengeId ? { userId: p.id, challengeId } : { userId: p.id } });
      },
    },
    ...(p.isFriend
      ? [
          {
            key: 'remove',
            label: t.profile.menu.remove,
            icon: UserMinusIcon,
            confirm: {
              title: t.profile.menu.removeTitle(p.displayName),
              message: t.profile.menu.removeMessage,
              confirmLabel: t.profile.menu.remove,
              loading: remove.isPending,
              error: remove.error?.message,
            },
            onPress: () => remove.mutate(p.id, { onSuccess: done }),
          },
        ]
      : []),
    {
      key: 'block',
      label: t.common.block,
      danger: true,
      icon: BlockIcon,
      confirm: {
        title: t.profile.menu.blockTitle(p.displayName),
        message: t.profile.menu.blockMessage,
        confirmLabel: t.common.block,
        loading: block.isPending,
        error: block.error?.message,
      },
      onPress: () => block(p.id, { onSuccess: done }),
    },
    {
      key: 'report',
      label: t.common.report,
      danger: true,
      icon: FlagIcon,
      onPress: () => router.push({ pathname: '/report/[userId]', params: { userId: p.id } }),
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {header(true)}

        <View style={styles.identity}>
          <Avatar name={p.displayName} tint={p.avatarTint} url={p.avatarUrl} size={m.profileAvatar} />
          <Text accessibilityRole="header" style={[socialTypography.profileName, styles.name, { color: colors.text }]}>
            {p.displayName}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{sub}</Text>
        </View>

        <View style={styles.stats}>
          <Stat value={String(p.streak)} label={t.profile.stats.streak} />
          <Stat value={String(p.completedCount)} label={t.profile.stats.completed} />
          <Stat value={p.harshMode ? t.profile.stats.on : t.profile.stats.off} label={t.profile.stats.harshMode} />
        </View>

        {shared.length > 0 && (
          <>
            <SectionLabel style={styles.section}>{t.profile.sections.shared}</SectionLabel>
            <SharedChallenges
              items={shared}
              onOpen={(challengeId) => router.push({ pathname: '/challenge/[id]', params: { id: challengeId } })}
            />
          </>
        )}

        {p.joinableChallenges.length > 0 && (
          <>
            <SectionLabel style={styles.section}>{t.profile.sections.joinable}</SectionLabel>
            <JoinableChallenges
              items={p.joinableChallenges}
              onJoin={joinChallenge}
              joiningId={join.isPending ? join.variables : undefined}
            />
            {join.error && (
              <Text
                accessibilityLiveRegion="polite"
                style={[componentTypography.inputError, styles.joinError, { color: colors.dangerText }]}>
                {join.error.message}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <ToastHost toast={toast} />

      <ActionSheet
        visible={menuOpen}
        onClose={closeMenu}
        title={`${p.displayName} · @${p.username}`}
        accessibilityLabel={t.profile.menu.label(p.displayName)}
        items={items}
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
  identity: {
    marginTop: m.profileMarginTop,
    alignItems: 'center',
    gap: m.profileGap,
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
  joinError: {
    marginTop: m.sectionListMarginTop,
  },
});
