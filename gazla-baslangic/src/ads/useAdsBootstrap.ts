/**
 * Uygulama açılışında bir kez: UMP izin bilgisini günceller (form GÖSTERMEZ; form yalnızca 6.2 ön
 * ekranındaki "Devam"dan sonra). İzin daha önce tamamlandıysa SDK başlatılır ve banner/rewarded
 * istekleri `requestNonPersonalizedAdsOnly` ile izne göre gider. Web'de durum 'unavailable'.
 *
 * Kök düzende (app/_layout.tsx RootNavigator) çağrılır.
 */
import { useEffect } from 'react';

import { refreshAds } from './consent';

export function useAdsBootstrap() {
  useEffect(() => {
    void refreshAds();
  }, []);
}
