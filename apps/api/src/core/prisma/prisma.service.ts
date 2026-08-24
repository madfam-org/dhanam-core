// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '@db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    // Build database URL with connection pool configuration
    const databaseUrl = configService.get('database.url') || configService.get('DATABASE_URL');
    const poolSize = configService.get('DATABASE_POOL_SIZE')
      ? parseInt(configService.get('DATABASE_POOL_SIZE')!, 10)
      : 10;

    // Create pg Pool for the Prisma 7 driver adapter
    const pool = new Pool({
      connectionString: databaseUrl,
      max: poolSize,
      idleTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log:
        configService.get('NODE_ENV') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    // Pool is already ended by $disconnect() through the PrismaPg adapter
  }

  async cleanDatabase() {
    if (this.configService.get('NODE_ENV') !== 'test') {
      throw new Error('cleanDatabase is only allowed in test environment');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && key[0] !== '_' && key[0] !== '$'
    ) as string[];

    return Promise.all(models.map((model) => (this as any)[model].deleteMany()));
  }
}
