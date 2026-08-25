// SPDX-License-Identifier: AGPL-3.0-or-later
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 configuration. The connection URL for `prisma db push` / `migrate`
// is read from DATABASE_URL. dhanam-core ships no seed script (the proprietary
// demo/seed data is not part of the open core).
//
// The fallback URL exists because this file is loaded by `prisma generate`,
// which runs on postinstall and never connects to a database — a strict
// env('DATABASE_URL') here made a bare `pnpm install` (and CI) fail for anyone
// without a database configured. Commands that DO connect (db push / migrate)
// still require a real DATABASE_URL; the fallback points at nothing.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/dhanam_core_dev',
  },
});
