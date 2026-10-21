/**
 * Reklam kararları — saf mantık (native modül yok; birim testli).
 * - `decideAds`: UMP izin bilgisi + iOS izleme izni + ön ekran görüldü mü → reklam durumu.
 * - `runRewarded`: rewarded reklamın yükle → göster → ödül/kapanış akışı, yükleme zaman aşımıyla.
 */
import type { AdsPhase } from './state';

/** UMP `AdsConsentInfo`dan bize gerekenler (+ TCF seçimlerinden kişiselleştirme izni) */
export type ConsentSnapshot = {
  /** UMP: izin toplandı ya da gerekmiyor → reklam istenebilir */
  canRequestAds: boolean;
  /** UMP gizlilik seçenekleri formu gerekli (AB/İngiltere) */
  privacyOptionsRequired: boolean;
  /** Kişiselleştirilmiş reklama izin var (izin gerekmiyorsa true; AB'de TCF amaç 3 + 4) */
  personalizedConsent: boolean;
};

/** iOS ATT durumu; Android'de ATT yok → 'unsupported' */
export type TrackingStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export type AdsDecision = {
  phase: Exclude<AdsPhase, 'checking'>;
  nonPersonalized: boolean;
  privacyOptionsRequired: boolean;
};

/**
 * - İzin bilgisi hiç okunamadıysa reklam yok ('unavailable'; sonraki denemede yeniden bakılır).
 * - UMP izni toplanmadıysa (AB/İngiltere, form henüz gösterilmedi) → 'needsConsent'.
 * - iOS'ta ATT hiç sorulmadıysa ve 6.2 ön ekranı da görülmediyse → 'needsConsent' (SDK izin akışından
 *   önce başlatılmaz). Ön ekran görüldüyse (kullanıcı kapattıysa da) reklam kişiselleştirilmeden gelir.
 * - Kişiselleştirilmemiş: UMP'de kişiselleştirme izni yok ya da iOS'ta izleme izni verilmedi
 *   (ön ekran: "İzin verirsen reklamlar ilgi alanına göre seçilir").
 */
export function decideAds(input: {
  consent: ConsentSnapshot | null;
  tracking: TrackingStatus;
  preScreenSeen: boolean;
}): AdsDecision {
  const { consent, tracking, preScreenSeen } = input;
  if (!consent) return { phase: 'unavailable', nonPersonalized: true, privacyOptionsRequired: false };

  const nonPersonalized = !consent.personalizedConsent || (tracking !== 'granted' && tracking !== 'unsupported');
  const flowPending = !consent.canRequestAds || (tracking === 'undetermined' && !preScreenSeen);
  return {
    phase: flowPending ? 'needsConsent' : 'ready',
    nonPersonalized,
    privacyOptionsRequired: consent.privacyOptionsRequired,
  };
}

// Rewarded akışı --------------------------------------------------------------------------------

/** Seri kurtarma reklamı bu sürede yüklenmezse "yüklenemedi" yolu (EKRANLAR 6.1: 8 sn) */
export const REWARDED_LOAD_TIMEOUT_MS = 8000;

export type RewardedEvent = 'loaded' | 'earned' | 'closed' | 'error';

/** Native `RewardedAd` örneğinin ince sarmalayıcısı (testte sahte) */
export interface RewardedAdapter {
  load(): void;
  show(): Promise<void>;
  on(event: RewardedEvent, listener: () => void): void;
  destroy(): void;
}

export type RewardedFailure = 'timeout' | 'error' | 'unavailable';

export type RewardedCallbacks = {
  /** Reklam yüklendi, tam ekran gösteriliyor */
  onShowing?: () => void;
  /** Yalnızca EARNED_REWARD olayında, en fazla bir kez */
  onEarned: () => void;
  /** Yüklenemedi (hata ya da zaman aşımı) ya da gösterilemedi; ödül yok */
  onFailed: (reason: RewardedFailure) => void;
  /** Reklam kapandı; `earned` ödül kazanıldı mı (kazanılmadıysa hiçbir şey yapılmaz) */
  onClosed?: (earned: boolean) => void;
};

export type Timers = {
  set: (fn: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
};

const defaultTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

/**
 * Reklamı yükler; `timeoutMs` içinde yüklenmezse 'timeout' ile vazgeçer (geç gelen reklam gösterilmez).
 * Yüklenince gösterir. Dönen fonksiyon akışı iptal eder (ekran kapandı ya da ücretsiz hak seçildi):
 * yüklenirken çağrılırsa reklam bırakılır; gösterilirken çağrılırsa geri çağrılar susar.
 */
export function runRewarded(
  ad: RewardedAdapter,
  callbacks: RewardedCallbacks,
  options: { timeoutMs: number; timers?: Timers },
): () => void {
  const timers = options.timers ?? defaultTimers;
  let phase: 'loading' | 'showing' | 'done' = 'loading';
  let earned = false;
  let muted = false;

  const release = () => {
    try {
      ad.destroy();
    } catch {
      // yok say
    }
  };

  const fail = (reason: RewardedFailure) => {
    if (phase === 'done') return;
    phase = 'done';
    timers.clear(timer);
    release();
    if (!muted) callbacks.onFailed(reason);
  };

  const timer = timers.set(() => {
    if (phase === 'loading') fail('timeout');
  }, options.timeoutMs);

  ad.on('loaded', () => {
    if (phase !== 'loading') return;
    phase = 'showing';
    timers.clear(timer);
    if (!muted) callbacks.onShowing?.();
    ad.show().catch(() => {
      if (!earned) fail('error');
    });
  });

  ad.on('earned', () => {
    if (phase !== 'showing' || earned) return;
    earned = true;
    if (!muted) callbacks.onEarned();
  });

  ad.on('closed', () => {
    if (phase !== 'showing') return;
    phase = 'done';
    release();
    if (!muted) callbacks.onClosed?.(earned);
  });

  ad.on('error', () => {
    if (phase === 'loading' || (phase === 'showing' && !earned)) {
      fail('error');
    } else if (phase === 'showing') {
      // Ödül alındıktan sonra gösterim hatası: kapanmış say
      phase = 'done';
      release();
      if (!muted) callbacks.onClosed?.(true);
    }
  });

  try {
    ad.load();
  } catch {
    fail('error');
  }

  return () => {
    muted = true;
    if (phase === 'loading') {
      phase = 'done';
      timers.clear(timer);
      release();
    }
    // Gösterilirken: reklam kendi kapanır, 'closed' gelince bırakılır
  };
}
