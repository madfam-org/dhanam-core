// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from '../../core/prisma/prisma.module';
import { SpacesModule } from '../spaces/spaces.module';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategorizationRulesController } from './categorization-rules.controller';
import { RulesService } from './rules.service';

// CategoriesModule and SpacesModule reference each other; forwardRef defers
// the SpacesModule edge so module-graph construction completes. Provider DI
// still resolves once both modules are constructed.
@Module({
  imports: [PrismaModule, forwardRef(() => SpacesModule)],
  controllers: [CategoriesController, CategorizationRulesController],
  providers: [CategoriesService, RulesService],
  exports: [CategoriesService, RulesService],
})
export class CategoriesModule {}