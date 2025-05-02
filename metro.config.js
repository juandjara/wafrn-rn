// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// config.transformer.getTransformOptions = async () => ({
//   transform: {
//     experimentalImportSupport: true,
//     inlineRequires: true,
//   },
// });

module.exports = wrapWithReanimatedMetroConfig(
  withNativeWind(config, { input: './styles.css' }),
)
