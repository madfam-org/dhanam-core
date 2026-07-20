// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module, forwardRef } from '@nestjs/common';

import { LoggerModule } from '@core/logger/logger.module';
import { PrismaModule } from '@core/prisma/prisma.module';

import { SpacesModule } from '../spaces/spaces.module';

import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  imports: [forwardRef(() => SpacesModule), PrismaModule, LoggerModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
