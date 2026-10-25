/**
 * Expo yapılandırması (eski app.json). Değerler `.env`'den okunur (örnek `.env.example`); Expo CLI
 * `.env`'i yapılandırma değerlendirilmeden önce yükler. EAS Build'de `.env` gitmez: aynı adlarla
 * EAS ortam değişkeni olarak tanımla (`eas env:create`).
 *
 * Boş bırakılabilenler:
 * - AdMob uygulama kimlikleri: boşsa Google'ın resmi TEST uygulama kimlikleri (yayından önce gerçek).
 * - Google iOS URL şeması: boşsa iOS istemci kimliğinden türetilir; o da yoksa Google Sign-In plugin'i
 *   eklenmez (iOS'ta native Google girişi çalışmaz, uygulama tarayıcı akışına düşer).
 * - Evrensel link alan adı: EXPO_PUBLIC_INVITE_BASE_URL ya da EXPO_PUBLIC_WEB_BASE_URL; boşsa gazla.app
 *   (src/config/links.ts ile aynı kural).
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Tema token'ları (src/theme/colors.ts `palette`). Expo yapılandırması TypeScript dosyası içe
 * aktaramadığı için değerler burada aynen yazılı; orada değişirse burada da değiştir.
 */
const palette = {
  sand: '#FFF8F2', // palette.sand — açık zemin (açılış ekranı)
  darkBackground: '#150E26', // palette.darkBackground — koyu zemin (açılış ekranı)
  actionGreen: '#1F7A45', // palette.actionGreen — bildirim ikonu rengi (Android)
} as const;

const env = (name: string): string | undefined => {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
};

// Kimlikler ------------------------------------------------------------------------------------

/** iOS bundle id ve Android paket adı (mağaza kaydında aynısı) */
const APP_ID = env('APP_ID') ?? 'app.gazla';

/** Google'ın resmi test uygulama kimlikleri (developers.google.com/admob → "test ads") */
const ADMOB_TEST_APP_ID = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};

const admobAppId = {
  android: env('ADMOB_ANDROID_APP_ID') ?? ADMOB_TEST_APP_ID.android,
  ios: env('ADMOB_IOS_APP_ID') ?? ADMOB_TEST_APP_ID.ios,
};

/**
 * iOS'ta Google girişinin dönüş şeması: iOS istemci kimliğinin ters hali
 * (`123-abc.apps.googleusercontent.com` → `com.googleusercontent.apps.123-abc`).
 */
