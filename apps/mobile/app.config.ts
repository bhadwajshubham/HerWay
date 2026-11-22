import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = process.env.APP_VARIANT === 'driver' ? 'driver' : 'rider';
  const appMode = process.env.APP_MODE ?? 'pilot';
  const apiUrl = process.env.API_URL;
  const buildProfile = process.env.EAS_BUILD_PROFILE;
  const resolvedApiUrl = apiUrl ?? 'http://127.0.0.1:3000';

  if (buildProfile === 'production' || appMode === 'live') {
    throw new Error('Production HerWay builds require approved ride and safety services');
  }

  if (buildProfile === 'preview' && (!apiUrl || !apiUrl.startsWith('https://'))) {
    throw new Error('Preview builds require an HTTPS API_URL');
  }

  return {
    ...config,
    name: variant === 'driver' ? 'HerWay Captain' : 'HerWay',
    slug: variant === 'driver' ? 'herway-captain' : 'herway',
    scheme: variant === 'driver' ? 'herway-driver' : 'herway',
   android: {
      package: variant === 'driver' ? 'com.herway.herWay.captain' : 'com.herway.her_way',
      googleServicesFile: './firebase/google-services.json',
      adaptiveIcon: { backgroundColor: '#0B1F33' },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY
        }
      }
    },
    
    ios: {
      bundleIdentifier: variant === 'driver' ? 'com.herway.herWay.captain' : 'com.herway.herWay',
      googleServicesFile: './firebase/GoogleService-Info.plist'
    },
    extra: {
      appVariant: variant,
      appMode,
      firebaseWebApiKey:
        process.env.FIREBASE_WEB_API_KEY ?? 'AIzaSyCwXSB6Stts_a_z1qLR5YOL24TyETj7CHQ',
      firebaseAuthDomain:
        process.env.FIREBASE_WEB_AUTH_DOMAIN ?? 'herway-app-f6e0f.firebaseapp.com',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? 'herway-app-f6e0f',
      firebaseAppId: process.env.FIREBASE_APP_ID ?? '1:399711586983:web:458cd8b8c59378e45da982',
      apiUrl: resolvedApiUrl,
      easProjectId: process.env.EAS_PROJECT_ID
    }
  };
};
