// =============================================================================
// @dhanam-core/config/eslint/nestjs — flat config for NestJS apps
// =============================================================================

import globals from 'globals';

import base from './base.mjs';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...base,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];

export default config;
