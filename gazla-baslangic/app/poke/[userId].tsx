import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Diken from '@/components/Diken';
import { SendIcon } from '@/components/icons';
import Sheet, { type SheetHandle } from '@/components/Sheet';
import SpeechBubble from '@/components/SpeechBubble';
import { Avatar, Button, ErrorState, IconButton, LoadingState, Segmented, Toast } from '@/components/ui';
import {
  ApiError,
  useFriendProfile,
  useFriendsToday,
  usePokeMessages,
  usePokeStatus,
  useSendPokeMutation,
  useUndoPokeMutation,
  type PokeTone,
} from '@/data';
import { ShieldIcon } from '@/features/friends/icons';
import { toAccusative, toDative } from '@/features/friends/names';
import MessageGrid from '@/features/poke/MessageGrid';
import { componentColors, componentMetrics as cm, componentTypography, typography, useTheme } from '@/theme';
import { sheetDikenMetrics } from '@/theme/sheet';
import { socialColors, socialMetrics as m, socialTypography } from '@/theme/social';

const d = sheetDikenMetrics.poke;

/** Geri alma süresi (sunucudaki pokes delete politikasıyla aynı) */
const UNDO_MS = 30_000;

/** Tasarımdaki ilk seçim: gazda ilk mesaj, lafta ikinci */
const defaultIndex = (tone: PokeTone) => (tone === 'roast' ? 1 : 0);

