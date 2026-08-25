// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiNoContentResponse,
  ApiPaymentRequiredResponse,
} from '@nestjs/swagger';

import { UsageMetricType, TrackUsage, UsageLimitGuard } from '@core/feature-gates';
import { GoalShareRole } from '@db';

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../core/types/authenticated-request';

import { CreateGoalDto, UpdateGoalDto, AddAllocationDto } from './dto';
import { GoalCollaborationService } from './goal-collaboration.service';
import { GoalProbabilityService } from './goal-probability.service';
import { GoalsService } from './goals.service';

@ApiTags('Goals')
@ApiBearerAuth()
@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(
    private goalsService: GoalsService,
    private goalProbabilityService: GoalProbabilityService,
    private goalCollaborationService: GoalCollaborationService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiCreatedResponse({ description: 'Goal created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async create(@Body() dto: CreateGoalDto, @Req() req: AuthenticatedRequest) {
    return this.goalsService.create(dto, req.user.id);
  }

  @Get('space/:spaceId')
  @ApiOperation({ summary: 'Get all goals for a space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'List of goals in the space' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async findBySpace(@Param('spaceId') spaceId: string, @Req() req: AuthenticatedRequest) {
    return this.goalsService.findBySpace(spaceId, req.user.id);
  }

  @Get('space/:spaceId/summary')
  @ApiOperation({ summary: 'Get summary for all goals in a space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Goals summary for the space' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getSummary(@Param('spaceId') spaceId: string, @Req() req: AuthenticatedRequest) {
    return this.goalsService.getSummary(spaceId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single goal by ID' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiOkResponse({ description: 'Goal details' })
  @ApiNotFoundResponse({ description: 'Goal not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this goal' })
  async findById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.goalsService.findById(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiOkResponse({ description: 'Goal updated successfully' })
  @ApiNotFoundResponse({ description: 'Goal not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this goal' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.goalsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiNoContentResponse({ description: 'Goal deleted successfully' })
  @ApiNotFoundResponse({ description: 'Goal not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this goal' })
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.goalsService.delete(id, req.user.id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get progress for a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiOkResponse({ description: 'Goal progress details' })
  @ApiNotFoundResponse({ description: 'Goal not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this goal' })
  async getProgress(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.goalsService.calculateProgress(id, req.user.id);
  }

  @Post(':id/allocations')
  @ApiOperation({ summary: 'Add an allocation to a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiCreatedResponse({ description: 'Allocation added successfully' })
  @ApiNotFoundResponse({ description: 'Goal or account not found' })
  @ApiBadRequestResponse({ description: 'Invalid allocation data' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this goal' })
  async addAllocation(
    @Param('id') id: string,
    @Body() dto: AddAllocationDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.goalsService.addAllocation(id, dto, req.user.id);
  }

  @Delete(':id/allocations/:accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an allocation from a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiParam({ name: 'accountId', description: 'Account UUID to remove from allocation' })
  @ApiNoContentResponse({ description: 'Allocation removed successfully' })
  @ApiNotFoundResponse({ description: 'Goal or allocation not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this goal' })
  async removeAllocation(
    @Param('id') id: string,
    @Param('accountId') accountId: string,
    @Req() req: AuthenticatedRequest
  ) {
    await this.goalsService.removeAllocation(id, accountId, req.user.id);
  }

  @Get(':id/probability')
  @UseGuards(UsageLimitGuard)
  @TrackUsage(UsageMetricType.goal_probability)
  @ApiOperation({ summary: 'Get goal probability (Monte Carlo simulation)' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiOkResponse({ description: 'Goal probability calculation result' })
  @ApiNotFoundResponse({ description: 'Goal not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiPaymentRequiredResponse({ description: 'Daily goal probability limit exceeded' })
  @ApiForbiddenResponse({ description: 'User lacks access to this goal' })
  async getProbability(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.goalProbabilityService.calculateGoalProbability(req.user.id, id);
  }

  @Post(':id/probability/update')
  @UseGuards(UsageLimitGuard)
  @TrackUsage(UsageMetricType.goal_probability)
  @ApiOperation({ summary: 'Update goal probability (recalculate)' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiOkResponse({ description: 'Probability updated successfully' })
  @ApiNotFoundResponse({ description: 'Goal not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiPaymentRequiredResponse({ description: 'Daily goal probability limit exceeded' })
  @ApiForbiddenResponse({ description: 'User lacks access to this goal' })
  async updateProbability(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.goalProbabilityService.updateGoalProbability(req.user.id, id);
    return { message: 'Probability updated successfully' };
  }

  @Post(':id/what-if')
  @UseGuards(UsageLimitGuard)
  @TrackUsage(UsageMetricType.goal_probability)
  @ApiOperation({ summary: 'Run what-if scenario for a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiOkResponse({ description: 'What-if scenario results' })
  @ApiNotFoundResponse({ description: 'Goal not found' })
  @ApiBadRequestResponse({ description: 'Invalid scenario parameters' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiPaymentRequiredResponse({ description: 'Daily goal probability limit exceeded' })
  @ApiForbiddenResponse({ description: 'User lacks access to this goal' })
  async runWhatIf(
    @Param('id') id: string,
    @Body()
    scenario: {
      monthlyContribution?: number;
      targetAmount?: number;
      targetDate?: string;
      expectedReturn?: number;
      volatility?: number;
    },
    @Req() req: AuthenticatedRequest
  ) {
    const scenarioData = {
      ...scenario,
      targetDate: scenario.targetDate ? new Date(scenario.targetDate) : undefined,
    };
    return this.goalProbabilityService.runWhatIfScenario(req.user.id, id, scenarioData);
  }

  @Post('space/:spaceId/probability/update-all')
  @UseGuards(UsageLimitGuard)
  @TrackUsage(UsageMetricType.goal_probability)
  @ApiOperation({ summary: 'Bulk update probabilities for all goals in a space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'All goal probabilities updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiPaymentRequiredResponse({ description: 'Daily goal probability limit exceeded' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async updateAllProbabilities(
    @Param('spaceId') spaceId: string,
    @Req() req: AuthenticatedRequest
  ) {
    await this.goalProbabilityService.updateAllGoalProbabilities(req.user.id, spaceId);
    return { message: 'All goal probabilities updated successfully' };
  }

  // ==================== Collaboration Endpoints ====================

  @Post(':id/share')
  @ApiOperation({ summary: 'Share a goal with another user' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiCreatedResponse({ description: 'Goal shared successfully' })
  @ApiNotFoundResponse({ description: 'Goal or user not found' })
  @ApiBadRequestResponse({ description: 'Invalid share request' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks permission to share this goal' })
  async shareGoal(
    @Param('id') goalId: string,
    @Body()
    body: {
      shareWithEmail: string;
      role: GoalShareRole;
      message?: string;
    },
    @Req() req: AuthenticatedRequest
  ) {
    return this.goalCollaborationService.shareGoal(req.user.id, {
      goalId,
      ...body,
    });
  }

  @Get(':id/shares')
  @ApiOperation({ summary: 'Get all shares for a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiOkResponse({ description: 'List of goal shares' })
  @ApiNotFoundResponse({ description: 'Goal not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this goal' })
  async getGoalShares(@Param('id') goalId: string, @Req() req: AuthenticatedRequest) {
    return this.goalCollaborationService.getGoalShares(req.user.id, goalId);
  }

  @Get('shared/me')
  @ApiOperation({ summary: 'Get all goals shared with me' })
  @ApiOkResponse({ description: 'List of goals shared with current user' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getSharedGoals(@Req() req: AuthenticatedRequest) {
    return this.goalCollaborationService.getSharedGoals(req.user.id);
  }

  @Post('shares/:shareId/accept')
  @ApiOperation({ summary: 'Accept a goal share invitation' })
  @ApiParam({ name: 'shareId', description: 'Share invitation UUID' })
  @ApiOkResponse({ description: 'Share invitation accepted' })
  @ApiNotFoundResponse({ description: 'Share invitation not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Share invitation not for this user' })
  async acceptShare(@Param('shareId') shareId: string, @Req() req: AuthenticatedRequest) {
    return this.goalCollaborationService.acceptShare(req.user.id, shareId);
  }

  @Post('shares/:shareId/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Decline a goal share invitation' })
  @ApiParam({ name: 'shareId', description: 'Share invitation UUID' })
  @ApiNoContentResponse({ description: 'Share invitation declined' })
  @ApiNotFoundResponse({ description: 'Share invitation not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'Share invitation not for this user' })
  async declineShare(@Param('shareId') shareId: string, @Req() req: AuthenticatedRequest) {
    await this.goalCollaborationService.declineShare(req.user.id, shareId);
  }

  @Delete('shares/:shareId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a goal share' })
  @ApiParam({ name: 'shareId', description: 'Share UUID to revoke' })
  @ApiNoContentResponse({ description: 'Share revoked successfully' })
  @ApiNotFoundResponse({ description: 'Share not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks permission to revoke this share' })
  async revokeShare(@Param('shareId') shareId: string, @Req() req: AuthenticatedRequest) {
    await this.goalCollaborationService.revokeShare(req.user.id, shareId);
  }

  @Put('shares/:shareId/role')
  @ApiOperation({ summary: 'Update share role' })
  @ApiParam({ name: 'shareId', description: 'Share UUID' })
  @ApiOkResponse({ description: 'Share role updated' })
  @ApiNotFoundResponse({ description: 'Share not found' })
  @ApiBadRequestResponse({ description: 'Invalid role value' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks permission to update this share' })
  async updateShareRole(
    @Param('shareId') shareId: string,
    @Body() body: { newRole: GoalShareRole },
    @Req() req: AuthenticatedRequest
  ) {
    return this.goalCollaborationService.updateShareRole(req.user.id, {
      shareId,
      newRole: body.newRole,
    });
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get activity feed for a goal' })
  @ApiParam({ name: 'id', description: 'Goal UUID' })
  @ApiOkResponse({ description: 'Goal activity feed' })
  @ApiNotFoundResponse({ description: 'Goal not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this goal' })
  async getGoalActivities(@Param('id') goalId: string, @Req() req: AuthenticatedRequest) {
    return this.goalCollaborationService.getGoalActivities(req.user.id, goalId);
  }
}
