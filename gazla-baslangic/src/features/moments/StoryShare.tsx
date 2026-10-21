/**
 * Story paylaşımı (EKRANLAR 2.7): ShareCard bir ekran değil, görüntüye çevrilen bir görünüm.
 *
 *   const story = useStoryShare();
 *   <ShareCardCapture story={story} {...kartVerisi} />   // ekranın kökünde, içerikten ÖNCE (altında kalır)
 *   <Button title="Story'de paylaş" loading={story.busy} onPress={() => story.share({ … })} />
 *
 * Kart (360×640) ekranın arkasında çizili durur (görünmez; ekran içeriği opak zeminle üstünü örter).
 * Ekran dışına konmaz: iOS anlık görüntüsü (drawViewHierarchyInRect) ekranda olmayan görünümü boş çizebilir.
 * Paylaşırken react-native-view-shot ile tam 1080×1920 PNG'ye çevrilir, expo-sharing sayfası açılır
 * (Instagram Story, WhatsApp, Kaydet …). Web'de PNG paylaşılır ya da indirilir. Görsel üretilemezse
 * eski metin paylaşımına düşülür.
 */
import { useCallback, useRef, useState, type ComponentProps } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { shareFileName } from '@/media/imageOutput';
import { captureViewAsPng, shareImageFile } from '@/media/shareImage';
import { momentsMetrics as m } from '@/theme/moments';

import ShareCard from './ShareCard';

export type StoryShareResult = 'shared' | 'downloaded' | 'text' | 'error';

type ShareInput = {
  /** Dosya adının kökü (challenge adı) → "gazla-uyaninca-1-saat-telefonsuz.png" */
  fileBase: string;
  /** Görsel üretilemezse paylaşılacak metin */
  fallbackMessage: string;
};

const DIALOG_TITLE = "Story'de paylaş";

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export function useStoryShare() {
  const ref = useRef<View>(null);
  const laidOut = useRef(false);
  const [busy, setBusy] = useState(false);

  const onLayout = useCallback(() => {
    laidOut.current = true;
  }, []);

  const share = useCallback(async ({ fileBase, fallbackMessage }: ShareInput): Promise<StoryShareResult> => {
    setBusy(true);
    try {
      try {
        // Kart henüz yerleşmediyse bir kare bekle (çizim bitsin)
        if (!laidOut.current) await nextFrame();
        await nextFrame();
        const uri = await captureViewAsPng(ref, { width: m.shareImageWidth, height: m.shareImageHeight });
        const result = await shareImageFile(uri, { dialogTitle: DIALOG_TITLE, fileName: shareFileName(fileBase) });
        if (result !== 'unavailable') return result;
      } catch {
        // Görsel üretilemedi ya da dosya paylaşılamadı: metne düş
      }
      await Share.share({ message: fallbackMessage, title: DIALOG_TITLE });
      return 'text';
    } catch {
      return 'error';
    } finally {
      setBusy(false);
    }
  }, []);

  return { ref, onLayout, busy, share };
}

export type StoryShare = ReturnType<typeof useStoryShare>;

/** Görüntüye çevrilecek kart: ekranın arkasında, erişilebilirlik ağacının ve dokunmanın dışında */
export function ShareCardCapture({ story, ...card }: { story: StoryShare } & ComponentProps<typeof ShareCard>) {
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.host}>
      <View ref={story.ref} collapsable={false} onLayout={story.onLayout}>
        <ShareCard {...card} />
      </View>
    </View>
  );
}

/** Metin paylaşımı (görsel üretilemezse): "30 GÜN · başlık. Ad başardı. Sıra sende. Gazla'da beni bul · @kullanıcı" */
export function storyShareMessage({
  durationDays,
  title,
  name,
  username,
}: Pick<ComponentProps<typeof ShareCard>, 'durationDays' | 'title' | 'name' | 'username'>) {
  return `${durationDays} GÜN · ${title}. ${name} başardı. Sıra sende. Gazla'da beni bul · @${username}`;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    top: 0,
    pointerEvents: 'none',
  },
});
