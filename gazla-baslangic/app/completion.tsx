import { useRouter } from 'expo-router';
import { useMemo, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarStack } from '@/components/Avatar';
import Diken from '@/components/Diken';
import { Button, IconButton } from '@/components/ui';
import { adConsentShown, useFriendsToday, useRecentDays, useStreak } from '@/data';
import { accusative, joinNames } from '@/features/challenge/logic';
import Confetti from '@/features/moments/Confetti';
import { alsoParticle, weekCells } from '@/features/moments/logic';
import StreakCard from '@/features/moments/StreakCard';
import { celebrationColors as c, momentsMetrics as m, momentsTypography as t } from '@/theme/moments';
import { layout } from '@/theme';

/** Tasarım çerçevesi: 390 genişlik, içerik 56 px üst boşluktan başlar */
const DESIGN_WIDTH = 390;
const DESIGN_TOP = 56;

// Bugün tamam — design/Completion.dc.html. Günün tüm görevleri bitince açılır.
// Veri: my_streak (seri), my_recent_days (son 7 gün), friends_today (bitiren / bekleyen arkadaşlar).
// Koyu tasarımı yok; yeşil kutlama zemini iki modda aynı. İlk tamamlanan günden sonra kapatınca bir kez
// reklam izni ön ekranı açılır (EKRANLAR 6.2; cihazdaki adConsentShown bayrağı).
export default function CompletionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const streak = useStreak();
  const recent = useRecentDays(7);
  const friends = useFriendsToday();

  const week = useMemo(() => weekCells(recent.data ?? []), [recent.data]);
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

  const doneJoined = joinNames(done.map((f) => f.displayName));
  const doneText = done.length > 0 ? `${doneJoined} ${alsoParticle(doneJoined)} bugünü tamamladı.` : null;

  const pendingNames = pending.map((f) => f.displayName);
  const pokeText =
    pending.length === 0
      ? null
      : pending.length <= 2
        ? `${joinNames([...pendingNames.slice(0, -1), accusative(pendingNames[pendingNames.length - 1])])} gazla`
        : `${pendingNames[0]}, ${pendingNames[1]} ve diğerlerini gazla`;

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
        <View style={[styles.confetti, { top: dy }]}>
          <Confetti variant="completion" left={dx} />
        </View>

        <View style={styles.closeRow}>
          <IconButton icon="close" tone="onBrand" accessibilityLabel="Kapat" onPress={finish} />
        </View>

        <View style={styles.diken}>
          <Diken mood="cosku" stage="tam" gear="bant" size={m.completionDiken} />
        </View>

        <View style={styles.texts}>
          <Text accessibilityRole="header" style={[t.completionTitle, styles.center, { color: c.text }]}>
            Bugün tamam!
          </Text>
          <Text style={[t.completionSub, styles.center, { color: c.sub }]}>
            Diken kana kana su içti. Yarın yine bekliyor.
          </Text>
        </View>

        {streak.isPending || recent.isPending ? (
          <ActivityIndicator color={c.text} style={styles.loader} />
        ) : (
          streak.data && <StreakCard streak={streak.data.currentStreak} week={week} />
        )}

        {doneText && (
          <View style={styles.friends}>
            <AvatarStack
              people={done.slice(0, 2).map((f) => ({ id: f.id, name: f.displayName, tint: f.avatarTint, url: f.avatarUrl }))}
              size={m.stackAvatar}
              outlineColor={c.stackBorder}
              initialStyle={t.stackInitial}
            />
            <Text style={[t.friends, styles.friendsText, { color: c.sub }]}>{doneText}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Button title="Süper" variant="onGreen" onPress={finish} />
          {pokeText && (
            <Button
              title={pokeText}
              variant="text"
              color={c.linkText}
              onPress={() => router.push({ pathname: '/poke/[userId]', params: { userId: pending[0].id } })}
            />
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
