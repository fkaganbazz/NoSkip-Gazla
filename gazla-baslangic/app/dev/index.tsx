import { useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionLabel } from '@/components/ui';
import { api, mockDev, useIsOnline, usePendingCheckins, useSignOutMutation } from '@/data';
import { borderWidth, layout, radius, spacing, typography, useTheme } from '@/theme';

type Row = { title: string; detail: string; href?: Href; onPress?: () => void };

const DESIGN: Row[] = [
  { href: '/dev/tokens', title: 'Renk ve yazı', detail: 'Tokens.dc.html · yazı ölçeği, renkler, boşluk' },
  { href: '/dev/diken', title: 'Diken', detail: 'Diken.dc.html · tüm ifadeler, aşamalar, aksesuarlar' },
  { href: '/dev/components', title: 'Bileşenler', detail: 'Components.dc.html · buton, ikon butonu, seçim, tost, onboarding başlığı' },
];

const SCREENS: Row[] = [
  { href: '/challenge/c-phone', title: 'Detail', detail: 'challenge/[id] · Telefonsuz sabah' },
  { href: '/challenge/g-okuma/finished', title: 'Finished', detail: 'challenge/[id]/finished · Bahçem: 30 gün okuma' },
  { href: '/dev/share-card', title: 'ShareCard', detail: 'Ekran değil: Finished "Story\'de paylaş" görseli · önizleme ve PNG paylaşımı' },
  { href: '/completion', title: 'Completion', detail: 'Günün hepsi bitti anı' },
  { href: '/streak-lost', title: 'StreakLost', detail: 'Seri koptu, kurtarma' },
  { href: '/ad-consent', title: 'AdConsent', detail: 'Reklam izni' },
  { href: '/activity', title: 'Activity', detail: 'Bildirimler' },
  { href: '/friend/u-mert', title: 'FriendProfile', detail: 'friend/[id] · Mert' },
  { href: '/poke/u-mert', title: 'Poke', detail: 'poke/[userId] · alt sayfa' },
  { href: '/template/t-kahvesiz', title: 'ChallengePreview', detail: 'template/[id]' },
  { href: '/invite/MertKahve1', title: 'InviteLanding', detail: 'invite/[code]' },
  { href: '/invite-friends', title: 'InviteFriends', detail: 'Arkadaş davet et' },
  { href: '/settings', title: 'Settings', detail: 'Ayarlar' },
];

export default function DevIndex() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const signOut = useSignOutMutation();
  const online = useIsOnline();
  const pending = usePendingCheckins();
  const offline = mockDev.isOffline();

  const DATA: Row[] = [
    { title: 'Oturumu kapat', detail: 'Onboarding baştan başlar', onPress: () => signOut.mutate() },
    ...(api.kind === 'mock'
      ? [
          {
            title: 'Seri koptu senaryosu',
            detail: 'Mock: dün kaçırılmış, kurtarma bekliyor',
            onPress: () => {
              mockDev.simulateStreakLost();
              queryClient.invalidateQueries();
            },
          },
          {
            title: 'Challenge bitti senaryosu',
            detail: 'Mock: telefonsuz sabah dün bitti (30/30, 1 kurtarma); Bugün açılınca "bitti" ekranı gelir',
            onPress: () => {
              mockDev.simulateFinished();
              queryClient.invalidateQueries();
            },
          },
          {
            title: `Çevrimdışı modu: ${offline ? 'açık' : 'kapalı'}`,
            detail: `Mock: ${offline ? 'istekler ağ hatasıyla düşer, işaretleme kuyruğa girer' : 'dokun, bağlantı yokmuş gibi davransın'} · ${online ? 'çevrimiçi' : 'çevrimdışı'} · kuyrukta ${pending}`,
            onPress: () => mockDev.setOffline(!offline),
          },
          {
            title: 'Örnek veriyi sıfırla',
            detail: 'Mock: tüm değişiklikleri geri al',
            onPress: () => {
              mockDev.reset();
              queryClient.invalidateQueries();
            },
          },
        ]
      : []),
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: layout.screenPadding + insets.bottom }]}>
      <SectionLabel>{`VERİ · ${api.kind === 'mock' ? 'ÖRNEK VERİ' : 'SUPABASE'}`}</SectionLabel>
      {DATA.map((row) => (
        <DevRow key={row.title} row={row} />
      ))}
      <SectionLabel style={styles.section}>TASARIM</SectionLabel>
      {DESIGN.map((row) => (
        <DevRow key={row.title} row={row} />
      ))}
      <SectionLabel style={styles.section}>EKRANLAR</SectionLabel>
      {SCREENS.map((row) => (
        <DevRow key={row.title} row={row} />
      ))}
    </ScrollView>
  );
}

function DevRow({ row }: { row: Row }) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    // Link asChild kullanılmıyor: Slot, Pressable'ın stil fonksiyonunu birleştirirken düşürüyor.
    <Pressable
      onPress={row.onPress ?? (() => row.href && router.push(row.href))}
      accessibilityRole={row.href ? 'link' : 'button'}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <View style={styles.texts}>
        <Text style={[typography.cardTitle, { color: colors.text }]}>{row.title}</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{row.detail}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: layout.screenPadding,
    gap: spacing.sm,
  },
  section: {
    marginTop: spacing.md,
  },
  row: {
    minHeight: layout.minTouchTarget,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: borderWidth.thin,
  },
  texts: {
    gap: spacing.xxs,
  },
});
