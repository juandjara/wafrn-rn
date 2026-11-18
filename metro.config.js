// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.resolver.platforms = ['ios', 'android', 'web']

module.exports = wrapWithReanimatedMetroConfig(
  withUniwindConfig(config, {
    // it is important that the .css file is not at the root directory level
    // because if it is every file in the folder will be scanned for classNames
    // which might affect reproducibility at build time
    cssEntryFile: './styles/global.css',
  }),
)
