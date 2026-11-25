const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  { ignores: ['ios/*', 'android/*', '.expo/*', 'dist/*', 'public/*'] },
  expo,
  prettier,
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react',
            'react-*',
            '@shopify/*',
            'expo*',
            '@/scene/*',
            '@/ui/*',
            '@/styles/*',
          ],
        },
      ],
    },
  },
  // Reanimated shared values are mutable by design.
  { files: ['src/scene/**'], rules: { 'react-hooks/immutability': 'off' } },
]);
