// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    rules: {
      // Journal text must never reach logs or crash reports.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Apostrophes in React Native <Text> are fine; this rule is for HTML.
      'react/no-unescaped-entities': 'off',
    },
  },
]);
