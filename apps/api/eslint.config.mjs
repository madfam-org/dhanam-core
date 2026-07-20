// =============================================================================
// apps/api — flat config for the NestJS API
// =============================================================================

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import nestjs from '@dhanam-core/config/eslint/nestjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nestjs,

  {
    files: ['**/*.ts'],
    // tsconfig.json excludes test files (`**/*spec.ts`, `test/`); without
    // this ignore list the typed-project parser errors out on test files.
    ignores: [
      '**/*.spec.ts',
      '**/__tests__/**/*.ts',
      '**/test/**/*.ts',
      'prisma/**/*.ts',
      'scripts/**/*.ts',
    ],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
      },
    },
    rules: {
      // Local overrides — match the legacy .eslintrc.js
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-unresolved': [
        'error',
        {
          ignore: [
            '^@dhanam-core/',
            '^@prisma/client/runtime',
            '^@core/',
            '^@modules/',
            '^@shared/',
            '^@db$',
            '^@db/',
            '^~/',
          ],
        },
      ],
    },
  },

  // Per-file overrides
  {
    files: ['src/modules/analytics/analytics.service.ts'],
    rules: { 'max-lines': 'off' },
  },

  // Test/spec/script files are linted with relaxed rules (matches the
  // legacy ignorePatterns, but as overrides instead of full ignores so
  // we can still catch egregious problems if they sneak in).
  {
    files: [
      '**/test/**/*.ts',
      '**/*.spec.ts',
      '**/__tests__/**/*.ts',
      'scripts/**/*.ts',
      'prisma/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-unresolved': 'off',
      'import/order': 'off',
      'max-lines': 'off',
    },
  },
];
