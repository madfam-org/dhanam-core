// =============================================================================
// @dhanam-core/config/eslint/nextjs — flat config for Next.js apps
// =============================================================================
//
// Standalone (does NOT extend base.mjs) because next/core-web-vitals
// already registers the `import`, `react`, `react-hooks`, `jsx-a11y`,
// and TypeScript plugins. Re-registering them via base would trigger
// flat-config's "Cannot redefine plugin" error.
//
// We bring in Next's classic config via FlatCompat, then layer the
// dhanam-specific rules (file size cap, import order, prettier) on top.
// =============================================================================

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
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
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
      '**/*.d.ts',
      '**/generated/**',
    ],
  },

  // ESLint recommended baseline
  js.configs.recommended,

  // Next.js core-web-vitals — registers the `import`, `react`,
  // `react-hooks`, `jsx-a11y`, and `@typescript-eslint` plugins.
  ...compat.extends('next/core-web-vitals'),

  // Add Prettier integration (it isn't part of next/core-web-vitals).
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: { prettier: prettierPlugin },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },

  // Wire @typescript-eslint explicitly. next/core-web-vitals references
  // ts-eslint rules but doesn't always register the plugin in flat-config
  // compat mode, so we register it here under the same plugin key the
  // rules expect.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },

  // dhanam-specific overrides
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // File size discipline — hard limit at 800 lines
      'max-lines': [
        'error',
        { max: 800, skipBlankLines: true, skipComments: true },
      ],

      // TypeScript's parser handles undefined-name detection more
      // accurately than ESLint's plain `no-undef` (it knows about
      // ambient types like `React.ReactNode`, `JSX`, etc). Per the
      // @typescript-eslint guide we turn the base rule off for TS files.
      'no-undef': 'off',

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

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
      'react/no-unescaped-entities': 'off',

      'jsx-a11y/anchor-is-valid': [
        'error',
        {
          components: ['Link'],
          specialLink: ['hrefLeft', 'hrefRight'],
          aspects: ['invalidHref', 'preferButton'],
        },
      ],
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
