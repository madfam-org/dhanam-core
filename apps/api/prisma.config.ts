// SPDX-License-Identifier: AGPL-3.0-or-later
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 configuration. The connection URL for `prisma db push` / `migrate`
// is read from DATABASE_URL. dhanam-core ships no seed script (the proprietary
// demo/seed data is not part of the open core).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
