import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAdsState, refreshAds, useRewardedAd } from '@/ads';
import { AvatarStack } from '@/components/Avatar';
import Diken from '@/components/Diken';
import { CheckIcon, ClockIcon, SolidDropIcon } from '@/components/icons';
import { Button, ErrorState, IconButton, LoadingState, Toast } from '@/components/ui';
import {
  adRescueSsvOptions,
  isAdRewardPendingError,
  useAuth,
  useChallengeBoard,
  useDeclineRescueMutation,
  usePendingRescues,
  useRescueWithAdMutation,
  useRescueWithFreeRightMutation,
  type PendingRescue,
} from '@/data';
import { addDays, formatShortDate, isoDate, joinNames } from '@/features/challenge/logic';
import { formatRemaining } from '@/features/moments/logic';
import { useNow } from '@/features/today/useNow';
import { momentsMetrics as m, momentsTypography as t, streakLostColors } from '@/theme/moments';
import { layout, radius, useTheme } from '@/theme';

type Saved = { item: PendingRescue; via: 'ad' | 'free' };

// Seri koptu — design/StreakLost.dc.html. Bekleyen kurtarma (my_pending_rescues) için 24 saatlik süre:
// rewarded reklam ya da ayda 1 ücretsiz hak. Reklam yüklenemezse ücretsiz hak önerilir (CLAUDE.md).
// Reklam: AdMob rewarded, ödül sunucuda SSV ile doğrulanır; 8 sn içinde yüklenmezse ya da hata/web'de
// "yüklenemedi" yolu. Kurtarma yalnızca EARNED_REWARD olayında istenir; ödülsüz kapanışta hiçbir şey olmaz.
// Reklam izni akışı (6.2) hiç tamamlanmadıysa önce ön ekran açılır, dönünce reklam başlar.
// Koyu tasarımı yok; en yakın koyu rollere bağlandı (src/theme/moments.ts).
// Yol: /streak-lost/<challengeId> — o challenge'ın bekleyen kurtarması (Bugün ilk bekleyenle açar; Diken bildirimi
// de). "Devam" (kurtarıldı) ve "Baştan başla" (decline_rescue) sonrası sıradaki bekleyen kurtarma varsa onun yoluna
// geçilir (replace), yoksa ekran kapanır. Bu challenge'da bekleyen yoksa (süresi doldu, başka yerden kurtarıldı)
// sıradakine geçer; hiç yoksa "Kurtarılacak seri yok".
export default function StreakLostScreen() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const c = streakLostColors[scheme];
  const now = useNow();
  const { session } = useAuth();

  const rescues = usePendingRescues();
  const rescue = useRescueWithFreeRightMutation();
  const decline = useDeclineRescueMutation();
  const [saved, setSaved] = useState<Saved | null>(null);
  // Vazgeçilen kurtarma: liste yenilenip ekran kapanana kadar aynı kart görünür (boş hali yanıp sönmesin)
  const [declined, setDeclined] = useState<PendingRescue | null>(null);
  const [adFailed, setAdFailed] = useState(false);

  const ad = useRewardedAd();
  const rescueAd = useRescueWithAdMutation();
  // Ödül kazanıldı ama sunucu doğrulaması gecikti ('AD_REWARD_PENDING'): bir sonraki basış yeni reklam
  // açmadan doğrulamayı bir kez daha dener
  const [verifyAgain, setVerifyAgain] = useState<PendingRescue | null>(null);
  // Reklam izni ön ekranı buradan açıldı: dönünce reklam başlasın
  const resumeAfterConsent = useRef<PendingRescue | null>(null);

  const verifyAdRescue = (item: PendingRescue, retried: boolean) => {
    rescueAd.mutate(
      { challengeId: item.challengeId, missedDate: item.missedDate },
      {
        onSuccess: () => {
          setAdFailed(false);
          setVerifyAgain(null);
          setSaved({ item, via: 'ad' });
        },
        onError: (e) => setVerifyAgain(!retried && isAdRewardPendingError(e) ? item : null),
      },
    );
  };

  const startAd = (item: PendingRescue) => {
    const userId = session?.userId;
    if (!userId) {
      setAdFailed(true);
      return;
    }
    setAdFailed(false);
    setVerifyAgain(null);
    rescueAd.reset();
    ad.watch({
      ssv: adRescueSsvOptions(userId, item.challengeId, item.missedDate),
      onEarned: () => verifyAdRescue(item, false),
      onFailed: () => setAdFailed(true),
      onNeedsConsent: () => {
        resumeAfterConsent.current = item;
        router.push('/ad-consent');
      },
    });
  };
  const startAdRef = useRef(startAd);
  startAdRef.current = startAd;

  useFocusEffect(
    useCallback(() => {
      const item = resumeAfterConsent.current;
      if (!item) return;
      resumeAfterConsent.current = null;
      if (getAdsState().phase === 'ready') {
        startAdRef.current(item);
      } else {
        // Ön ekran kapatıldı ya da izin formu açılamadı: ücretsiz hak öne çıkar; durum sonraki basış için tazelenir
        setAdFailed(true);
        void refreshAds();
      }
    }, []),
  );

  const pending = rescues.data?.find((r) => r.challengeId === challengeId);
  const current = saved?.item ?? declined ?? pending;
  const board = useChallengeBoard(current?.challengeId);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  // Sıradaki bekleyen kurtarmanın ekranına geç (yeni ekran: durum sıfırdan); yoksa kapan
  const goNext = (skip: string) => {
    const next = (rescues.data ?? []).find((r) => r.challengeId !== skip);
    if (next) router.replace({ pathname: '/streak-lost/[challengeId]', params: { challengeId: next.challengeId } });
    else close();
  };

  // Bu challenge'da bekleyen kurtarma yok ama başkası var: ona geç
  const fallback = !saved && !declined && !pending ? rescues.data?.[0]?.challengeId : undefined;
  useEffect(() => {
    if (fallback) router.replace({ pathname: '/streak-lost/[challengeId]', params: { challengeId: fallback } });
  }, [fallback, router]);

  const top = insets.top + layout.screenTopGap;
  const bottom = Math.max(m.bottomPadding, insets.bottom);

  if (rescues.isPending) {
    return (
      <View style={[styles.screen, { paddingTop: top, backgroundColor: c.bgLost }]}>
        <LoadingState />
      </View>
    );
  }

  if (rescues.error && !saved) {
    return (
      <View style={[styles.screen, { paddingTop: top, paddingHorizontal: layout.screenPadding, backgroundColor: c.bgLost }]}>
        <View style={styles.topRow}>
          <View />
          <IconButton icon="close" tone="onColor" accessibilityLabel="Kapat" onPress={close} />
        </View>
        <ErrorState message={rescues.error.message} onRetry={() => rescues.refetch()} />
      </View>
    );
  }

  if (!current && fallback) {
    return <View style={[styles.screen, { backgroundColor: c.bgLost }]} />;
  }

  // Bekleyen kurtarma yok (süresi doldu ya da başka yerden kurtarıldı)
  if (!current) {
    return (
      <View style={[styles.screen, styles.empty, { paddingTop: top, paddingBottom: bottom, backgroundColor: c.bgLost }]}>
        <Diken mood="mutlu" size={m.lostDiken} />
        <Text accessibilityRole="header" style={[t.lostTitle, styles.center, { color: colors.text }]}>
          Kurtarılacak seri yok
        </Text>
        <Button title="Kapat" onPress={close} style={styles.emptyButton} />
      </View>
    );
  }

  const lost = !saved;
  const yesterday = addDays(isoDate(now), -1);
  const when = current.missedDate === yesterday ? 'Dün' : formatShortDate(current.missedDate);
  const remaining = formatRemaining(Date.parse(current.expiresAt) - now.getTime());
  const continuing = (board.data ?? []).filter((b) => b.id !== session?.userId && b.streak > 0);

  const title = lost ? 'Serin koptu' : 'Diken sulandı!';
  const sub = lost
    ? `${when} "${current.title}" günü kaçtı. ${current.streakBefore} günlük serin tehlikede.`
    : saved.via === 'ad'
      ? `${current.streakBefore} günlük serin kaldığı yerden devam ediyor. Bugünü unutma.`
      : `Ücretsiz hakkını kullandın. Serin ${current.streakBefore}. günden devam ediyor.`;

  const onWatchAd = () => {
    if (verifyAgain && verifyAgain.challengeId === current.challengeId && verifyAgain.missedDate === current.missedDate) {
      setVerifyAgain(null);
      verifyAdRescue(current, true);
      return;
    }
    startAd(current);
  };

  const onFree = () => {
    ad.cancel();
    rescue.mutate(
      { challengeId: current.challengeId, missedDate: current.missedDate },
      {
        onSuccess: () => {
          setAdFailed(false);
          setSaved({ item: current, via: 'free' });
        },
      },
    );
  };

  const onRestart = () => {
    ad.cancel();
    const item = current;
    setDeclined(item);
    decline.mutate(
      { challengeId: item.challengeId, missedDate: item.missedDate },
      {
        onSuccess: () => goNext(item.challengeId),
        onError: () => setDeclined(null),
      },
    );
  };

  // Başka bekleyen kurtarma varsa onun ekranına geçilir
  const onContinue = () => goNext(current.challengeId);

  return (
    <View style={[styles.screen, { backgroundColor: lost ? c.bgLost : c.bgSaved }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: top, paddingBottom: bottom }]}
        bounces={false}>
        <View style={styles.topRow}>
          <View
            accessible
            accessibilityLabel={lost ? `Kurtarmak için ${remaining} kaldı` : 'Seri kurtarıldı'}
            style={[styles.pill, { backgroundColor: c.pillBg }]}>
            {lost ? (
              <ClockIcon color={c.pillLostText} size={m.pillIconSize} strokeWidth={m.pillClockStroke} />
            ) : (
              <CheckIcon color={c.pillSavedText} size={m.pillIconSize} strokeWidth={m.pillCheckStroke} />
            )}
            <Text style={[t.pill, { color: lost ? c.pillLostText : c.pillSavedText }]}>
              {lost ? `Kurtarmak için ${remaining}` : 'Seri kurtarıldı'}
            </Text>
          </View>
          <IconButton icon="close" tone="onColor" accessibilityLabel="Kapat" onPress={close} />
        </View>

        <View style={styles.diken}>
          {lost ? (
            <Diken mood="solgun" size={m.lostDiken} />
          ) : (
            <Diken mood="cosku" stage="tam" gear="bant" size={m.lostDiken} />
          )}
        </View>

        <View style={styles.texts}>
          <Text accessibilityRole="header" style={[t.lostTitle, styles.center, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[t.lostSub, styles.center, styles.sub, { color: c.body }]}>{sub}</Text>
        </View>

        {lost && continuing.length > 0 && (
          <View style={[styles.friendsPill, { backgroundColor: c.pillBg }]}>
            <AvatarStack
              people={continuing.slice(0, 2).map((f) => ({ id: f.id, name: f.displayName, tint: f.avatarTint, url: f.avatarUrl }))}
              size={m.lostStackAvatar}
              outlineColor={c.stackBorder}
            />
            <Text style={[t.friendsPill, styles.friendsText, { color: c.body }]}>
              {`${joinNames(continuing.map((f) => f.displayName))} hâlâ devam ediyor`}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {lost ? (
            <>
              {(adFailed || rescue.error || decline.error || rescueAd.error) && (
                <Toast
                  message={
                    decline.error
                      ? decline.error.message
                      : rescue.error
                        ? rescue.error.message
                        : rescueAd.error
                          ? rescueAd.error.message
                          : current.freeRescueAvailable
                            ? 'Reklam şu an yüklenemedi. Ücretsiz hakkını kullanabilirsin.'
                            : 'Reklam şu an yüklenemedi. Biraz sonra tekrar dene.'
                  }
                />
              )}
              <Button
                title="Reklam izle, Diken'i sula"
                accessibilityLabel="Reklam izle, Diken'i sula, 30 saniye"
                onPress={onWatchAd}
                loading={ad.status !== 'idle' || rescueAd.isPending}
                disabled={rescue.isPending || decline.isPending}
                style={styles.adButton}
                icon={<SolidDropIcon color={c.adDrop} size={m.adDropSize} />}
                trailing={
                  <View style={[styles.adBadge, { backgroundColor: c.adBadgeBg }]}>
                    <Text style={[t.adBadge, { color: colors.onAction }]}>30 sn</Text>
                  </View>
                }
              />
              {/* Reklam yüklenemezse kenar aksiyon yeşiliyle vurgulanır (ücretsiz hak önerilir) */}
              <Button
                title="Ücretsiz hakkımı kullan"
                subtitle={
                  current.freeRescueAvailable ? 'Ayda 1 hak · bu ay 1 hakkın var' : 'Ayda 1 hak · bu ayın hakkı kullanıldı'
                }
                variant="secondary"
                highlighted={adFailed}
                disabled={!current.freeRescueAvailable || decline.isPending || rescueAd.isPending}
                loading={rescue.isPending}
                onPress={onFree}
              />
              <Button
                title="Baştan başla"
                variant="text"
                size="md"
                loading={decline.isPending}
                disabled={rescue.isPending || rescueAd.isPending}
                onPress={onRestart}
              />
            </>
          ) : (
            <Button title="Devam" onPress={onContinue} style={styles.tallButton} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.pillGap,
    paddingVertical: m.pillPaddingY,
    paddingHorizontal: m.pillPaddingX,
    borderRadius: radius.full,
  },
  diken: {
    marginTop: m.lostDikenTop,
    alignItems: 'center',
  },
  texts: {
    marginTop: m.lostTextTop,
    alignItems: 'center',
    gap: m.lostTextGap,
  },
  center: {
    textAlign: 'center',
  },
  sub: {
    maxWidth: m.lostTextMaxWidth,
  },
  friendsPill: {
    marginTop: m.friendsPillTop,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.friendsPillGap,
    paddingVertical: m.friendsPillPaddingY,
    paddingLeft: m.friendsPillPaddingLeft,
    paddingRight: m.friendsPillPaddingRight,
    borderRadius: radius.full,
  },
  friendsText: {
    flexShrink: 1,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: m.friendsPillTop,
    gap: m.actionsGap,
  },
  // StreakLost.dc.html: alt butonlar 58 (ortak tok buton 56); reklam butonunda ikon–metin 10
  tallButton: {
    height: m.adButtonHeight,
  },
  adButton: {
    height: m.adButtonHeight,
    gap: m.adButtonGap,
  },
  adBadge: {
    paddingVertical: m.adBadgePaddingY,
    paddingHorizontal: m.adBadgePaddingX,
    borderRadius: m.adBadgeRadius,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    gap: m.lostTextGap,
  },
  emptyButton: {
    alignSelf: 'stretch',
    marginTop: m.lostTextTop,
  },
});
