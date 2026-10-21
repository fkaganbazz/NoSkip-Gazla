/**
 * Web: reklam yok (react-native-google-mobile-ads web'de çalışmaz). consent.ts ile aynı dışa aktarımlar;
 * durum hep 'unavailable', formlar 'notRequired'.
 */
import { setAdsState, type AdsState } from './state';

export type PrivacyOptionsResult = 'shown' | 'notRequired' | 'failed';

const unavailable = (): Promise<AdsState> =>
  Promise.resolve(setAdsState({ phase: 'unavailable', nonPersonalized: true, privacyOptionsRequired: false }));

export const refreshAds = unavailable;

export const runConsentFlow = unavailable;

export async function openPrivacyOptions(): Promise<PrivacyOptionsResult> {
  return 'notRequired';
}

export const resetConsentForTesting = unavailable;
