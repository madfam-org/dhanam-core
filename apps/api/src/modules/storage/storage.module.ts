// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { R2StorageService } from './r2.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [R2StorageService],
  exports: [R2StorageService],
})
export class StorageModule {}
