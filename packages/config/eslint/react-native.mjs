// =============================================================================
// @dhanam-core/config/eslint/react-native — flat config for the mobile app
// =============================================================================
//
// Standalone (does NOT extend base.mjs) because the FlatCompat
// `react-native/all` config registers `react`, `react-hooks`, and
// `react-native` plugins; pairing with base would trigger "Cannot
// redefine plugin".
// =============================================================================

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
      '**/*.d.ts',
    ],
  },

  // ESLint recommended baseline
  js.configs.recommended,

  // react-native/all via FlatCompat — registers react, react-hooks,
  // react-native plugins.
  ...compat.extends('plugin:react-native/all'),

  // TypeScript layer — wires the parser + ts plugin without conflicting
  // with the react-native compat config above.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,

      'max-lines': [
        'error',
        { max: 800, skipBlankLines: true, skipComments: true },
      ],

      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',

      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',

      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/no-raw-text': 'warn',
      'react-native/sort-styles': 'off',

      'prettier/prettier': 'error',
    },
  },

  // Type declaration files: relax line cap
  {
    files: ['**/*.d.ts'],
    rules: { 'max-lines': 'off' },
  },

  // Prettier compatibility — must come last
  prettierConfig,
];

export default config;
