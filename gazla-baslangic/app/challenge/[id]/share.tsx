import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ErrorState, IconButton, LoadingState, Toast } from '@/components/ui';
import { useAuth, useChallenge, useGarden } from '@/data';
import ShareCard from '@/features/moments/ShareCard';
import { momentsMetrics as m } from '@/theme/moments';
import { componentMetrics as cm, layout } from '@/theme';

// Paylaşım kartı — design/ShareCard.dc.html. Tasarım yalnızca kartın kendisi; ekran kartı ortalar,
// altta "Paylaş" butonu. Şimdilik metin paylaşılır: kartı görsel olarak paylaşmak için
// react-native-view-shot gerekiyor (kurulu değil).
export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { profile } = useAuth();
  const challenge = useChallenge(id);
  const garden = useGarden();
  const [error, setError] = useState<string | null>(null);

  const top = insets.top + layout.screenTopGap;
  const bottom = Math.max(m.bottomPadding, insets.bottom);

  if (challenge.isPending) {
    return (
      <View style={[styles.screen, { paddingTop: top }]}>
        <View style={styles.header}>
          <IconButton icon="close" accessibilityLabel="Kapat" />
        </View>
        <LoadingState />
      </View>
    );
  }

  if (challenge.error || !challenge.data) {
    return (
      <View style={[styles.screen, { paddingTop: top }]}>
        <View style={styles.header}>
          <IconButton icon="close" accessibilityLabel="Kapat" />
        </View>
        <ErrorState message={challenge.error?.message} onRetry={() => challenge.refetch()} />
      </View>
    );
  }

  const ch = challenge.data;
  const name = profile?.displayName ?? '';
  const username = profile?.username ?? '';
  const stage = garden.data?.find((g) => g.challengeId === ch.id)?.stage ?? 'cicek';

  // Kart 360×640; ekrana sığacak kadar küçültülür (büyütülmez)
  const availableHeight = height - top - bottom - cm.iconButton - cm.button.lg.height - cm.button.lg.shadow - 2 * m.previewGap;
  const scale = Math.min(1, (width - 2 * layout.screenPadding) / m.cardWidth, availableHeight / m.cardHeight);

  const onShare = async () => {
    setError(null);
    try {
      // TODO(view-shot): kartı PNG olarak yakalayıp `url` ile paylaş (react-native-view-shot kurulunca)
      await Share.share({
        message: `${ch.durationDays} GÜN · ${ch.title}. ${name} başardı. Sıra sende. Gazla'da beni bul · @${username}`,
      });
    } catch {
      setError('Paylaşım açılamadı. Tekrar dene.');
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: top, paddingBottom: bottom }]}>
      <View style={styles.header}>
        <IconButton icon="close" accessibilityLabel="Kapat" />
      </View>

      <View style={styles.previewArea}>
        <View
          style={[
            styles.preview,
            { width: m.cardWidth * scale, height: m.cardHeight * scale, borderRadius: m.previewRadius * scale },
          ]}>
          <View style={{ transform: [{ scale }], transformOrigin: 'top left' }}>
            <ShareCard durationDays={ch.durationDays} title={ch.title} name={name} username={username} stage={stage} />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        {error && <Toast message={error} />}
        <Button title="Paylaş" onPress={onShare} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  previewArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m.previewGap,
  },
  preview: {
    overflow: 'hidden',
  },
  footer: {
    gap: m.previewGap,
  },
});
