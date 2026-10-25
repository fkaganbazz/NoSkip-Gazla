/**
 * Çökme ve hata takibi (Sentry). `EXPO_PUBLIC_SENTRY_DSN` tanımlıysa ve geliştirme sürümü değilse açılır; değilse
 * hiçbir şey gönderilmez. Kişisel veri gönderilmez (`sendDefaultPii` kapalı: IP, çerez, istek gövdesi yok).
 * Kaynak haritaları derlemede yüklenir: SENTRY_ORG, SENTRY_PROJECT ve SENTRY_AUTH_TOKEN (EAS ortam değişkeni)
 * tanımlıysa app.config.ts Sentry plugin'ini ekler.
 */
import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || undefined;

export const sentryEnabled = !!dsn && !__DEV__;

/** expo-router gezinmesi (ekran adları hata kayıtlarında görünür); app/_layout.tsx kaydeder */
export const navigationIntegration = Sentry.reactNavigationIntegration({ enableTimeToInitialDisplay: false });

Sentry.init({
  dsn,
  enabled: sentryEnabled,
  environment: __DEV__ ? 'development' : 'production',
  sendDefaultPii: false,
  // Performans izlerinin onda biri
  tracesSampleRate: 0.1,
  integrations: [navigationIntegration],
});

export { Sentry };
