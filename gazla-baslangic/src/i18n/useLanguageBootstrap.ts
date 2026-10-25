import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { refreshSystemLanguage, useLanguage } from './language';

/**
 * Kök düzende bir kez: 'system' tercihinde cihaz dili değişince (uygulama ön plana gelince) uygulanır;
 * web'de sayfanın `lang`'ı uygulama diliyle aynı tutulur (ekran okuyucu, tarayıcı çevirisi).
 */
export function useLanguageBootstrap() {
  const language = useLanguage();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshSystemLanguage();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);
}