// Dürt — design/Poke.dc.html (alt sayfa, `Sheet`; üstünde Diken + balon). Hazır mesajlar src/content/pokes.ts
// (usePokeMessages). "Laf sok" yalnızca alıcının sert modu açıksa seçilebilir; kapalıysa sekme pasif görünür.
// Günlük sınır (usePokeStatus): hak bitince gönder pasif. Gönderince 30 sn "Geri al" tostu, süre bitince
// sayfa kapanır. Parametreler: userId; isteğe bağlı tone ('hype' — "Gaz ver" butonlarından) ve challengeId.
export default function PokeSheet() {
  const params = useLocalSearchParams<{ userId: string; tone?: PokeTone; challengeId?: string }>();
  const userId = params.userId;
  const router = useRouter();
  const sheet = useRef<SheetHandle>(null);
  const { colors, scheme } = useTheme();
  const c = socialColors[scheme];

  const friends = useFriendsToday();
  const profile = useFriendProfile(userId);
  const messages = usePokeMessages();
  const status = usePokeStatus(userId);
  const send = useSendPokeMutation();
  const undo = useUndoPokeMutation();

  const friend = friends.data?.find((f) => f.id === userId);
  const person = friend ?? profile.data ?? null;
  const harsh = status.data?.harshMode ?? friend?.harshMode ?? profile.data?.harshMode ?? false;
  /** Bugünkü dürtme hakkı bitti (geri alınanlar da sayılır); gönderip geri alınca da yenilenir */
  const limitReached = status.data?.remaining === 0;

  const [tone, setTone] = useState<PokeTone | null>(params.tone ?? null);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  // Sert mod kapalıysa her zaman gaz; açıksa tasarımdaki gibi "Laf sok" seçili açılır
  const activeTone: PokeTone = !harsh ? 'hype' : (tone ?? 'roast');
  const list = useMemo(
    () =>
      (messages.data ?? [])
        .filter((x) => x.isActive && x.tone === activeTone)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [messages.data, activeTone],
  );
  const selectedKey =
    pickedKey && list.some((x) => x.key === pickedKey)
      ? pickedKey
      : ((list[defaultIndex(activeTone)] ?? list[0])?.key ?? null);

  // Sayfa kapanınca (kaydırma, karartma, kapat butonu) route'tan çık
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/friends'));
  const close = () => sheet.current?.close();

  // Geri alma süresi bitince sayfa kendiliğinden kapanır
  useEffect(() => {
    if (!sentId) return;
    const id = setTimeout(() => sheet.current?.close(), UNDO_MS);
    return () => clearTimeout(id);
  }, [sentId]);

  const loading = messages.isPending || (friends.isPending && profile.isPending);

  const body = () => {
    if (loading) return <LoadingState />;
    if (messages.isError) return <ErrorState onRetry={() => messages.refetch()} />;
    if (!person) return <ErrorState message="Bu kişiyi şu an dürtemezsin." />;

    const name = person.displayName;
    const doneToday = friend?.doneToday ?? null;
    const title =
      doneToday === false ? `${name} bugün hâlâ yok` : doneToday === true ? `${name} bugünü tamamladı` : name;
    const sub = friend
      ? [friend.sharedChallengeTitle, `${friend.streak} gün seri`].filter(Boolean).join(' · ')
      : profile.data
        ? `${profile.data.streak} gün seri`
        : '';
    const note = !harsh
      ? `${name} sert modu açmamış, sadece gaz verebilirsin.`
      : activeTone === 'roast'
        ? `${name} sert modu açtı, laf sokabilirsin.`
        : 'Gaz mesajları herkese her zaman açık.';
    const error = [send.error, undo.error].find((e) => e instanceof ApiError) as ApiError | undefined;
    const limitNote =
      status.data?.remaining === 0 ? `Bugün ${toAccusative(name)} ${status.data.dailyLimit} kez dürttün, yarın yine dene.` : null;

    return (
      <>
        <View style={styles.header}>
          <Avatar
            name={person.displayName}
            tint={person.avatarTint}
            url={person.avatarUrl}
            size={m.pokeAvatarOuter}
            ring={doneToday === false ? 'pending' : null}
            decorative
          />
          <View style={styles.headerTexts}>
            <Text accessibilityRole="header" style={[socialTypography.pokeTitle, { color: colors.text }]}>
              {title}
            </Text>
            {!!sub && <Text style={[typography.meta, { color: colors.textSecondary }]}>{sub}</Text>}
          </View>
          <IconButton icon="close" accessibilityLabel="Kapat" onPress={close} />
        </View>

        <View style={styles.segment}>
          <Segmented<PokeTone>
            size="lg"
            textSize="lg"
            role="tabs"
            accessibilityLabel="Mesaj türü"
            options={[
              { value: 'hype', label: 'Gaz ver' },
              { value: 'roast', label: 'Laf sok' },
            ]}
            value={activeTone}
            onChange={(t) => {
              // Sert mod kapalıyken "Laf sok" seçilemez
              if (t === 'roast' && !harsh) return;
              setTone(t);
              setPickedKey(null);
            }}
            selectedColor={(t) => (t === 'roast' ? c.roastText : colors.actionText)}
          />
          {/* Ortak Segmented'de pasif seçenek yok: "Laf sok" hücresini kap rengindeki yarı saydam örtü soluklaştırır
              ve dokunmayı tutar (açıklama altındaki satırda) */}
          {!harsh && (
            <View
              accessible
              accessibilityLabel={`Laf sok kapalı. ${name} sert modu açmamış.`}
              aria-disabled
              style={[styles.veil, { backgroundColor: componentColors[scheme].segmentTrack }]}
            />
          )}
        </View>

        <View style={styles.note}>
          <ShieldIcon color={colors.textSecondary} size={m.noteIconSize} strokeWidth={m.noteIconStrokeWidth} />
          <Text style={[typography.meta, styles.noteText, { color: colors.textBody }]}>{note}</Text>
        </View>

        <MessageGrid messages={list} selectedKey={selectedKey} onSelect={setPickedKey} />

        <View style={styles.footer}>
          {!!error && (
            <Text
              accessibilityLiveRegion="polite"
              style={[componentTypography.inputError, styles.error, { color: colors.dangerText }]}>
              {error.message}
            </Text>
          )}
          {!!limitNote && !sentId && !error && (
            <Text accessibilityLiveRegion="polite" style={[typography.meta, styles.error, { color: colors.textBody }]}>
              {limitNote}
            </Text>
          )}
          {sentId ? (
            <Toast
              message={`${toDative(name)} gönderildi`}
              action={{
                label: 'Geri al',
                onPress: () => undo.mutate(sentId, { onSuccess: () => setSentId(null) }),
              }}
            />
          ) : (
            <Button
              title={`${toDative(name)} gönder`}
              icon={(color) => <SendIcon color={color} size={cm.buttonIconSize} strokeWidth={cm.buttonIconStroke} />}
              loading={send.isPending}
              disabled={!selectedKey || limitReached}
              onPress={() => {
                if (!selectedKey) return;
                undo.reset();
                send.mutate(
                  {
                    recipientId: userId,
                    tone: activeTone,
                    messageKey: selectedKey,
                    challengeId: params.challengeId ?? friend?.sharedChallengeId ?? undefined,
                  },
                  { onSuccess: (poke) => setSentId(poke.id) },
                );
              }}
            />
          )}
        </View>
      </>
    );
  };

  // Diken'in sözü (tasarımda sert mod açık hali; kapalı hali tasarlanmadı, aynı kalıpta: gaz vermeye çağırır)
  const top = person ? (
    <View style={styles.top}>
      <View style={styles.diken}>
        <Diken mood="laf" stage="tam" size={sheetDikenMetrics.dikenSize} />
      </View>
      <SpeechBubble size="sm" tail="left" tailOffset={d.tailTop} shadow="none" style={styles.bubble}>
        {harsh ? `${person.displayName} sert modu açmış. Acıma.` : `${person.displayName} sert modu açmamış. Gazla bari.`}
      </SpeechBubble>
    </View>
  ) : null;

  return (
    <Sheet
      ref={sheet}
      onClose={leave}
      top={top}
      minHeight={m.sheetMinHeight}
      accessibilityLabel={person ? `${person.displayName} için dürt` : 'Dürt'}>
      {body()}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  top: {
    height: sheetDikenMetrics.dikenHeight,
    marginBottom: -d.overlap,
  },
  diken: {
    position: 'absolute',
    left: d.dikenLeft,
    top: 0,
  },
  bubble: {
    position: 'absolute',
    left: d.bubbleLeft,
    top: d.bubbleTop,
    width: d.bubbleWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.pokeHeaderGap,
  },
  headerTexts: {
    flex: 1,
    gap: m.pokeTitleGap,
  },
  segment: {
    marginTop: m.segmentMarginTop,
  },
  // Sağ yarı ("Laf sok" hücresi + kap kenarı); köşeler kapla aynı
  veil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '50%',
    opacity: m.segmentVeilOpacity,
    borderTopRightRadius: cm.segmentTrackRadius,
    borderBottomRightRadius: cm.segmentTrackRadius,
  },
  note: {
    marginTop: m.noteMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.noteGap,
  },
  noteText: {
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: m.sendMarginTop,
  },
  error: {
    marginBottom: m.pokeErrorMarginBottom,
    textAlign: 'center',
  },
});
