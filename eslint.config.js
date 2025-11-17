// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const prettierConfig = require('eslint-plugin-prettier/recommended')
const reactCompiler = require('eslint-plugin-react-compiler')

module.exports = defineConfig([
  expoConfig,
  reactCompiler.configs.recommended,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo', 'node_modules'],
    rules: {
      'react/no-children-prop': 'off',
    },
  },
])
