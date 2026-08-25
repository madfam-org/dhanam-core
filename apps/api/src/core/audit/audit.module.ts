// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { CryptoModule } from '@core/crypto/crypto.module';
import { LoggerModule } from '@core/logger/logger.module';
import { PrismaModule } from '@core/prisma/prisma.module';

import { AuditService } from './audit.service';

@Module({
  imports: [PrismaModule, LoggerModule, CryptoModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
