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
const monochromeIcon = isDev
  ? './assets/images/logo_w_dev_monochrome.png'
  : './assets/images/logo_w_monochrome.png'

const plugins = [
  'expo-router',
  'expo-secure-store',
  'expo-font',
  [
    'expo-video',
    {
      supportsBackgroundPlayback: true,
      supportsPictureInPicture: false,
    },
  ],
  [
    'expo-share-intent',
    {
      iosActivationRules: {
        NSExtensionActivationSupportsText: true,
        NSExtensionActivationSupportsWebURLWithMaxCount: 1,
        NSExtensionActivationSupportsWebPageWithMaxCount: 1,
        NSExtensionActivationSupportsImageWithMaxCount: 1,
        NSExtensionActivationSupportsMovieWithMaxCount: 1,
        NSExtensionActivationSupportsFileWithMaxCount: 1,
      },
      disableAndroid: true,
    },
  ],
] as ExpoConfig['plugins']

if (isDev) {
  plugins!.push([
    'expo-dev-client',
    {
      launchMode: 'launcher',
    },
  ])
}

let instances: string[] = []
try {
  instances = require('./instances.json')
} catch {
  console.error('error loading file instances.json')
}

const ATPROTO_INTENT_LINKS = ['bsky.app', 'witchsky.app', 'deer.social']

function intentLink(host: string, autoVerify: boolean) {
  return {
    action: 'VIEW',
    autoVerify,
    data: [{ scheme: 'https', host }],
    category: ['BROWSABLE', 'DEFAULT'],
  }
}

export default {
  expo: {
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
      associatedDomains: instances.map((l) => `applinks:${l}`),
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
        monochromeImage: monochromeIcon,
        backgroundColor: '#151718',
      },
      permissions: [],
      package: appId,
      intentFilters: [
        ...instances.map((host) => intentLink(host, true)),
        ...ATPROTO_INTENT_LINKS.map((host) => intentLink(host, false)),
      ],
    },
    plugins,
    experiments: {
      typedRoutes: false,
      reactCompiler: true,
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
  } satisfies ExpoConfig,
}
