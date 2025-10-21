import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import { defineConfig, globalIgnores } from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin';
import pluginJest from 'eslint-plugin-jest';

export default defineConfig([
  globalIgnores(['node_modules/', 'dist/', 'dist-server/', 'coverage/']),
  {
    files: [
      '**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  stylistic.configs.customize({
    semi: true,
    quoteProps: 'as-needed',
  }),
  {
    files: [
      '**/__tests__/*.node.js',
      '**/__tests__/*.browser.js',
      '**/__mocks__/*.js',
      'test/*.js',
      'jest-setup.js',
    ],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);
