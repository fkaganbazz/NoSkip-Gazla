/**
 * Uygulama dili: Türkçe (Gazla) ya da İngilizce (NoSkip).
 * Tercih cihazda (MMKV) saklanır. 'system' (varsayılan): cihazın ilk dili Türkçeyse Türkçe, değilse İngilizce.
 * iOS/Android ayarlarında uygulamaya özel dil seçilirse `getLocales()` onu döner (app.config `supportedLocales`).
 */
import { getLocales } from 'expo-localization';
import { useCallback, useSyncExternalStore } from 'react';

import { storage } from '@/data/storage';

export type Language = 'tr' | 'en';
export type LanguagePreference = Language | 'system';

export const LANGUAGES: readonly Language[] = ['tr', 'en'];

const KEY = 'gazla.language';

const isPreference = (v: unknown): v is LanguagePreference => v === 'tr' || v === 'en' || v === 'system';

/** Cihaz dili: yalnızca ilk tercih (Türkçe ikinci dil olan İngilizce telefon İngilizce görür) */
export function deviceLanguage(): Language {
  try {
    return getLocales()[0]?.languageCode === 'tr' ? 'tr' : 'en';
  } catch {
    return 'tr';
  }
}

function readPreference(): LanguagePreference {
  try {
    const v = storage.getString(KEY);
    return isPreference(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

const resolve = (pref: LanguagePreference): Language => (pref === 'system' ? deviceLanguage() : pref);

let preference: LanguagePreference = readPreference();
let language: Language = resolve(preference);
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export const getLanguage = (): Language => language;
export const getLanguagePreference = (): LanguagePreference => preference;

export function setLanguagePreference(next: LanguagePreference) {
  preference = next;
  try {
    storage.set(KEY, next);
  } catch {
    // yok say: tercih bu oturumda bellekte kalır
  }
  language = resolve(next);
  emit();
}

/** 'system' tercihinde cihaz dili değiştiyse uygular (uygulama ön plana gelince) */
export function refreshSystemLanguage() {
  if (preference !== 'system') return;
  const next = deviceLanguage();
  if (next === language) return;
  language = next;
  emit();
}

export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLanguage(): Language {
  return useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
}

export function useLanguagePreference() {
  const pref = useSyncExternalStore(subscribeLanguage, getLanguagePreference, getLanguagePreference);
  const change = useCallback((next: LanguagePreference) => setLanguagePreference(next), []);
  return [pref, change] as const;
}
