// Learn more https://docs.expo.io/guides/customizing-metro
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks')
const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro')
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

module.exports = wrapWithReanimatedMetroConfig(
  withUniwindConfig(config, {
    cssEntryFile: './styles.css',
  }),
)
