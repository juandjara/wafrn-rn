module.exports = function (api) {
  api.cache(true)
  const plugins = ['react-native-worklets/plugin']
  if (process.env.NODE_ENV !== 'development') {
    plugins.push([
      'transform-remove-console',
      {
        exclude: ['error', 'warn'],
      },
    ])
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  }
}
