import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarStack } from '@/components/Avatar';
import Diken from '@/components/Diken';
import { Button, IconButton } from '@/components/ui';
import { adConsentShown, useFriendsToday, useRecentDays, useStreak } from '@/data';
import Confetti from '@/features/moments/Confetti';
import { streakFlareKind, weekCells } from '@/features/moments/logic';
import StreakCard from '@/features/moments/StreakCard';
import StreakSpark from '@/features/moments/StreakSpark';
import { useCelebrationMotion } from '@/features/moments/useCelebrationMotion';
import { useT } from '@/i18n';
import { successHaptic } from '@/media/haptics';
import { celebrationColors as c, momentsMetrics as m, momentsTypography as ty } from '@/theme/moments';
import { layout } from '@/theme';

/** Tasarım çerçevesi: 390 genişlik, içerik 56 px üst boşluktan başlar */
const DESIGN_WIDTH = 390;
const DESIGN_TOP = 56;

// Bugün tamam — design/Completion.dc.html. Günün tüm görevleri bitince açılır.
// Veri: my_streak (seri), my_recent_days (son 7 gün), friends_today (bitiren / bekleyen arkadaşlar).
// Koyu tasarımı yok; yeşil kutlama zemini iki modda aynı. İlk tamamlanan günden sonra kapatınca bir kez
// reklam izni ön ekranı açılır (EKRANLAR 6.2; cihazdaki adConsentShown bayrağı).
// Diken'in giriş zıplaması + konfeti (reanimated; "hareketi azalt" açıksa durağan). Bugün tamamlandıysa seri kartı
// kutlanır: Diken'den bugünün dairesine kıvılcım uçar, gün dolar, alev harlanır ve sayı artar (ilk gün alev tutuşur,
// 7/30/100/365. günde kart alev alır); titreşimleri kart çalar. Kutlama yoksa ya da hareket azaltılmışsa açılışta tek
// "başarılı" titreşimi (expo-haptics; web'de yok). Hareket bitince görünüm tasarımla birebir.
export default function CompletionScreen() {
  const router = useRouter();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const streak = useStreak();
  const recent = useRecentDays(7);
  const friends = useFriendsToday();
  const { dikenStyle, confettiStyle } = useCelebrationMotion();
  const reduced = useReducedMotion();

  const week = useMemo(() => weekCells(recent.data ?? [], t), [recent.data, t]);
  // İşaretlemeden hemen sonra açılır: önbellekteki seri eski olabilir, yenilenmesi bitince karar verilir
  const ready = !streak.isPending && !recent.isPending && !streak.isFetching && !recent.isFetching;
  const currentStreak = streak.data?.currentStreak ?? 0;
  // Kutlama türü veriler gelince bir kez belirlenir (sonradan yenilenen veri kartı yeniden oynatmasın)
  const [flare, setFlare] = useState<ReturnType<typeof streakFlareKind> | undefined>(undefined);
  useEffect(() => {
    if (!ready || flare !== undefined) return;
    const kind = streak.data ? streakFlareKind(streak.data.currentStreak, week) : null;
    setFlare(kind);
    // Kutlamanın titreşimlerini kart çalar; kutlama yoksa açılışta bir kez
    if (!kind || reduced) successHaptic();
  }, [ready, flare, streak.data, week, reduced]);

  // Kıvılcımın başlangıcı (Diken'in tepesi) ve hedefi (bugünün dairesi), içerik koordinatlarında
  const [dikenTop, setDikenTop] = useState<{ x: number; y: number } | null>(null);
  const [cardOrigin, setCardOrigin] = useState<{ x: number; y: number } | null>(null);
  const [todayInCard, setTodayInCard] = useState<{ x: number; y: number } | null>(null);
  const sparkTarget = cardOrigin && todayInCard ? { x: cardOrigin.x + todayInCard.x, y: cardOrigin.y + todayInCard.y } : null;
  const done = (friends.data ?? []).filter((f) => f.doneToday === true);
  const pending = (friends.data ?? []).filter((f) => f.doneToday === false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Kapatınca (Süper / X): reklam izni ön ekranı daha önce gösterilmediyse onun yerine geç
  const finishing = useRef(false);
  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    if (!(await adConsentShown.get())) {
      await adConsentShown.set();
      router.replace('/ad-consent');
      return;
    }
    close();
  };

  const top = insets.top + layout.screenTopGap;
  // Arka plan süsleri tasarım çerçevesine göre konumlu; ekran genişliğine ortalanır
  const dx = (width - DESIGN_WIDTH) / 2;
  const dy = top - DESIGN_TOP;

  const doneText = done.length > 0 ? t.moments.completion.friendsDone(done.map((f) => f.displayName)) : null;
  // Bekleyenleri dürtme bağlantısı: "Ece'yi gazla", "Ece ve Selin'i gazla", "Ece, Selin ve diğerlerini gazla"
  const pokeText = pending.length === 0 ? null : t.moments.completion.hypeUp(pending.map((f) => f.displayName));

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: top, paddingBottom: Math.max(m.bottomPadding, insets.bottom) },
        ]}>
        <View
          style={[
            styles.ring,
            { left: m.ringOuterLeft + dx, top: m.ringOuterTop + dy, width: m.ringOuter, height: m.ringOuter, borderRadius: m.ringOuter / 2, backgroundColor: c.ringOuter },
          ]}
        />
        <View
          style={[
            styles.ring,
            { left: m.ringInnerLeft + dx, top: m.ringInnerTop + dy, width: m.ringInner, height: m.ringInner, borderRadius: m.ringInner / 2, backgroundColor: c.ringInner },
          ]}
        />
        <Animated.View style={[styles.confetti, { top: dy }, confettiStyle]}>
          <Confetti variant="completion" left={dx} />
        </Animated.View>

        <View style={styles.closeRow}>
          <IconButton icon="close" tone="onBrand" accessibilityLabel={t.common.close} onPress={finish} />
        </View>

        <Animated.View
          style={[styles.diken, dikenStyle]}
          onLayout={(e) => {
            const { x, y, width } = e.nativeEvent.layout;
            setDikenTop({ x: x + width / 2, y: y + m.sparkFromTop });
          }}>
          <Diken mood="cosku" stage="tam" gear="bant" size={m.completionDiken} />
        </Animated.View>

        <View style={styles.texts}>
          <Text accessibilityRole="header" style={[ty.completionTitle, styles.center, { color: c.text }]}>
            {t.moments.completion.title}
          </Text>
          <Text style={[ty.completionSub, styles.center, { color: c.sub }]}>
            {flare === 'start'
              ? t.moments.completion.startSub
              : flare === 'milestone'
                ? t.moments.completion.milestoneSub(currentStreak)
                : t.moments.completion.sub}
          </Text>
        </View>

        {!ready || flare === undefined ? (
          <ActivityIndicator color={c.text} style={styles.loader} />
        ) : (
          streak.data && (
            <StreakCard
              streak={streak.data.currentStreak}
              week={week}
              flare={flare}
              onLayout={(e) => setCardOrigin({ x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y })}
              onTodayCenter={(x, y) => setTodayInCard({ x, y })}
            />
          )
        )}

        {doneText && (
          <View style={styles.friends}>
            <AvatarStack
              people={done.slice(0, 2).map((f) => ({ id: f.id, name: f.displayName, tint: f.avatarTint, url: f.avatarUrl }))}
              size={m.stackAvatar}
              outlineColor={c.stackBorder}
              initialStyle={ty.stackInitial}
            />
            <Text style={[ty.friends, styles.friendsText, { color: c.sub }]}>{doneText}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Button title={t.moments.completion.great} variant="onGreen" onPress={finish} />
          {pokeText && (
            <Button
              title={pokeText}
              variant="text"
              color={c.linkText}
              onPress={() => router.push({ pathname: '/poke/[userId]', params: { userId: pending[0].id } })}
            />
          )}
        </View>

        {flare && !reduced && dikenTop && sparkTarget && <StreakSpark from={dikenTop} to={sparkTarget} />}
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
    overflow: 'hidden',
  },
  ring: {
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
    marginTop: m.completionDikenTop,
    alignItems: 'center',
    // Zıplamada ölçek saksının tabanından (yere basar)
    transformOrigin: 'bottom',
  },
  texts: {
    marginTop: m.completionTextTop,
    alignItems: 'center',
    gap: m.completionTextGap,
  },
  center: {
    textAlign: 'center',
  },
  loader: {
    marginTop: m.streakCardTop,
  },
  friends: {
    marginTop: m.friendsTop,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.friendsGap,
  },
  friendsText: {
    flexShrink: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: m.friendsTop,
    gap: m.footerGap,
  },
});
