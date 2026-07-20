// =============================================================================
// apps/web — flat config for the Next.js web app
// =============================================================================

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import nextjs from '@dhanam-core/config/eslint/nextjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextjs,

  {
    settings: {
      next: {
        rootDir: __dirname,
      },
    },
  },

  // NOTE: type-aware lint via `projectService: true` was removed because
  // it forced the TS compiler to re-load the full program for each file
  // (~18s per file × thousands of files = the lint hook hung indefinitely).
  // The rules we actually enforce (import/order, prettier, no-undef,
  // no-unused-vars) don't need type info — they're syntactic. If we ever
  // need a type-aware rule, gate it behind a separate `pnpm lint:types`
  // script run in CI rather than the local pre-push hook.

  // Test files: relaxed
  // Tests legitimately import vi/jest mock helpers, declare unused vars
  // for fixture readability, and use require() inside vi.mock() factories
  // to avoid hoisting issues — relax those rules instead of polluting
  // every test file with eslint-disable comments.
  {
    files: ['**/*.test.{ts,tsx}', 'src/__mocks__/**', 'src/**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'max-lines': 'off',
    },
  },
];
