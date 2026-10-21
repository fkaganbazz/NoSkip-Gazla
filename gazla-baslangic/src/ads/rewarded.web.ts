/** Web: rewarded reklam yok → hemen "yüklenemedi" (ücretsiz hak öne çıkar). rewarded.ts ile aynı imza. */
import type { RewardedCallbacks } from './logic';

export type RewardedRequest = {
  ssv: { userId?: string; customData?: string };
  nonPersonalized: boolean;
  timeoutMs: number;
};

export function startRewardedAd(_request: RewardedRequest, callbacks: RewardedCallbacks): () => void {
  const t = setTimeout(() => callbacks.onFailed('unavailable'), 0);
  return () => clearTimeout(t);
}