function googleIosUrlScheme(): string | undefined {
  const explicit = env('EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME');
  if (explicit) return explicit;
  const clientId = env('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
  const suffix = '.apps.googleusercontent.com';
  return clientId?.endsWith(suffix) ? `com.googleusercontent.apps.${clientId.slice(0, -suffix.length)}` : undefined;
}

// Evrensel link (davet: https://<alan>/d/<kod>) -------------------------------------------------

const stripSlash = (url: string) => url.replace(/\/+$/, '');
const webBaseUrl = stripSlash(env('EXPO_PUBLIC_WEB_BASE_URL') ?? 'https://gazla.app');
const inviteBaseUrl = new URL(stripSlash(env('EXPO_PUBLIC_INVITE_BASE_URL') ?? `${webBaseUrl}/d`));
const inviteHost = inviteBaseUrl.host;
/** Davet yolu öneki: `/d/` (kök farklı yoldaysa o) */
const invitePathPrefix = `${stripSlash(inviteBaseUrl.pathname)}/`;

// iOS SKAdNetwork: react-native-google-mobile-ads belgelerindeki Google + üçüncü taraf alıcı listesi
const SK_AD_NETWORK_ITEMS = [
  'cstr6suwn9.skadnetwork',
  '4fzdc2evr5.skadnetwork',
  '2fnua5tdw4.skadnetwork',
  'ydx93a7ass.skadnetwork',
  'p78axxw29g.skadnetwork',
  'v72qych5uu.skadnetwork',
  'ludvb6z3bs.skadnetwork',
  'cp8zw746q7.skadnetwork',
  '3sh42y64q3.skadnetwork',
  'c6k4g5qg8m.skadnetwork',
  's39g8k73mm.skadnetwork',
  '3qy4746246.skadnetwork',
  'hs6bdukanm.skadnetwork',
  'mlmmfzh3r3.skadnetwork',
  'v4nxqhlyqp.skadnetwork',
  'wzmmz9fp6w.skadnetwork',
  'su67r6k2v3.skadnetwork',
  'yclnxrl5pm.skadnetwork',
  '7ug5zh24hu.skadnetwork',
  'gta9lk7p23.skadnetwork',
  'vutu7akeur.skadnetwork',
  'y5ghdn5j9k.skadnetwork',
  'v9wttpbfk9.skadnetwork',
  'n38lu8286q.skadnetwork',
  '47vhws6wlr.skadnetwork',
  'kbd757ywx3.skadnetwork',
  '9t245vhmpl.skadnetwork',
  'a2p9lx4jpn.skadnetwork',
  '22mmun2rn5.skadnetwork',
  '44jx6755aq.skadnetwork',
  'k674qkevps.skadnetwork',
  '4468km3ulz.skadnetwork',
  '2u9pt9hc89.skadnetwork',
  '8s468mfl3y.skadnetwork',
  'klf5c3l5u5.skadnetwork',
  'ppxm28t8ap.skadnetwork',
  'kbmxgpxpgc.skadnetwork',
  'uw77j35x4d.skadnetwork',
  '578prtvx9j.skadnetwork',
  '4dzt52r2t5.skadnetwork',
  'tl55sbb4fm.skadnetwork',
  'c3frkrj4fj.skadnetwork',
  'e5fvkxwrpn.skadnetwork',
  '8c4e2ghe7u.skadnetwork',
  '3rd42ekr43.skadnetwork',
  '97r2b46745.skadnetwork',
  '3qcr597p9d.skadnetwork',
];

// Uygulama adı ve izin metinleri (dile göre) -------------------------------------------------------
// Tek uygulama, iki ad: telefon Türkçeyse "Gazla", diğer dillerde "NoSkip" (src/i18n). Temel değerler İngilizce
// (Info.plist, Android values/); Türkçe `locales.tr` ile (iOS tr.lproj/InfoPlist.strings, Android values-b+tr/).

const APP_NAME = { en: 'NoSkip', tr: 'Gazla' };

const permissions = {
  en: {
    camera: 'NoSkip uses your camera so you can take photo proof for your daily task.',
    photos: 'NoSkip accesses your photos so you can pick a photo proof or a profile picture.',
    contacts:
      'NoSkip uses the email addresses in your contacts to find your friends. The addresses themselves are never sent; only their hashes are sent and compared.',
    tracking:
      'If you allow it, ads in NoSkip are chosen based on your interests. This does not affect how you use the app; the streak rescue ad works even if you say no.',
  },
  tr: {
    camera: 'Gazla, günlük görevin için fotoğraf kanıtı çekebilmen için kameranı kullanır.',
    photos: 'Gazla, fotoğraf kanıtı ya da profil fotoğrafı seçebilmen için fotoğraflarına erişir.',
    contacts:
      'Gazla, rehberindeki arkadaşlarını bulmak için kişilerinin e-posta adreslerini kullanır. Adreslerin kendisi gönderilmez, yalnızca özetleri gönderilir ve karşılaştırılır.',
    tracking:
      'İzin verirsen Gazla’daki reklamlar ilgi alanlarına göre seçilir. Bu izin uygulamayı kullanmanı etkilemez; seri kurtarma reklamı izin vermesen de çalışır.',
  },
};

/** iOS InfoPlist.strings / Android strings.xml: dile göre ad ve izin metinleri */
const localeStrings = (lang: 'en' | 'tr') => ({
  ios: {
    CFBundleDisplayName: APP_NAME[lang],
    NSCameraUsageDescription: permissions[lang].camera,
    NSPhotoLibraryUsageDescription: permissions[lang].photos,
    NSContactsUsageDescription: permissions[lang].contacts,
    NSUserTrackingUsageDescription: permissions[lang].tracking,
  },
  android: { app_name: APP_NAME[lang] },
});

// Yapılandırma ----------------------------------------------------------------------------------

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosUrlScheme = googleIosUrlScheme();
  const easProjectId = env('EAS_PROJECT_ID') ?? env('EXPO_PUBLIC_EAS_PROJECT_ID');

  const plugins: ExpoConfig['plugins'] = [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: palette.sand,
        dark: { backgroundColor: palette.darkBackground },
      },
    ],
    ['expo-navigation-bar', { enforceContrast: false }],
    'expo-web-browser',
    'expo-sharing',
    'expo-apple-authentication',
    [
      'expo-notifications',
      {
        // 96×96 tamamen beyaz, saydam PNG olmalı; şimdilik uygulama ikonunun tek renkli katmanı
        icon: './assets/android-icon-monochrome.png',
        color: palette.actionGreen,
        // src/notifications/channels.ts NOTIFICATION_CHANNELS.default (kanal belirtilmeyen push)
        defaultChannel: 'default',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: permissions.en.camera,
        microphonePermission: false,
        recordAudioAndroid: false,
        barcodeScannerEnabled: false,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: permissions.en.photos,
        cameraPermission: permissions.en.camera,
        microphonePermission: false,
      },
    ],
    ['expo-contacts', { contactsPermission: permissions.en.contacts }],
    ['expo-tracking-transparency', { userTrackingPermission: permissions.en.tracking }],
    // Sistem ayarlarında uygulamaya özel dil seçimi (iOS CFBundleLocalizations, Android 13+ localeConfig)
    ['expo-localization', { supportedLocales: ['en', 'tr'] }],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: admobAppId.android,
        iosAppId: admobAppId.ios,
        // UMP izin formu ve ATT sorusu bitmeden ölçüm başlamasın (src/ads/useAdsBootstrap)
        delayAppMeasurementInit: true,
        skAdNetworkItems: SK_AD_NETWORK_ITEMS,
        userTrackingUsageDescription: permissions.en.tracking,
      },
    ],
  ];

  // Uyarı: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (ya da _URL_SCHEME) yoksa plugin eklenmez; iOS'ta native
  // Google girişi açılmaz, giriş Supabase OAuth tarayıcı akışına düşer (src/data/supabase/nativeAuth.ts).
  if (iosUrlScheme) {
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }

  return {
    ...config,
    name: APP_NAME.en,
    slug: 'gazla',
    scheme: 'gazla',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
      bundleIdentifier: APP_ID,
      usesAppleSignIn: true,
      associatedDomains: [`applinks:${inviteHost}`],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // Sistem metinleri (resmi Apple ile giriş butonu, izin pencereleri) cihaz dilinde: Türkçe telefonda Türkçe,
        // eşleşmeyen dillerde İngilizce (geliştirme bölgesi)
        CFBundleDevelopmentRegion: 'en',
        CFBundleLocalizations: ['en', 'tr'],
        CFBundleAllowMixedLocalizations: true,
      },
    },
    android: {
      package: APP_ID,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      // Rehber yalnızca okunur; ses kaydı yok (expo-contacts / expo-camera varsayılanlarını kapat)
      blockedPermissions: ['android.permission.WRITE_CONTACTS', 'android.permission.RECORD_AUDIO'],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: inviteHost, pathPrefix: invitePathPrefix }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    locales: {
      en: localeStrings('en'),
      tr: localeStrings('tr'),
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins,
    experiments: {
      typedRoutes: true,
    },
    extra: {
      ...config.extra,
      // src/notifications/push.ts: Expo push token'ı için EAS proje kimliği (`eas init` sonrası)
      ...(easProjectId ? { eas: { projectId: easProjectId } } : null),
      // src/ads/config.ts: yayın birim kimlikleri (EXPO_PUBLIC_ADMOB_* ile aynı; boşsa test birimleri)
      admob: {
        ios: { banner: env('EXPO_PUBLIC_ADMOB_BANNER_IOS'), rewarded: env('EXPO_PUBLIC_ADMOB_REWARDED_IOS') },
        android: {
          banner: env('EXPO_PUBLIC_ADMOB_BANNER_ANDROID'),
          rewarded: env('EXPO_PUBLIC_ADMOB_REWARDED_ANDROID'),
        },
      },
      universalLinkHosts: [inviteHost],
    },
  };
};
