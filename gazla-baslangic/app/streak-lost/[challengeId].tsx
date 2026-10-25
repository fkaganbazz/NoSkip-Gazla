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
  useChallengeMembers,
  useRescueStreak,
  type PendingRescue,
} from '@/data';
import { addLocalDays, deviceToday } from '@/features/checkin/logic';
import { formatRemaining } from '@/features/moments/logic';
import { useNow } from '@/features/today/useNow';
import { useT } from '@/i18n';
import { momentsMetrics as m, momentsTypography as ty, streakLostColors } from '@/theme/moments';
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
  const t = useT();
  const ts = t.streakLost;
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const c = streakLostColors[scheme];
  const now = useNow();
  const { session } = useAuth();

  // Bekleyen kurtarmalar (data) + kurtarma: rescue({ via: 'ad' | 'free' }), "Baştan başla": decline
  const rescues = useRescueStreak();
  const { rescue, decline } = rescues;
  // Hangi yol sürüyor / son hata hangi yolun (butonların yükleniyor durumu ve hata tostu için)
  const rescueVia = rescue.variables?.via;
  const freePending = rescue.isPending && rescueVia === 'free';
  const adRescuePending = rescue.isPending && rescueVia === 'ad';
  const freeError = rescueVia === 'free' ? rescue.error : null;
  const adRescueError = rescueVia === 'ad' ? rescue.error : null;
  const [saved, setSaved] = useState<Saved | null>(null);
  // Vazgeçilen kurtarma: liste yenilenip ekran kapanana kadar aynı kart görünür (boş hali yanıp sönmesin)
  const [declined, setDeclined] = useState<PendingRescue | null>(null);
  const [adFailed, setAdFailed] = useState(false);

  const ad = useRewardedAd();
  // Ödül kazanıldı ama sunucu doğrulaması gecikti ('AD_REWARD_PENDING'): bir sonraki basış yeni reklam
  // açmadan doğrulamayı bir kez daha dener
  const [verifyAgain, setVerifyAgain] = useState<PendingRescue | null>(null);
  // Reklam izni ön ekranı buradan açıldı: dönünce reklam başlasın
  const resumeAfterConsent = useRef<PendingRescue | null>(null);

  const verifyAdRescue = (item: PendingRescue, retried: boolean) => {
    rescue(
      { via: 'ad', challengeId: item.challengeId, missedDate: item.missedDate },
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
    // Önceki reklam kurtarmasının hatası silinir (ücretsiz hakkınki reklam boyunca görünür kalır)
    if (rescueVia === 'ad') rescue.reset();
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
  const board = useChallengeMembers(current?.challengeId);

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
          <IconButton icon="close" tone="onColor" accessibilityLabel={t.common.close} onPress={close} />
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
        <Text accessibilityRole="header" style={[ty.lostTitle, styles.center, { color: colors.text }]}>
          {ts.nothingToSave}
        </Text>
        <Button title={t.common.close} onPress={close} style={styles.emptyButton} />
      </View>
    );
  }

  const lost = !saved;
  const yesterday = addLocalDays(deviceToday(now), -1);
  // Kaçırılan gün dün değilse tarihiyle ("24 Ekim")
  const [my, mm, md] = current.missedDate.split('-').map(Number);
  const missedOn = current.missedDate === yesterday ? null : new Date(my, mm - 1, md);
  const remaining = formatRemaining(Date.parse(current.expiresAt) - now.getTime(), t);
  const continuing = (board.data ?? []).filter((b) => b.id !== session?.userId && b.streak > 0);

  const title = lost ? ts.lostTitle : ts.savedTitle;
  const sub = lost
    ? ts.lostSub(current.title, current.streakBefore, missedOn)
    : saved.via === 'ad'
      ? ts.savedAdSub(current.streakBefore)
      : ts.savedFreeSub(current.streakBefore);

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
    rescue(
      { via: 'free', challengeId: current.challengeId, missedDate: current.missedDate },
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
    decline(
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
            accessibilityLabel={lost ? ts.pill.remainingA11y(remaining) : ts.pill.saved}
            style={[styles.pill, { backgroundColor: c.pillBg }]}>
            {lost ? (
              <ClockIcon color={c.pillLostText} size={m.pillIconSize} strokeWidth={m.pillClockStroke} />
            ) : (
              <CheckIcon color={c.pillSavedText} size={m.pillIconSize} strokeWidth={m.pillCheckStroke} />
            )}
            <Text style={[ty.pill, { color: lost ? c.pillLostText : c.pillSavedText }]}>
              {lost ? ts.pill.remaining(remaining) : ts.pill.saved}
            </Text>
          </View>
          <IconButton icon="close" tone="onColor" accessibilityLabel={t.common.close} onPress={close} />
        </View>

        <View style={styles.diken}>
          {lost ? (
            <Diken mood="solgun" size={m.lostDiken} />
          ) : (
            <Diken mood="cosku" stage="tam" gear="bant" size={m.lostDiken} />
          )}
        </View>

        <View style={styles.texts}>
          <Text accessibilityRole="header" style={[ty.lostTitle, styles.center, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[ty.lostSub, styles.center, styles.sub, { color: c.body }]}>{sub}</Text>
        </View>

        {lost && continuing.length > 0 && (
          <View style={[styles.friendsPill, { backgroundColor: c.pillBg }]}>
            <AvatarStack
              people={continuing.slice(0, 2).map((f) => ({ id: f.id, name: f.displayName, tint: f.avatarTint, url: f.avatarUrl }))}
              size={m.lostStackAvatar}
              outlineColor={c.stackBorder}
            />
            <Text style={[ty.friendsPill, styles.friendsText, { color: c.body }]}>
              {ts.friendsContinue(continuing.map((f) => f.displayName))}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {lost ? (
            <>
              {(adFailed || freeError || decline.error || adRescueError) && (
                <Toast
                  message={
                    decline.error
                      ? decline.error.message
                      : freeError
                        ? freeError.message
                        : adRescueError
                          ? adRescueError.message
                          : current.freeRescueAvailable
                            ? ts.adFailedFree
                            : ts.adFailed
                  }
                />
              )}
              <Button
                title={ts.watchAd}
                accessibilityLabel={ts.watchAdA11y}
                onPress={onWatchAd}
                loading={ad.status !== 'idle' || adRescuePending}
                disabled={freePending || decline.isPending}
                style={styles.adButton}
                icon={<SolidDropIcon color={c.adDrop} size={m.adDropSize} />}
                trailing={
                  <View style={[styles.adBadge, { backgroundColor: c.adBadgeBg }]}>
                    <Text style={[ty.adBadge, { color: colors.onAction }]}>{ts.adBadge}</Text>
                  </View>
                }
              />
              {/* Reklam yüklenemezse kenar aksiyon yeşiliyle vurgulanır (ücretsiz hak önerilir) */}
              <Button
                title={ts.useFree}
                subtitle={current.freeRescueAvailable ? ts.freeAvailable : ts.freeUsed}
                variant="secondary"
                highlighted={adFailed}
                disabled={!current.freeRescueAvailable || decline.isPending || adRescuePending}
                loading={freePending}
                onPress={onFree}
              />
              <Button
                title={ts.restart}
                variant="text"
                size="md"
                loading={decline.isPending}
                disabled={rescue.isPending}
                onPress={onRestart}
              />
            </>
          ) : (
            <Button title={t.common.continue} onPress={onContinue} style={styles.tallButton} />
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
