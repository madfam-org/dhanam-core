// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from '@nestjs/common';

import { AuditModule } from '../../core/audit/audit.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SimulationsModule } from '../simulations/simulations.module';

import { GoalCollaborationService } from './goal-collaboration.service';
import { GoalProbabilityService } from './goal-probability.service';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [PrismaModule, AuditModule, SimulationsModule],
  controllers: [GoalsController],
  providers: [GoalsService, GoalProbabilityService, GoalCollaborationService],
  exports: [GoalsService, GoalProbabilityService, GoalCollaborationService],
})
export class GoalsModule {}
