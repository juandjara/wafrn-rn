import type { ExpoConfig } from 'expo/config'

export default {
  expo: {
    newArchEnabled: true,
    name: 'Wafrn',
    slug: 'wafrn-rn',
    version: '1.2.2',
    orientation: 'portrait',
    icon: './assets/images/logo_w.png',
    scheme: 'wafrn',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/images/wafrn-logo.png',
      resizeMode: 'contain',
      backgroundColor: '#151718',
    },
    platforms: ['ios', 'android'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'dev.djara.wafrn-rn',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryAddUsageDescription:
          'WAFRN requires write-only access to your library in order to download images and videos from posts',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/logo_w.png',
        backgroundColor: '#151718',
      },
      blockedPermissions: [
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_MEDIA_AUDIO',
        'android.permission.RECORD_AUDIO',
      ],
      package: 'dev.djara.wafrn_rn',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            { scheme: 'http', host: 'app.wafrn.net' },
            { scheme: 'https', host: 'app.wafrn.net' },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      [
        'expo-video',
        {
          supportsBackgroundPlayback: true,
          supportsPictureInPicture: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: false,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '8453855c-b400-4d59-bd72-0ebfa1a95eb2',
      },
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/8453855c-b400-4d59-bd72-0ebfa1a95eb2',
    },
  } satisfies ExpoConfig,
}
