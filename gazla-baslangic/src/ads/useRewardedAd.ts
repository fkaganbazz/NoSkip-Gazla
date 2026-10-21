/**
 * Seri kurtarma rewarded reklamı için kanca (6.1). Platformdan bağımsız: native'de rewarded.ts,
 * web'de rewarded.web.ts (hemen "yüklenemedi").
 *
 *   const ad = useRewardedAd();
 *   ad.watch({ ssv, onEarned: () => rescue({ via: 'ad', … }), onFailed: () => setAdFailed(true), onNeedsConsent });
 *
 * Bas → 8 sn içinde reklam yüklenmezse (izin bilgisinin okunması dahil) `onFailed('timeout')`.
 * `onEarned` yalnızca EARNED_REWARD olayında çağrılır; ödülsüz kapanışta hiçbir şey olmaz.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { refreshAds } from './consent';
import { REWARDED_LOAD_TIMEOUT_MS, type RewardedFailure } from './logic';
import { startRewardedAd, type RewardedRequest } from './rewarded';
import { getAdsState, type AdsState } from './state';

export type RewardedStatus = 'idle' | 'loading' | 'showing';

export type WatchOptions = {
  /** `adRescueSsvOptions(userId, challengeId, missedDate)` (@/data) */
  ssv: RewardedRequest['ssv'];
  onEarned: () => void;
  onFailed: (reason: RewardedFailure) => void;
  /** İzin akışı tamamlanmadı: ekran 6.2 ön ekranını açar */
  onNeedsConsent: () => void;
};

/** Söz `deadline`a kadar çözülmezse null */
function withDeadline<T>(promise: Promise<T>, deadline: number): Promise<T | null> {
  const ms = deadline - Date.now();
  if (ms <= 0) return Promise.resolve(null);
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      () => {
        clearTimeout(t);
        resolve(null);
      },
    );
  });
}

export function useRewardedAd() {
  const [status, setStatus] = useState<RewardedStatus>('idle');
  const cancelRef = useRef<(() => void) | null>(null);
  // Her watch/cancel bir öncekini geçersiz kılar (geç gelen geri çağrılar yok sayılır)
  const runId = useRef(0);

  const stop = useCallback(() => {
    runId.current += 1;
    cancelRef.current?.();
    cancelRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  /** Yüklenen ya da yüklenmekte olan reklamı bırakır (ör. ücretsiz hak seçildi) */
  const cancel = useCallback(() => {
    stop();
    setStatus('idle');
  }, [stop]);

  const watch = useCallback(
    async (options: WatchOptions) => {
      stop();
      const id = runId.current;
      const alive = () => runId.current === id;
      const deadline = Date.now() + REWARDED_LOAD_TIMEOUT_MS;
      setStatus('loading');

      let ads: AdsState | null = getAdsState();
      // Açılış kontrolü bitmediyse onu bekle; daha önce okunamadıysa yeniden dene (ağ geri gelmiş olabilir)
      if (ads.phase === 'checking' || ads.phase === 'unavailable') ads = await withDeadline(refreshAds(), deadline);
      if (!alive()) return;

      if (!ads || ads.phase !== 'ready') {
        setStatus('idle');
        if (ads?.phase === 'needsConsent') options.onNeedsConsent();
        else options.onFailed(ads ? 'unavailable' : 'timeout');
        return;
      }

      cancelRef.current = startRewardedAd(
        { ssv: options.ssv, nonPersonalized: ads.nonPersonalized, timeoutMs: Math.max(0, deadline - Date.now()) },
        {
          onShowing: () => {
            if (alive()) setStatus('showing');
          },
          onEarned: () => {
            if (alive()) options.onEarned();
          },
          onFailed: (reason) => {
            if (!alive()) return;
            cancelRef.current = null;
            setStatus('idle');
            options.onFailed(reason);
          },
          onClosed: () => {
            if (!alive()) return;
            cancelRef.current = null;
            setStatus('idle');
          },
        },
      );
    },
    [stop],
  );

  return { status, watch, cancel };
}
