import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ToastHost, useToast } from '@/components/ui';
import ShareCard from '@/features/moments/ShareCard';
import { ShareCardCapture, storyShareMessage, useStoryShare } from '@/features/moments/StoryShare';
import { layout, typography, useTheme } from '@/theme';
import { momentsMetrics as m } from '@/theme/moments';

// Geliştirme önizlemesi: ShareCard (design/ShareCard.dc.html) tasarımdaki örnek veriyle, ekrana sığacak kadar
// küçültülmüş. ShareCard uygulamada bir ekran değil (EKRANLAR 2.7): Finished "Story'de paylaş" kartı
// görüntüye çevirir. "PNG paylaş" aynı yolu dener (1080×1920 PNG → paylaşım sayfası; web'de indirme).
const SAMPLE = {
  durationDays: 30,
  title: 'Uyanınca 1 saat telefonsuz',
  name: 'Deniz',
  username: 'deniz.k',
  stage: 'cicek',
} as const;

export default function ShareCardPreview() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const story = useStoryShare();
  const toast = useToast();
  // Kart 360×640; açıklama ve buton arasındaki alana sığacak kadar küçültülür (büyütülmez)
  const [area, setArea] = useState<{ width: number; height: number }>({ width: m.cardWidth, height: m.cardHeight });
  const scale = Math.min(1, area.width / m.cardWidth, area.height / m.cardHeight);

  const share = async () => {
    const result = await story.share({ fileBase: SAMPLE.title, fallbackMessage: storyShareMessage(SAMPLE) });
    toast.show({
      message:
        result === 'downloaded'
          ? 'PNG indirildi (1080×1920).'
          : result === 'shared'
            ? 'Paylaşım sayfası açıldı.'
            : result === 'text'
              ? 'Görsel üretilemedi; metin paylaşıldı.'
              : 'Paylaşım açılamadı.',
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'ShareCard' }} />
      <ShareCardCapture story={story} {...SAMPLE} />
      <View style={[styles.content, { backgroundColor: colors.background, paddingBottom: layout.screenPadding + insets.bottom }]}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Ekran değil: Finished → “Story’de paylaş” bu kartı 1080×1920 PNG’ye çevirip paylaşır.
        </Text>
        <View
          style={styles.previewArea}
          onLayout={(e) => setArea({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
          <View
            style={[
              styles.preview,
              { width: m.cardWidth * scale, height: m.cardHeight * scale, borderRadius: m.previewRadius * scale },
            ]}>
            <View style={{ transform: [{ scale }], transformOrigin: 'top left' }}>
              <ShareCard {...SAMPLE} />
            </View>
          </View>
        </View>
        <Button title="PNG paylaş" loading={story.busy} onPress={share} />
      </View>
      <ToastHost toast={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: layout.screenPadding,
    paddingHorizontal: layout.screenPadding,
    gap: m.previewGap,
  },
  previewArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    overflow: 'hidden',
  },
});
