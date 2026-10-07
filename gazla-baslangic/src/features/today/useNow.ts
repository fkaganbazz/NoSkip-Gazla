import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Şimdiki zaman; her dakika başında yenilenir (tarih, selamlama ve kalan süre için).
 * Uygulama ön plana dönünce hemen yenilenir ve dakika hizası baştan kurulur.
 */
export function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;
    const tick = () => setNow(new Date());

    const schedule = () => {
      clearTimeout(timeout);
      clearInterval(interval);
      // Bir sonraki dakika başına hizala, sonra dakikada bir.
      timeout = setTimeout(
        () => {
          tick();
          interval = setInterval(tick, 60_000);
        },
        60_000 - (Date.now() % 60_000),
      );
    };

    schedule();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        tick();
        schedule();
      }
    });

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return now;
}
