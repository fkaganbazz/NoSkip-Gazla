import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarStack } from '@/components/Avatar';
import Diken from '@/components/Diken';
import { flatShadowStyle } from '@/components/FlatShadow';
import { CheckIcon, ClockIcon, SolidDropIcon } from '@/components/icons';
import { Button, ErrorState, IconButton, LoadingState, Toast } from '@/components/ui';
import {
  useAuth,
  useChallengeBoard,
  usePendingRescues,
  useRescueWithFreeRightMutation,
  type PendingRescue,
} from '@/data';
import { addDays, formatShortDate, isoDate, joinNames } from '@/features/challenge/logic';
import { formatRemaining } from '@/features/moments/logic';
import { useNow } from '@/features/today/useNow';
import { momentsMetrics as m, momentsTypography as t, streakLostColors } from '@/theme/moments';
import { borderWidth, componentMetrics as cm, layout, radius, useTheme } from '@/theme';

type Saved = { item: PendingRescue; via: 'ad' | 'free' };

// Seri koptu — design/StreakLost.dc.html. Bekleyen kurtarma (my_pending_rescues) için 24 saatlik süre:
// rewarded reklam ya da ayda 1 ücretsiz hak. Reklam yüklenemezse ücretsiz hak önerilir (CLAUDE.md).
// Koyu tasarımı yok; en yakın koyu rollere bağlandı (src/theme/moments.ts).
export default function StreakLostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const c = streakLostColors[scheme];
  const now = useNow();
  const { session } = useAuth();

  const rescues = usePendingRescues();
  const rescue = useRescueWithFreeRightMutation();
  const [saved, setSaved] = useState<Saved | null>(null);
  const [adFailed, setAdFailed] = useState(false);

  const current = saved?.item ?? rescues.data?.[0];
  const board = useChallengeBoard(current?.challengeId);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
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
    // TODO(AdMob): react-native-google-mobile-ads kurulunca: izin yoksa önce '/ad-consent' (UMP/ATT),
    // sonra rewarded reklam yükle ve göster; ödül sunucuda doğrulanınca (SSV) seri kurtarılır ve
    // setSaved({ item: current, via: 'ad' }). Şimdilik reklam hiç yüklenemiyor sayılır → ücretsiz hak önerilir.
    setAdFailed(true);
  };

  const onFree = () => {
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

  const onContinue = () => {
    // Başka bekleyen kurtarma varsa onu göster
    const next = (rescues.data ?? []).filter((r) => r.challengeId !== saved?.item.challengeId);
    if (next.length > 0) {
      setSaved(null);
      rescue.reset();
    } else {
      close();
    }
  };

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
              {(adFailed || rescue.error) && (
                <Toast
                  message={
                    rescue.error
                      ? rescue.error.message
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
                style={styles.adButton}
                icon={<SolidDropIcon color={c.adDrop} size={m.adDropSize} />}
                trailing={
                  <View style={[styles.adBadge, { backgroundColor: c.adBadgeBg }]}>
                    <Text style={[t.adBadge, { color: colors.onAction }]}>30 sn</Text>
                  </View>
                }
              />
              <FreeButton
                available={current.freeRescueAvailable}
                loading={rescue.isPending}
                highlighted={adFailed}
                onPress={onFree}
              />
              <Button title="Baştan başla" variant="text" size="md" onPress={close} />
            </>
          ) : (
            <Button title="Devam" onPress={onContinue} style={styles.tallButton} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** "Ücretsiz hakkımı kullan" — beyaz, 2 px kenarlı, altında hak bilgisi */
function FreeButton({
  available,
  loading,
  highlighted,
  onPress,
}: {
  available: boolean;
  loading: boolean;
  /** Reklam yüklenemedi: kenar aksiyon yeşiliyle vurgulanır */
  highlighted: boolean;
  onPress: () => void;
}) {
  const { colors, scheme } = useTheme();
  const c = streakLostColors[scheme];
  const border = highlighted && available ? colors.action : c.freeBorder;
  const disabled = !available || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      style={({ pressed }) => [
        styles.free,
        { backgroundColor: c.freeBg, borderColor: border, opacity: available ? 1 : 0.6 },
        pressed ? { transform: [{ translateY: cm.buttonShadow }] } : flatShadowStyle(cm.buttonShadow, border),
      ]}>
      <Text style={[t.freeTitle, { color: colors.text }]}>{loading ? 'Kurtarılıyor…' : 'Ücretsiz hakkımı kullan'}</Text>
      <Text style={[t.freeSub, { color: colors.textSecondary }]}>
        {available ? 'Ayda 1 hak · bu ay 1 hakkın var' : 'Ayda 1 hak · bu ayın hakkı kullanıldı'}
      </Text>
    </Pressable>
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
  free: {
    minHeight: m.freeButtonMinHeight,
    paddingVertical: m.freeButtonPaddingY,
    paddingHorizontal: m.freeButtonPaddingX,
    borderRadius: radius.button,
    borderWidth: borderWidth.thick,
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.freeButtonGap,
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
