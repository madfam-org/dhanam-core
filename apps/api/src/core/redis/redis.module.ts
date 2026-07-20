// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { RedisService } from './redis.service';

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}