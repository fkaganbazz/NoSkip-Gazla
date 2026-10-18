import { StyleSheet, Text, View } from 'react-native';

import { typography, useTheme } from '@/theme';
import { exploreColors, exploreMetrics as m, exploreTypography } from '@/theme/explore';

// Keşfet banner reklam alanı (Explore.dc.html, 320 × 50).
// TODO(AdMob): react-native-google-mobile-ads kurulunca burada BannerAd (UMP izin durumuna göre)
// gösterilecek. Şimdilik yalnızca yer ayrılıyor; çizgili yer tutucu sadece geliştirme sürümünde görünür.
export default function AdBannerSlot() {
  const { scheme } = useTheme();
  const c = exploreColors[scheme];

  if (!__DEV__) {
    return <View style={styles.slot} />;
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.slot, styles.placeholder, { borderColor: c.adBorder, backgroundColor: c.adBg }]}>
      <View style={[styles.tag, { backgroundColor: c.adTagBg }]}>
        <Text style={[exploreTypography.adTag, { color: c.adTagText }]}>REKLAM</Text>
      </View>
      <Text style={[typography.meta, { color: c.adText }]}>Banner alanı · 320 × 50</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    marginTop: m.adMarginTop,
    height: m.adHeight,
  },
  placeholder: {
    borderRadius: m.adRadius,
    borderWidth: m.adBorderWidth,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.adGap,
  },
  tag: {
    paddingVertical: m.adTagPaddingY,
    paddingHorizontal: m.adTagPaddingX,
    borderRadius: m.adTagRadius,
  },
});
