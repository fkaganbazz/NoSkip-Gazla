/**
 * AdMob banner (native) — 320 × 50 (BannerAdSize.BANNER; Keşfet listenin içinde, ekrana çapalı değil).
 * Yüklenene kadar 0 × 0 çizilir (yer tutucu yok); yerleşim ve "REKLAM" etiketi çağıranın işi.
 * Web eşi: AdBanner.web.tsx (hiçbir şey çizmez).
 */
import { useMemo } from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { bannerUnitId } from './config';

export type AdBannerProps = {
  nonPersonalized: boolean;
  onLoaded: () => void;
  onFailed: () => void;
};

export default function AdBanner({ nonPersonalized, onLoaded, onFailed }: AdBannerProps) {
  const requestOptions = useMemo(() => ({ requestNonPersonalizedAdsOnly: nonPersonalized }), [nonPersonalized]);
  const unitId = useMemo(bannerUnitId, []);

  return (
    <BannerAd
      unitId={unitId}
      size={BannerAdSize.BANNER}
      requestOptions={requestOptions}
      onAdLoaded={onLoaded}
      onAdFailedToLoad={onFailed}
    />
  );
}
