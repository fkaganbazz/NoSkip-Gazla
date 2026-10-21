/**
 * Rewarded reklam (native) — seri kurtarma (6.1). Ödül sunucuda AdMob SSV ile doğrulanır:
 * `serverSideVerificationOptions` (userId + customData) isteğe eklenir. Akış mantığı logic.ts `runRewarded`.
 * Web eşi: rewarded.web.ts.
 */
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  type ServerSideVerificationOptions,
} from 'react-native-google-mobile-ads';

import { rewardedUnitId } from './config';
import { runRewarded, type RewardedAdapter, type RewardedCallbacks } from './logic';

export type RewardedRequest = {
  ssv: ServerSideVerificationOptions;
  nonPersonalized: boolean;
  timeoutMs: number;
};

/** Reklamı yükler ve gösterir; dönen fonksiyon iptal eder */
export function startRewardedAd(request: RewardedRequest, callbacks: RewardedCallbacks): () => void {
  let ad: RewardedAd;
  try {
    ad = RewardedAd.createForAdRequest(rewardedUnitId(), {
      requestNonPersonalizedAdsOnly: request.nonPersonalized,
      serverSideVerificationOptions: request.ssv,
    });
  } catch {
    const t = setTimeout(() => callbacks.onFailed('error'), 0);
    return () => clearTimeout(t);
  }

  const adapter: RewardedAdapter = {
    load: () => ad.load(),
    show: () => ad.show(),
    on: (event, listener) => {
      switch (event) {
        case 'loaded':
          ad.addAdEventListener(RewardedAdEventType.LOADED, listener);
          break;
        case 'earned':
          ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, listener);
          break;
        case 'closed':
          ad.addAdEventListener(AdEventType.CLOSED, listener);
          break;
        case 'error':
          ad.addAdEventListener(AdEventType.ERROR, listener);
          break;
      }
    },
    destroy: () => ad.destroy(),
  };

  return runRewarded(adapter, callbacks, { timeoutMs: request.timeoutMs });
}
