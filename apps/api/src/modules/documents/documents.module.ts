// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { AuditModule } from '@core/audit/audit.module';
import { PrismaModule } from '@core/prisma/prisma.module';

import { SpacesModule } from '../spaces/spaces.module';

import { CsvImportService } from './csv-import.service';
import { CsvPreviewService } from './csv-preview.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [PrismaModule, SpacesModule, AuditModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, CsvPreviewService, CsvImportService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
