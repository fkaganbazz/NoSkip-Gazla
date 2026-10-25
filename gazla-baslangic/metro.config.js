// Metro: Expo varsayılanı + Sentry (kaynak haritası eşleşmesi için hata ayıklama kimlikleri). Kimlik bilgisi gerektirmez.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
