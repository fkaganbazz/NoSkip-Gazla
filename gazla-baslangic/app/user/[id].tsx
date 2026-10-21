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
import { toAccusative } from '@/features/friends/names';
import JoinableChallenges from '@/features/friends/JoinableChallenges';
import SharedChallenges from '@/features/friends/SharedChallenges';
import { borderWidth, componentTypography, layout, typography, useTheme } from '@/theme';
import { socialMetrics as m, socialTypography } from '@/theme/social';

// Arkadaş profili — design/FriendProfile.dc.html. Veri: friend_profile. Sağ üstteki "Seçenekler"
// işlem sayfasını açar: dürt, arkadaşlıktan çıkar ve engelle (sayfa içi onayla), şikayet et.
// Arkadaşın "Arkadaşlarım" görünürlüklü challenge'ları ortak listenin altında "Katıl" ile (tasarlanmadı).
export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

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
      <IconButton icon="back" accessibilityLabel="Geri" />
      {trailing && <IconButton icon="options" accessibilityLabel="Seçenekler" onPress={() => setMenuOpen(true)} />}
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
  const shared = p.sharedChallenges;
  const sub = shared.length > 0 ? `@${p.username} · ${shared.length} ortak challenge` : `@${p.username}`;

  const done = () => {
    closeMenu();
    router.back();
  };

  // Katılınca profil yenilenir: challenge bu listeden düşer, ortak challenge'lara geçer
  const joinChallenge = (c: JoinableChallenge) =>
    join.mutate(c.challengeId, {
      onSuccess: () => toast.show({ message: `"${c.title}" challenge'ına katıldın`, kind: 'success' }),
    });

  // Onaysız satırlar sayfa kapandıktan sonra çalışır; onaylı satırlar işlem bitince ekranı kapatır
  const items: ActionSheetItem[] = [
    {
      key: 'poke',
      label: `${toAccusative(p.displayName)} dürt`,
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
            label: 'Arkadaşlıktan çıkar',
            icon: UserMinusIcon,
            confirm: {
              title: `${p.displayName} arkadaşlıktan çıkarılsın mı?`,
              message: 'İstersen sonra yeniden arkadaşlık isteği gönderebilirsin.',
              confirmLabel: 'Arkadaşlıktan çıkar',
              loading: remove.isPending,
              error: remove.error?.message,
            },
            onPress: () => remove.mutate(p.id, { onSuccess: done }),
          },
        ]
      : []),
    {
      key: 'block',
      label: 'Engelle',
      danger: true,
      icon: BlockIcon,
      confirm: {
        title: `${toAccusative(p.displayName)} engelle?`,
        message: "Engellediğin kişi seni bulamaz ve dürtemez. Engeli Ayarlar'dan kaldırabilirsin.",
        confirmLabel: 'Engelle',
        loading: block.isPending,
        error: block.error?.message,
      },
      onPress: () => block(p.id, { onSuccess: done }),
    },
    {
      key: 'report',
      label: 'Şikayet et',
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
          <Stat value={String(p.streak)} label="gün seri" />
          <Stat value={String(p.completedCount)} label="tamamlanan" />
          <Stat value={p.harshMode ? 'Açık' : 'Kapalı'} label="sert mod" />
        </View>

        {shared.length > 0 && (
          <>
            <SectionLabel style={styles.section}>ORTAK CHALLENGE&apos;LAR</SectionLabel>
            <SharedChallenges
              items={shared}
              onOpen={(challengeId) => router.push({ pathname: '/challenge/[id]', params: { id: challengeId } })}
            />
          </>
        )}

        {p.joinableChallenges.length > 0 && (
          <>
            <SectionLabel style={styles.section}>
              KATILABİLECEĞİN CHALLENGE&apos;LAR
            </SectionLabel>
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
        accessibilityLabel={`${p.displayName} için işlemler`}
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
