// SPDX-License-Identifier: AGPL-3.0-or-later
// Jest setup for @dhanam-core/ui — referenced by jest.config.cjs
// (setupFilesAfterEnv). The open-core extraction shipped the config but not
// this file, which made `jest --passWithNoTests` fail before running anything.
import '@testing-library/jest-dom';
