import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { AdBanner, useAdsState } from '@/ads';
import { spacing, useTheme } from '@/theme';
import { exploreColors, exploreMetrics as m, exploreTypography } from '@/theme/explore';

type Load = 'loading' | 'loaded' | 'failed';

// Keşfet banner reklamı (Explore.dc.html: 320 × 50, "REKLAM" etiketli). Yalnızca reklam izni tamamsa
// istenir. Yüklenene kadar hiçbir şey çizilmez (yer tutucu yok); yüklenemezse alan tamamen kapanır.
// Web'de reklam yok: bileşen hiç çizilmez.
export default function AdBannerSlot() {
  const { scheme } = useTheme();
  const c = exploreColors[scheme];
  const ads = useAdsState();
  const [load, setLoad] = useState<Load>('loading');

  if (Platform.OS === 'web' || ads.phase !== 'ready' || load === 'failed') return null;

  const loaded = load === 'loaded';
  return (
    <View
      style={loaded ? styles.slot : styles.pending}
      accessibilityElementsHidden={!loaded}
      importantForAccessibility={loaded ? 'auto' : 'no-hide-descendants'}>
      {loaded && (
        <View style={[styles.tag, { backgroundColor: c.adTagBg }]}>
          <Text style={[exploreTypography.adTag, { color: c.adTagText }]}>REKLAM</Text>
        </View>
      )}
      <AdBanner
        nonPersonalized={ads.nonPersonalized}
        onLoaded={() => setLoad('loaded')}
        onFailed={() => setLoad('failed')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Yüklenirken banner 0 × 0: alan yer kaplamaz
  pending: {
    alignSelf: 'center',
  },
  slot: {
    marginTop: m.adMarginTop,
    alignSelf: 'center',
    gap: spacing.xxs,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingVertical: m.adTagPaddingY,
    paddingHorizontal: m.adTagPaddingX,
    borderRadius: m.adTagRadius,
  },
});
