// =============================================================================
// @dhanam-core/config/eslint/base — flat-config baseline
// =============================================================================
//
// ESLint 9 flat config. Replaces the legacy `.eslintrc.js` baseline.
// Apps consume this via:
//
//   // <app>/eslint.config.mjs
//   import base from '@dhanam-core/config/eslint/base';
//   export default base;
//
// or extend with overrides:
//
//   import base from '@dhanam-core/config/eslint/base';
//   export default [
//     ...base,
//     { rules: { 'no-console': 'off' } },
//   ];
//
// Long-term direction (RFC dhanam#338):
//   - eslint v9 flat config, no `.eslintrc.*`
//   - @typescript-eslint v8.x (the version that fixes the
//     `no-unused-expressions` allowShortCircuit bug)
//   - File size cap of 800 lines stays — it's a discipline rule
//     across the org.
// =============================================================================

import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // 1. Global ignores — replaces the legacy `ignorePatterns` array
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
      '**/.expo/**',
    ],
  },

  // 2. ESLint recommended baseline
  js.configs.recommended,

  // 3. TypeScript recommended (manually wired — flat-config equivalent
  //    of `extends: 'plugin:@typescript-eslint/recommended'`)
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,

      // File size discipline — hard limit at 800 lines
      'max-lines': ['error', { max: 800, skipBlankLines: true, skipComments: true }],

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
      'no-redeclare': 'off',
      'no-undef': 'off',

      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',

      'prettier/prettier': 'error',
    },
  },

  // 4. JS files — same plugins minus TypeScript
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prettier/prettier': 'error',
    },
  },

  // 5. Type declaration files often mirror generated code; let them be huge
  {
    files: ['**/*.d.ts'],
    rules: { 'max-lines': 'off' },
  },

  // 6. Prettier compatibility — must come last; turns off rules that
  //    conflict with Prettier formatting
  prettierConfig,
];

export default config;
