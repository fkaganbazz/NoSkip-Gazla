/**
 * Reklam izni ve SDK başlatma (native). Sıra (Google/Apple kuralları):
 *   açılış: UMP izin bilgisi güncellenir (form GÖSTERİLMEZ) → izin zaten tamamsa SDK başlatılır
 *   6.2 "Devam": UMP formu (gerekiyorsa, AB/İngiltere) → iOS ATT → SDK başlatılır
 * `mobileAds().initialize()` yalnızca izin akışından sonra ve `canRequestAds` iken çağrılır.
 * Web eşi: consent.web.ts.
 */
import * as Tracking from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  AdsConsentStatus,
  type AdsConsentInfo,
} from 'react-native-google-mobile-ads';

import { adConsentShown } from '@/data';

import { debugConsentOptions, testDeviceIds } from './config';
import { decideAds, type ConsentSnapshot, type TrackingStatus } from './logic';
import { setAdsState, type AdsState } from './state';

export type PrivacyOptionsResult = 'shown' | 'notRequired' | 'failed';

let sdkInit: Promise<boolean> | null = null;

/** SDK'yı bir kez başlatır (test cihazları önce); başarısızsa sonraki çağrı yeniden dener */
function initializeSdk(): Promise<boolean> {
  sdkInit ??= (async () => {
    const devices = testDeviceIds();
    if (devices.length) await mobileAds().setRequestConfiguration({ testDeviceIdentifiers: devices });
    await mobileAds().initialize();
    return true;
  })().catch(() => {
    sdkInit = null;
    return false;
  });
  return sdkInit;
}

/** UMP bilgisini sunucudan tazeler; ağ yoksa son bilinen (önbellekteki) bilgi */
async function consentInfo(): Promise<AdsConsentInfo | null> {
  try {
    return await AdsConsent.requestInfoUpdate(debugConsentOptions());
  } catch {
    try {
      return await AdsConsent.getConsentInfo();
    } catch {
      return null;
    }
  }
}

/** AB'de TCF seçimlerinden kişiselleştirme izni: amaç 3 (profil oluştur) ve 4 (kişisel reklam seç) */
async function personalizedConsent(info: AdsConsentInfo): Promise<boolean> {
  if (info.status === AdsConsentStatus.NOT_REQUIRED) return true;
  try {
    if (!(await AdsConsent.getGdprApplies())) return true;
    const choices = await AdsConsent.getUserChoices();
    return choices.createAPersonalisedAdsProfile && choices.selectPersonalisedAds;
  } catch {
    return false;
  }
}

async function snapshot(info: AdsConsentInfo | null): Promise<ConsentSnapshot | null> {
  if (!info) return null;
  return {
    canRequestAds: info.canRequestAds,
    privacyOptionsRequired:
      info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    personalizedConsent: await personalizedConsent(info),
  };
}

async function trackingStatus(): Promise<TrackingStatus> {
  if (Platform.OS !== 'ios') return 'unsupported';
  try {
    return (await Tracking.getTrackingPermissionsAsync()).status as TrackingStatus;
  } catch {
    return 'undetermined';
  }
}

/** İzin bilgisinden durumu hesaplar; izin tamamsa SDK'yı başlatır ve durumu yayınlar */
async function apply(info: AdsConsentInfo | null, preScreenSeen?: boolean): Promise<AdsState> {
  const decision = decideAds({
    consent: await snapshot(info),
    tracking: await trackingStatus(),
    preScreenSeen: preScreenSeen ?? (await adConsentShown.get()),
  });
  if (decision.phase === 'ready' && !(await initializeSdk())) {
    return setAdsState({ ...decision, phase: 'unavailable' });
  }
  return setAdsState(decision);
}

let refreshing: Promise<AdsState> | null = null;

/**
 * Açılış kontrolü (useAdsBootstrap) ve yeniden deneme: UMP bilgisini tazeler, form göstermez.
 * Aynı anda gelen çağrılar tek isteği paylaşır.
 */
export function refreshAds(): Promise<AdsState> {
  refreshing ??= consentInfo()
    .then((info) => apply(info))
    .catch(() => setAdsState({ phase: 'unavailable' }))
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/**
 * 6.2 "Devam": UMP izin formu (yalnızca gerekiyorsa; AB/İngiltere) → iOS'ta ATT sistem isteği →
 * SDK başlatılır. Hiçbir adım akışı durdurmaz; hata olursa reklam izni sonraki denemede yeniden sorulur.
 */
export async function runConsentFlow(): Promise<AdsState> {
  let info = await consentInfo();
  if (info) {
    try {
      // Form yalnızca izin gerekiyorsa (AB/İngiltere, izin yok ya da süresi doldu) açılır
      info = await AdsConsent.loadAndShowConsentFormIfRequired();
    } catch {
      // Form yüklenemedi (ağ yok): izin toplanmamış kalır
    }
  }
  if (Platform.OS === 'ios') {
    try {
      // Daha önce sorulduysa sistem yeniden sormaz, mevcut durumu döner
      await Tracking.requestTrackingPermissionsAsync();
    } catch {
      // yok say
    }
  }
  return apply(info, true);
}

/**
 * "Reklam tercihleri" (5.2 ve 6.2): UMP gizlilik seçenekleri formu. Bu kullanıcı için form yoksa
 * (AB/İngiltere dışı) 'notRequired'; açılamadıysa 'failed'. Formdan sonra durum yeniden hesaplanır.
 */
export async function openPrivacyOptions(): Promise<PrivacyOptionsResult> {
  const info = await consentInfo();
  if (!info) return 'failed';
  const privacyRequired =
    info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  // AB'de izin hiç toplanmadıysa gizlilik seçenekleri yerine izin formunun kendisi açılır
  const consentPending = info.status === AdsConsentStatus.REQUIRED && info.isConsentFormAvailable;
  if (!privacyRequired && !consentPending) {
    // Bilgi tazelendi; durum değiştiyse (ör. bölge) yayınla
    await apply(info);
    return 'notRequired';
  }
  try {
    const after = privacyRequired
      ? await AdsConsent.showPrivacyOptionsForm()
      : await AdsConsent.loadAndShowConsentFormIfRequired();
    await apply(after);
    return 'shown';
  } catch {
    return 'failed';
  }
}

/** Geliştirme: UMP iznini sıfırla (AB formunu yeniden görmek için); durum yeniden hesaplanır */
export function resetConsentForTesting(): Promise<AdsState> {
  if (__DEV__) AdsConsent.reset();
  return refreshAds();
}
