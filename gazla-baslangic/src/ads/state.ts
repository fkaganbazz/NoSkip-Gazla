/**
 * Reklam durumu: tek kaynak, platformdan bağımsız (web'de hep 'unavailable').
 * `useAdsBootstrap()` açılışta, ön ekran (6.2) ve gizlilik formları sonrasında günceller; banner ve
 * rewarded reklam yalnızca 'ready' iken istek atar.
 */
import { useSyncExternalStore } from 'react';

export type AdsPhase =
  /** Açılışta UMP izin bilgisi okunuyor */
  | 'checking'
  /** İzin akışı (6.2 ön ekranı → UMP formu → iOS ATT) henüz tamamlanmadı; reklam istenmez */
  | 'needsConsent'
  /** İzin tamam, SDK başlatıldı; reklam istenebilir */
  | 'ready'
  /** Reklam yok: web, SDK başlatılamadı ya da izin bilgisi okunamadı */
  | 'unavailable';

export type AdsState = {
  phase: AdsPhase;
  /** Yalnızca kişiselleştirilmemiş reklam iste (UMP seçimi ya da iOS'ta izleme izni yok) */
  nonPersonalized: boolean;
  /** UMP gizlilik seçenekleri formu bu kullanıcı için var mı (AB/İngiltere) */
  privacyOptionsRequired: boolean;
};

const INITIAL: AdsState = { phase: 'checking', nonPersonalized: true, privacyOptionsRequired: false };

let current: AdsState = INITIAL;
const listeners = new Set<() => void>();

export function getAdsState(): AdsState {
  return current;
}

export function setAdsState(patch: Partial<AdsState>): AdsState {
  const next = { ...current, ...patch };
  if (
    next.phase !== current.phase ||
    next.nonPersonalized !== current.nonPersonalized ||
    next.privacyOptionsRequired !== current.privacyOptionsRequired
  ) {
    current = next;
    listeners.forEach((l) => l());
  }
  return current;
}

export function subscribeAdsState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Ekranlar için: durum değişince yeniden çizer */
export function useAdsState(): AdsState {
  return useSyncExternalStore(subscribeAdsState, getAdsState, getAdsState);
}
