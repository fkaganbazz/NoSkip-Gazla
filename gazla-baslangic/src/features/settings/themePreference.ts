/**
 * Görünüm tercihi (Açık / Koyu / Sistem) — Settings.dc.html "GÖRÜNÜM".
 * Cihazda AsyncStorage'da tutulur ve `Appearance.setColorScheme` ile uygulanır (useTheme → useColorScheme
 * bunu izler); oturum açıkken sunucuya da yazılır (`user_settings.theme`) ki başka cihazda aynı olsun
 * (eşitleme: `useServerPreferenceSync`). Web'de Appearance tercihi değiştirilemez, sistem geçerli.
 * Açılışta uygulanması için `restoreThemePreference()` kök düzenden çağrılmalı.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

import type { ThemePreferenceKey } from '@/data';
import type { Messages } from '@/i18n';

export type ThemePreference = ThemePreferenceKey;

const KEY = 'gazla.themePreference';
/** Sunucuyla en son uyuşan değer (cihazdaki değişiklik sunucuya gitmeden önce mi sonra mı?) */
const SYNCED_KEY = 'gazla.themePreference.synced';

/** Görünüm seçicisinin seçenekleri (etiketler o anki dilde) */
export const themeOptions = (t: Messages): { value: ThemePreference; label: string }[] => [
  { value: 'light', label: t.settings.theme.light },
  { value: 'dark', label: t.settings.theme.dark },
  { value: 'system', label: t.settings.theme.system },
];

export const isThemePreference = (v: unknown): v is ThemePreference => v === 'light' || v === 'dark' || v === 'system';

let current: ThemePreference = 'system';
let loaded: Promise<ThemePreference> | null = null;
const listeners = new Set<(pref: ThemePreference) => void>();

async function read(key: string): Promise<ThemePreference | null> {
  try {
    const v = await AsyncStorage.getItem(key);
    return isThemePreference(v) ? v : null;
  } catch {
    return null;
  }
}

export function loadThemePreference(): Promise<ThemePreference> {
  loaded ??= read(KEY).then((v) => {
    current = v ?? 'system';
    return current;
  });
  return loaded;
}

/** Sunucuyla en son uyuşan değer; hiç eşitlenmediyse null */
export const loadSyncedThemePreference = () => read(SYNCED_KEY);

export function markThemePreferenceSynced(pref: ThemePreference) {
  AsyncStorage.setItem(SYNCED_KEY, pref).catch(() => {});
}

export function applyThemePreference(pref: ThemePreference) {
  // react-native-web'de setColorScheme yok
  if (typeof Appearance.setColorScheme !== 'function') return;
  Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);
}

/** Tercihi cihazda kaydeder ve uygular; açık seçicileri günceller */
export function setThemePreference(pref: ThemePreference) {
  current = pref;
  loaded = Promise.resolve(pref);
  applyThemePreference(pref);
  AsyncStorage.setItem(KEY, pref).catch(() => {});
  listeners.forEach((l) => l(pref));
}

/** Kayıtlı tercihi uygular (uygulama açılışında) */
export async function restoreThemePreference() {
  applyThemePreference(await loadThemePreference());
}

/** Seçicinin değeri (cihazdaki tercih); değiştirmek için `setThemePreference` */
export function useThemePreference(): ThemePreference {
  const [pref, setPref] = useState<ThemePreference>(current);

  useEffect(() => {
    let alive = true;
    listeners.add(setPref);
    loadThemePreference().then((v) => alive && setPref(v));
    return () => {
      alive = false;
      listeners.delete(setPref);
    };
  }, []);

  return pref;
}
