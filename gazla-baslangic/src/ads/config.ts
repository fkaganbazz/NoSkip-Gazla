/**
 * Reklam birim kimlikleri ve ayarlar (yalnızca native; web eşi yok çünkü web'de reklam yok).
 * Kimlikler `.env` (EXPO_PUBLIC_ADMOB_*) ya da `app.config.ts` `extra.admob`'dan gelir. Boşsa ya da
 * geliştirme sürümündeyse Google'ın resmi TEST kimlikleri kullanılır (gerçek reklamla geliştirme
 * hesabın kapatılmasına yol açabilir).
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { AdsConsentDebugGeography, TestIds } from 'react-native-google-mobile-ads';

type UnitIds = { banner?: string; rewarded?: string };

const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

// EXPO_PUBLIC_* değişkenleri derlemede metne gömülür: her biri adıyla açıkça okunmalı
const envUnits: Record<'ios' | 'android', UnitIds> = {
  ios: {
    banner: clean(process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS),
    rewarded: clean(process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS),
  },
  android: {
    banner: clean(process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID),
    rewarded: clean(process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID),
  },
};

/** `extra.admob.{ios|android}.{banner|rewarded}` (app.config.ts) */
function extraUnits(platform: 'ios' | 'android'): UnitIds {
  const admob = (Constants.expoConfig?.extra as { admob?: Partial<Record<'ios' | 'android', UnitIds>> } | undefined)
    ?.admob;
  const units = admob?.[platform];
  return { banner: clean(units?.banner), rewarded: clean(units?.rewarded) };
}

function unitId(kind: keyof UnitIds, testId: string): string {
  if (__DEV__) return testId;
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return envUnits[platform][kind] ?? extraUnits(platform)[kind] ?? testId;
}

/** Keşfet banner'ı (4.1) */
export const bannerUnitId = () => unitId('banner', TestIds.BANNER);

/** Seri kurtarma rewarded reklamı (6.1) */
export const rewardedUnitId = () => unitId('rewarded', TestIds.REWARDED);

/**
 * Yalnızca geliştirme sürümünde: UMP test coğrafyası ve test cihazları.
 *   EXPO_PUBLIC_ADS_DEBUG_GEOGRAPHY=EEA          (AB izin formunu AB dışında görmek için; OTHER, REGULATED_US_STATE)
 *   EXPO_PUBLIC_ADS_TEST_DEVICE_IDS=abc123,def456 (gerçek cihazın konsolda yazan karma kimliği)
 */
export function debugConsentOptions(): { debugGeography?: AdsConsentDebugGeography; testDeviceIdentifiers?: string[] } {
  if (!__DEV__) return {};
  const geo = clean(process.env.EXPO_PUBLIC_ADS_DEBUG_GEOGRAPHY)?.toUpperCase();
  const debugGeography =
    geo === 'EEA'
      ? AdsConsentDebugGeography.EEA
      : geo === 'OTHER'
        ? AdsConsentDebugGeography.OTHER
        : geo === 'REGULATED_US_STATE'
          ? AdsConsentDebugGeography.REGULATED_US_STATE
          : undefined;
  const testDeviceIdentifiers = testDeviceIds();
  return {
    ...(debugGeography !== undefined ? { debugGeography } : null),
    ...(testDeviceIdentifiers.length ? { testDeviceIdentifiers } : null),
  };
}

/** Geliştirme sürümünde test reklamı alacak gerçek cihazlar (simülatör/emülatör kendiliğinden test cihazı) */
export function testDeviceIds(): string[] {
  if (!__DEV__) return [];
  return (clean(process.env.EXPO_PUBLIC_ADS_TEST_DEVICE_IDS) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
