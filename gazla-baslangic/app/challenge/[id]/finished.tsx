import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Diken from '@/components/Diken';
import { ChevronRightIcon, ShareIcon } from '@/components/icons';
import { Button, Card, ErrorState, IconButton, LoadingState, ToastHost, useToast } from '@/components/ui';
import {
  useAuth,
  useChallenge,
  useChallengeCalendar,
  useChallengeMembers,
  useGarden,
  useMarkFinishSeen,
  useMyMembership,
} from '@/data';
import Confetti from '@/features/moments/Confetti';
import { ShareCardCapture, storyShareMessage, useStoryShare } from '@/features/moments/StoryShare';
import { useT } from '@/i18n';
import { finishedColors, momentsMetrics as m, momentsTypography as typo } from '@/theme/moments';
import { componentMetrics as cm, layout, radius, useTheme } from '@/theme';

const DESIGN_WIDTH = 390;
const DESIGN_TOP = 56;

// Challenge bitti — design/Finished.dc.html. Koyu tasarımı yok; en yakın koyu rollere bağlandı
// (src/theme/moments.ts). Sonuçlar sunucunun yazdığı üyelik satırından (final_*), yoksa
// challenge_board ve takvimden okunur. Açılınca "görüldü" işaretlenir (Bugün açılışında bir daha gelmez);
// challenge sunucuya göre bitmemişse "bitirdin" demez, detaya geçer.
// "Story'de paylaş": ShareCard ekranın arkasında çizili durur, 1080×1920 PNG'ye çevrilip sistem paylaşım
// sayfasında açılır (EKRANLAR 2.7; src/features/moments/StoryShare.tsx). Web'de PNG indirilir/paylaşılır;
// görsel üretilemezse metin paylaşılır.
export default function FinishedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors, scheme } = useTheme();
  const c = finishedColors[scheme];
  const t = useT();
  const { session, profile } = useAuth();
  const story = useStoryShare();
  const toast = useToast();

  const challenge = useChallenge(id);
  const board = useChallengeMembers(id);
  const membership = useMyMembership(id);
  const calendar = useChallengeCalendar(id);
  const garden = useGarden();
  const markSeen = useMarkFinishSeen();

  const status = challenge.data?.status;
  const unseen = !!membership.data && !membership.data.finishSeenAt;
  const fetching = challenge.isFetching || membership.isFetching;
  const handled = useRef(false);
  const rechecked = useRef(false);
  const [openedAt] = useState(Date.now);
  useEffect(() => {
    if (handled.current || !id || !status || membership.isPending || fetching) return;
    if (status !== 'finished' && !rechecked.current && challenge.dataUpdatedAt < openedAt) {
      // Önbellekteki durum eski olabilir (ör. gün yeni döndü): karar vermeden önce sunucudan bir kez daha oku
      rechecked.current = true;
      challenge.refetch();
      membership.refetch();
      return;
    }
    handled.current = true;
    if (status !== 'finished') {
      router.replace({ pathname: '/challenge/[id]', params: { id } });
    } else if (unseen) {
      markSeen.mutate(id);
    }
  }, [id, status, unseen, membership, challenge, fetching, openedAt, markSeen, router]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const top = insets.top + layout.screenTopGap;

  // Bitmemiş challenge: detaya geçerken yükleniyor görünür
  if (challenge.isPending || board.isPending || membership.isPending || (status && status !== 'finished')) {
    return (
      <View style={[styles.screen, { paddingTop: top, backgroundColor: c.bg }]}>
        <View style={styles.closeRow}>
          <IconButton icon="close" accessibilityLabel={t.common.close} onPress={close} />
        </View>
        <LoadingState />
      </View>
    );
  }

  if (challenge.error || !challenge.data) {
    return (
      <View style={[styles.screen, { paddingTop: top, backgroundColor: c.bg }]}>
        <View style={styles.closeRow}>
          <IconButton icon="close" accessibilityLabel={t.common.close} onPress={close} />
        </View>
        <ErrorState message={challenge.error?.message} onRetry={() => challenge.refetch()} />
      </View>
    );
  }

  const ch = challenge.data;
  const mine = board.data?.find((b) => b.id === session?.userId);
  const final = membership.data;
  const daysDone = final?.finalDaysDone ?? mine?.daysDone ?? 0;
  const required = final?.finalRequiredDays ?? ch.durationDays;
  const rescues = final?.finalRescues ?? calendar.data?.rescues.length ?? 0;
  const rank = final?.finalRank ?? mine?.rank;
  const stage = garden.data?.find((g) => g.challengeId === ch.id)?.stage ?? 'cicek';
  const bloomed = stage === 'cicek';

  const dx = (width - DESIGN_WIDTH) / 2;
  const dy = top - DESIGN_TOP;

  const card = {
    durationDays: ch.durationDays,
    title: ch.title,
    name: profile?.displayName ?? '',
    username: profile?.username ?? '',
    stage,
  };
  const shareStory = async () => {
    const result = await story.share({ fileBase: ch.title, fallbackMessage: storyShareMessage(card) });
    if (result === 'downloaded') toast.show({ message: t.challenge.finished.downloaded, kind: 'success' });
    else if (result === 'error') toast.show({ message: t.challenge.finished.shareFailed });
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Paylaşılacak kart: içeriğin arkasında (ScrollView opak zeminle örter) */}
      <ShareCardCapture story={story} {...card} />
      <ScrollView
        style={{ backgroundColor: c.bg }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: top, paddingBottom: Math.max(m.bottomPadding, insets.bottom) },
        ]}>
        <View
          style={[
            styles.glow,
            { left: m.glowLeft + dx, top: m.glowTop + dy, width: m.glow, height: m.glow, borderRadius: m.glow / 2, backgroundColor: c.glow },
          ]}
        />
        <View style={[styles.confetti, { top: dy }]}>
          <Confetti variant="finished" left={dx} />
        </View>

        <View style={styles.closeRow}>
          <IconButton icon="close" accessibilityLabel={t.common.close} onPress={close} />
        </View>

        <View style={styles.diken}>
          <Diken mood="gurur" stage={stage} gear="gozluk" size={m.finishedDiken} />
        </View>

        <View style={styles.texts}>
          <View style={[styles.badge, { backgroundColor: c.badgeBg }]}>
            <Text style={[typo.badge, { color: c.badgeText }]}>{t.challenge.finished.badge(daysDone, required)}</Text>
          </View>
          <Text accessibilityRole="header" style={[typo.finishedTitle, styles.center, { color: colors.text }]}>
            {t.challenge.finished.title}
          </Text>
          <Text style={[typo.finishedSub, styles.center, { color: c.body }]}>
            {`${t.challenge.finished.sub(ch.title)}${bloomed ? t.challenge.finished.bloomed : ''}`}
          </Text>
        </View>

        <View style={styles.stats}>
          <Stat value={`${daysDone}/${required}`} label={t.challenge.finished.stats.days} />
          <Stat value={String(rescues)} label={t.challenge.finished.stats.rescues(rescues)} />
          <Stat value={rank != null ? t.challenge.finished.rank(rank) : '–'} label={t.challenge.finished.stats.rank} />
        </View>

        <Pressable
          onPress={() => router.navigate('/garden')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.garden, { backgroundColor: c.gardenBg, opacity: pressed ? 0.85 : 1 }]}>
          <View style={styles.gardenDikens}>
            <Diken mood="mutlu" stage="genc" size={m.gardenDikenSmall} />
            <Diken mood="gurur" stage={stage} size={m.gardenDikenLarge} />
          </View>
          <Text style={[typo.garden, styles.gardenText, { color: c.gardenText }]}>
            {bloomed ? t.challenge.finished.gardenBloomed : t.challenge.finished.gardenNew}
          </Text>
          <ChevronRightIcon color={c.gardenText} size={m.chevronSize} strokeWidth={m.chevronStroke} />
        </Pressable>

        <View style={styles.footer}>
          <Button
            title={t.challenge.finished.shareStory}
            icon={(color) => <ShareIcon color={color} size={cm.buttonIconSize} strokeWidth={cm.buttonIconStroke} />}
            loading={story.busy}
            accessibilityLabel={story.busy ? t.challenge.finished.sharePreparing : undefined}
            onPress={shareStory}
          />
          <Button title={t.challenge.finished.pickNew} variant="text" onPress={() => router.navigate('/explore')} />
        </View>
      </ScrollView>
      <ToastHost toast={toast} />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { colors, scheme } = useTheme();
  const c = finishedColors[scheme];
  return (
    <Card style={styles.stat}>
      <View accessible accessibilityLabel={`${value} ${label}`} style={styles.statInner}>
        <Text style={[typo.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[typo.statLabel, { color: c.statLabel }]}>{label}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
  },
  confetti: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  diken: {
    marginTop: m.finishedDikenTop,
    alignItems: 'center',
  },
  texts: {
    marginTop: m.finishedTextTop,
    alignItems: 'center',
    gap: m.finishedTextGap,
  },
  badge: {
    paddingVertical: m.badgePaddingY,
    paddingHorizontal: m.badgePaddingX,
    borderRadius: radius.full,
  },
  center: {
    textAlign: 'center',
  },
  stats: {
    marginTop: m.statsTop,
    flexDirection: 'row',
    gap: m.statsGap,
  },
  stat: {
    flex: 1,
    paddingVertical: m.statPaddingY,
    paddingHorizontal: m.statPaddingX,
    borderRadius: m.statRadius,
  },
  statInner: {
    alignItems: 'center',
    gap: m.statGap,
  },
  garden: {
    marginTop: m.gardenTop,
    minHeight: m.gardenHeight,
    paddingLeft: m.gardenPaddingLeft,
    paddingRight: m.gardenPaddingRight,
    borderRadius: m.gardenRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.gardenGap,
  },
  gardenDikens: {
    height: m.gardenDikenRow,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  gardenText: {
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: m.statsTop,
    gap: m.footerGap,
  },
});
