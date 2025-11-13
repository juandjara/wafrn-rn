import type { ExpoConfig } from 'expo/config'
import pkg from './package.json'

const versionName = pkg.version
const [major, minor, patch] = versionName.split('.').map(Number)
const versionNumber = major * 1000000 + minor * 1000 + patch

const isDev = process.env.NODE_ENV === 'development'
const appId = isDev ? 'dev.djara.wafrn_rn.dev' : 'dev.djara.wafrn_rn'
const name = isDev ? 'Wafrn Dev' : 'Wafrn'
const icon = isDev
  ? './assets/images/logo_w_dev.png'
  : './assets/images/logo_w.png'

export default {
  expo: {
    newArchEnabled: true,
    name,
    slug: 'wafrn-rn',
    version: versionName,
    orientation: 'portrait',
    icon,
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
      bundleIdentifier: isDev ? 'dev.djara.wafrn-rn.dev' : 'dev.djara.wafrn-rn',
      infoPlist: {
        UIBackgroundModes: ['audio', 'remote-notification'],
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryAddUsageDescription:
          'WAFRN requires write-only access to your library in order to download images and videos from posts',
      },
    },
    android: {
      versionCode: versionNumber,
      adaptiveIcon: {
        foregroundImage: icon,
        backgroundColor: '#151718',
      },
      permissions: [],
      package: appId,
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: 'app.wafrn.net' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      edgeToEdgeEnabled: true,
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      [
        'expo-dev-client',
        {
          launchMode: 'launcher',
        },
      ],
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
    runtimeVersion: pkg.version,
    updates: {
      enabled: true,
      url: 'https://u.expo.dev/8453855c-b400-4d59-bd72-0ebfa1a95eb2',
      requestHeaders: {
        'expo-channel-name': 'preview',
      },
      checkAutomatically: 'NEVER',
    },
  } satisfies ExpoConfig,
}
