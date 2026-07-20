// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { AnalyticsModule } from './analytics/analytics.module';
import { CryptoModule } from './crypto/crypto.module';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule, CryptoModule, LoggerModule, AnalyticsModule],
  exports: [PrismaModule, RedisModule, CryptoModule, LoggerModule, AnalyticsModule],
})
export class CoreModule {}