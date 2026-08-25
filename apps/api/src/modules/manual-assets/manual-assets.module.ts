// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';
import { StorageModule } from '../storage/storage.module';

import { DocumentExtractionService } from './document-extraction.service';
import { DocumentService } from './document.service';
import { ManualAssetsController } from './manual-assets.controller';
import { ManualAssetsService } from './manual-assets.service';
import { PEAnalyticsService } from './pe-analytics.service';
import { StatementMaterializationService } from './statement-materialization.service';

@Module({
  imports: [PrismaModule, SpacesModule, StorageModule, HttpModule.register({ timeout: 60_000 })],
  controllers: [ManualAssetsController],
  providers: [
    ManualAssetsService,
    PEAnalyticsService,
    DocumentService,
    DocumentExtractionService,
    StatementMaterializationService,
  ],
  exports: [ManualAssetsService, PEAnalyticsService, DocumentService],
})
export class ManualAssetsModule {}
