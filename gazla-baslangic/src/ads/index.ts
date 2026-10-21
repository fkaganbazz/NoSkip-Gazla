/**
 * Reklam (AdMob + UMP izin formu + iOS ATT). Ekranlar yalnızca buradan alır: `import { … } from '@/ads'`.
 * Native modül dosyalarının web eşleri var (`*.web.ts(x)`): web'de reklam yok, hiçbir şey çökmez.
 * Günlük işaretleme akışında asla reklam yok (CLAUDE.md): banner yalnızca Keşfet'te, rewarded yalnızca
 * StreakLost'ta kullanıcı isteyince.
 */
export { default as AdBanner, type AdBannerProps } from './AdBanner';
export { openPrivacyOptions, refreshAds, resetConsentForTesting, runConsentFlow, type PrivacyOptionsResult } from './consent';
export { REWARDED_LOAD_TIMEOUT_MS, type RewardedFailure } from './logic';
export { getAdsState, useAdsState, type AdsPhase, type AdsState } from './state';
export { useAdsBootstrap } from './useAdsBootstrap';
export { useRewardedAd, type RewardedStatus, type WatchOptions } from './useRewardedAd';
