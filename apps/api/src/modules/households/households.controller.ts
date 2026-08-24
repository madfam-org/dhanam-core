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
  ApiNoContentResponse,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { RequiresFeature, FeatureGateGuard } from '@core/feature-gates';

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../core/types/authenticated-request';

import { CreateHouseholdDto, UpdateHouseholdDto, AddMemberDto, UpdateMemberDto } from './dto';
import { HouseholdsService } from './households.service';

@ApiTags('Households')
@ApiBearerAuth()
@Controller('households')
@UseGuards(JwtAuthGuard, FeatureGateGuard)
@RequiresFeature('householdViews')
@ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
export class HouseholdsController {
  constructor(private householdsService: HouseholdsService) {}

  /**
   * Create a new household
   */
  @Post()
  @ApiOperation({ summary: 'Create a new household' })
  @ApiCreatedResponse({ description: 'Household created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async create(@Body() dto: CreateHouseholdDto, @Req() req: AuthenticatedRequest) {
    return this.householdsService.create(dto, req.user.id);
  }

  /**
   * Get all households for the current user
   */
  @Get()
  @ApiOperation({ summary: 'Get all households for the current user' })
  @ApiOkResponse({ description: 'List of households' })
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.householdsService.findByUser(req.user.id);
  }

  /**
   * Get a single household by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single household by ID' })
  @ApiParam({ name: 'id', description: 'Household UUID' })
  @ApiOkResponse({ description: 'Household details' })
  @ApiNotFoundResponse({ description: 'Household not found' })
  async findById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.householdsService.findById(id, req.user.id);
  }

  /**
   * Update a household
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a household' })
  @ApiParam({ name: 'id', description: 'Household UUID' })
  @ApiOkResponse({ description: 'Household updated successfully' })
  @ApiNotFoundResponse({ description: 'Household not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHouseholdDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.householdsService.update(id, dto, req.user.id);
  }

  /**
   * Delete a household
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a household' })
  @ApiParam({ name: 'id', description: 'Household UUID' })
  @ApiNoContentResponse({ description: 'Household deleted successfully' })
  @ApiNotFoundResponse({ description: 'Household not found' })
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.householdsService.delete(id, req.user.id);
  }

  /**
   * Get household net worth aggregation
   */
  @Get(':id/net-worth')
  @ApiOperation({ summary: 'Get household net worth aggregation' })
  @ApiParam({ name: 'id', description: 'Household UUID' })
  @ApiOkResponse({ description: 'Household net worth' })
  @ApiNotFoundResponse({ description: 'Household not found' })
  async getNetWorth(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.householdsService.getNetWorth(id, req.user.id);
  }

  /**
   * Get household goal summary
   */
  @Get(':id/goals/summary')
  @ApiOperation({ summary: 'Get household goal summary' })
  @ApiParam({ name: 'id', description: 'Household UUID' })
  @ApiOkResponse({ description: 'Household goal summary' })
  @ApiNotFoundResponse({ description: 'Household not found' })
  async getGoalSummary(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.householdsService.getGoalSummary(id, req.user.id);
  }

  /**
   * Add a member to a household
   */
  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to a household' })
  @ApiParam({ name: 'id', description: 'Household UUID' })
  @ApiCreatedResponse({ description: 'Member added successfully' })
  @ApiNotFoundResponse({ description: 'Household not found' })
  @ApiBadRequestResponse({ description: 'Invalid member data' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.householdsService.addMember(id, dto, req.user.id);
  }

  /**
   * Update a household member
   */
  @Put(':id/members/:memberId')
  @ApiOperation({ summary: 'Update a household member' })
  @ApiParam({ name: 'id', description: 'Household UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID' })
  @ApiOkResponse({ description: 'Member updated successfully' })
  @ApiNotFoundResponse({ description: 'Household or member not found' })
  @ApiBadRequestResponse({ description: 'Invalid member data' })
  async updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.householdsService.updateMember(id, memberId, dto, req.user.id);
  }

  /**
   * Remove a member from a household
   */
  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a household' })
  @ApiParam({ name: 'id', description: 'Household UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID' })
  @ApiNoContentResponse({ description: 'Member removed successfully' })
  @ApiNotFoundResponse({ description: 'Household or member not found' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: AuthenticatedRequest
  ) {
    await this.householdsService.removeMember(id, memberId, req.user.id);
  }
}
