// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';

import { NaturalLanguageService } from './natural-language.service';
import { SearchController } from './search.controller';

@Module({
  imports: [PrismaModule, SpacesModule],
  controllers: [SearchController],
  providers: [NaturalLanguageService],
  exports: [NaturalLanguageService],
})
export class SearchModule {}
