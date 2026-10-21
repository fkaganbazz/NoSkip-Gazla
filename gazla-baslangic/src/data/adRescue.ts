/**
 * Reklamla seri kurtarma (StreakLost). Akış:
 * 1. Ekran rewarded reklamı `serverSideVerificationOptions: adRescueSsvOptions(userId, challengeId, missedDate)`
 *    ile yükler ve gösterir.
 * 2. Kullanıcı ödülü kazanınca Google, AdMob SSV geri çağrısını Edge Function `admob-ssv`'ye gönderir;
 *    fonksiyon imzayı doğrular ve `grant_ad_rescue(user_id, challenge_id, missed_date, transaction_id)`
 *    çağırır (kurallar sunucuda).
 * 3. Ekran `useRescueStreak().rescue({ via: 'ad', challengeId, missedDate })` çağırır: doğrulama gelene
 *    kadar ('AD_REWARD_PENDING') kanca artan aralıklarla birkaç kez yeniden dener.
 */
import type { LocalDate } from './types';

/** SSV'de `custom_data` olarak giden JSON (Edge Function aynı alanları okur) */
export type AdRescueCustomData = { challengeId: string; missedDate: LocalDate };

/** react-native-google-mobile-ads `ServerSideVerificationOptions` ile aynı biçim */
export type AdRescueSsvOptions = { userId: string; customData: string };

export function adRescueSsvOptions(userId: string, challengeId: string, missedDate: LocalDate): AdRescueSsvOptions {
  const data: AdRescueCustomData = { challengeId, missedDate };
  return { userId, customData: JSON.stringify(data) };
}

/**
 * `useRescueStreak().rescue({ via: 'ad' })` yeniden deneme aralıkları (ms): SSV geri çağrısı genelde
 * birkaç saniyede gelir. Toplam ~30 sn sonra hâlâ yoksa 'AD_REWARD_PENDING' hatası ekrana döner.
 */
export const AD_RESCUE_RETRY_DELAYS_MS = [1500, 2500, 4000, 6000, 8000, 10000] as const;
