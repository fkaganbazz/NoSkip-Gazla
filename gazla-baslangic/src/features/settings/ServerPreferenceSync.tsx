/**
 * Cihaz ile sunucu (`user_settings`) arasındaki tercihleri eşitler. Yalnızca uygulama açıkken (oturum ve profil
 * hazır) kök düzende çizilir; görünür bir şey çizmez.
 * - Görünüm (`theme`): sunucudaki değer başka cihazda değiştiyse burada uygulanır. Bu cihazda sunucuya
 *   gitmemiş bir değişiklik varsa (çevrimdışı ya da bu sürümden önce seçilmiş) sunucuya yazılır.
 * - Reklam izni (`adsPersonalized`): izin akışı tamamlanınca (UMP + iOS ATT) sonucu sunucuya kaydeder.
 */
import { useEffect, useRef } from 'react';

import { useAdsState } from '@/ads';
import { useIsOnline, useMySettings, useUpdateSettings } from '@/data';

import {
  loadSyncedThemePreference,
  loadThemePreference,
  markThemePreferenceSynced,
  setThemePreference,
} from './themePreference';

export default function ServerPreferenceSync() {
  const settings = useMySettings();
  const { update } = useUpdateSettings();
  const online = useIsOnline();
  const ads = useAdsState();

  const serverTheme = settings.data?.theme;
  const themeBusy = useRef(false);
  useEffect(() => {
    if (!serverTheme || !online || themeBusy.current) return;
    themeBusy.current = true;
    (async () => {
      const [local, synced] = await Promise.all([loadThemePreference(), loadSyncedThemePreference()]);
      if (local === serverTheme) {
        markThemePreferenceSynced(local);
        return;
      }
      // Bu cihazda seçilip sunucuya gitmemiş: hiç eşitlenmemişken varsayılan dışı seçim ya da son eşitlemeden
      // sonra yalnızca burada değişmiş
      const localUnsent = synced === null ? serverTheme === 'system' : synced === serverTheme;
      if (localUnsent) {
        await update({ theme: local });
        markThemePreferenceSynced(local);
      } else {
        setThemePreference(serverTheme);
        markThemePreferenceSynced(serverTheme);
      }
    })()
      .catch(() => {
        // Sonraki açılışta ya da bağlantı gelince yeniden denenir
      })
      .finally(() => {
        themeBusy.current = false;
      });
  }, [serverTheme, online, update]);

  const personalized = ads.phase === 'ready' ? !ads.nonPersonalized : null;
  const serverAds = settings.data?.adsPersonalized;
  const adsSending = useRef<boolean | null>(null);
  useEffect(() => {
    if (personalized === null || serverAds === undefined || serverAds === personalized || !online) return;
    if (adsSending.current === personalized) return;
    adsSending.current = personalized;
    update({ adsPersonalized: personalized })
      .catch(() => {})
      .finally(() => {
        adsSending.current = null;
      });
  }, [personalized, serverAds, online, update]);

  return null;
}
