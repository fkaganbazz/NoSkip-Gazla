/**
 * Görünüm tercihi (Açık / Koyu / Sistem) — Settings.dc.html "GÖRÜNÜM".
 * Sunucuda alanı yok; cihazda AsyncStorage'da tutulur ve `Appearance.setColorScheme` ile uygulanır
 * (useTheme → useColorScheme bunu izler). Web'de Appearance tercihi değiştirilemez, sistem geçerli.
 * Açılışta uygulanması için `restoreThemePreference()` kök düzenden çağrılmalı.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'system';

const KEY = 'gazla.themePreference';

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
  { value: 'system', label: 'Sistem' },
];

const isPreference = (v: unknown): v is ThemePreference => v === 'light' || v === 'dark' || v === 'system';

export async function loadThemePreference(): Promise<ThemePreference> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return isPreference(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

export function applyThemePreference(pref: ThemePreference) {
  // react-native-web'de setColorScheme yok
  if (typeof Appearance.setColorScheme !== 'function') return;
  Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);
}

/** Kayıtlı tercihi uygular (uygulama açılışında) */
export async function restoreThemePreference() {
  applyThemePreference(await loadThemePreference());
}

export function useThemePreference() {
  const [pref, setPref] = useState<ThemePreference>('system');

  useEffect(() => {
    let alive = true;
    loadThemePreference().then((v) => alive && setPref(v));
    return () => {
      alive = false;
    };
  }, []);

  const change = useCallback((next: ThemePreference) => {
    setPref(next);
    applyThemePreference(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  return [pref, change] as const;
}
