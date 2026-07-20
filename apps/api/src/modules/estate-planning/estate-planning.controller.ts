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
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../core/types/authenticated-request';
import { RequiresFeature } from '@core/feature-gates';
import { FeatureGateGuard } from '@core/feature-gates';

import {
  CreateWillDto,
  UpdateWillDto,
  AddBeneficiaryDto,
  UpdateBeneficiaryDto,
  AddExecutorDto,
  UpdateExecutorDto,
} from './dto';
import { EstatePlanningService } from './estate-planning.service';

@ApiTags('Estate Planning')
@ApiBearerAuth()
@Controller('wills')
@UseGuards(JwtAuthGuard, FeatureGateGuard)
@RequiresFeature('lifeBeat')
@ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
export class EstatePlanningController {
  constructor(private estatePlanningService: EstatePlanningService) {}

  /**
   * Create a new will (draft status)
   */
  @Post()
  @ApiOperation({ summary: 'Create a new will (draft status)' })
  @ApiOkResponse({ description: 'Will created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async createWill(@Body() dto: CreateWillDto, @Req() req: AuthenticatedRequest) {
    return this.estatePlanningService.createWill(dto, req.user.id);
  }

  /**
   * Get all wills for a household
   */
  @Get('household/:householdId')
  @ApiOperation({ summary: 'Get all wills for a household' })
  @ApiParam({ name: 'householdId', description: 'Household UUID' })
  @ApiOkResponse({ description: 'List of wills for the household' })
  @ApiNotFoundResponse({ description: 'Household not found' })
  async findByHousehold(
    @Param('householdId') householdId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.estatePlanningService.findByHousehold(householdId, req.user.id);
  }

  /**
   * Get a single will by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single will by ID' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiOkResponse({ description: 'Will details' })
  @ApiNotFoundResponse({ description: 'Will not found' })
  async findById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.estatePlanningService.findById(id, req.user.id);
  }

  /**
   * Update a will
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a will' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiOkResponse({ description: 'Will updated successfully' })
  @ApiNotFoundResponse({ description: 'Will not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async updateWill(
    @Param('id') id: string,
    @Body() dto: UpdateWillDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.estatePlanningService.updateWill(id, dto, req.user.id);
  }

  /**
   * Delete a will (draft only)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a will (draft only)' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiNoContentResponse({ description: 'Will deleted successfully' })
  @ApiNotFoundResponse({ description: 'Will not found' })
  async deleteWill(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.estatePlanningService.deleteWill(id, req.user.id);
  }

  /**
   * Activate a will
   * Rate limited to prevent abuse: 3 activations per hour
   */
  @Post(':id/activate')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 activations per hour
  @ApiOperation({ summary: 'Activate a will' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiOkResponse({ description: 'Will activated successfully' })
  @ApiNotFoundResponse({ description: 'Will not found' })
  async activateWill(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.estatePlanningService.activateWill(id, req.user.id);
  }

  /**
   * Revoke a will
   * Rate limited to prevent abuse: 5 revocations per hour
   */
  @Post(':id/revoke')
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 revocations per hour
  @ApiOperation({ summary: 'Revoke a will' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiOkResponse({ description: 'Will revoked successfully' })
  @ApiNotFoundResponse({ description: 'Will not found' })
  async revokeWill(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.estatePlanningService.revokeWill(id, req.user.id);
  }

  /**
   * Validate beneficiary allocations
   */
  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate beneficiary allocations' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiOkResponse({ description: 'Validation result' })
  @ApiNotFoundResponse({ description: 'Will not found' })
  async validateWill(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    // Verify access first
    await this.estatePlanningService.findById(id, req.user.id);
    return this.estatePlanningService.validateBeneficiaryAllocations(id);
  }

  /**
   * Add a beneficiary to a will
   */
  @Post(':id/beneficiaries')
  @ApiOperation({ summary: 'Add a beneficiary to a will' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiOkResponse({ description: 'Beneficiary added successfully' })
  @ApiNotFoundResponse({ description: 'Will not found' })
  @ApiBadRequestResponse({ description: 'Invalid beneficiary data' })
  async addBeneficiary(
    @Param('id') id: string,
    @Body() dto: AddBeneficiaryDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.estatePlanningService.addBeneficiary(id, dto, req.user.id);
  }

  /**
   * Update a beneficiary
   */
  @Put(':id/beneficiaries/:beneficiaryId')
  @ApiOperation({ summary: 'Update a beneficiary' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiParam({ name: 'beneficiaryId', description: 'Beneficiary UUID' })
  @ApiOkResponse({ description: 'Beneficiary updated successfully' })
  @ApiNotFoundResponse({ description: 'Will or beneficiary not found' })
  @ApiBadRequestResponse({ description: 'Invalid beneficiary data' })
  async updateBeneficiary(
    @Param('id') id: string,
    @Param('beneficiaryId') beneficiaryId: string,
    @Body() dto: UpdateBeneficiaryDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.estatePlanningService.updateBeneficiary(id, beneficiaryId, dto, req.user.id);
  }

  /**
   * Remove a beneficiary from a will
   */
  @Delete(':id/beneficiaries/:beneficiaryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a beneficiary from a will' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiParam({ name: 'beneficiaryId', description: 'Beneficiary UUID' })
  @ApiNoContentResponse({ description: 'Beneficiary removed successfully' })
  @ApiNotFoundResponse({ description: 'Will or beneficiary not found' })
  async removeBeneficiary(
    @Param('id') id: string,
    @Param('beneficiaryId') beneficiaryId: string,
    @Req() req: AuthenticatedRequest
  ) {
    await this.estatePlanningService.removeBeneficiary(id, beneficiaryId, req.user.id);
  }

  /**
   * Add an executor to a will
   */
  @Post(':id/executors')
  @ApiOperation({ summary: 'Add an executor to a will' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiOkResponse({ description: 'Executor added successfully' })
  @ApiNotFoundResponse({ description: 'Will not found' })
  @ApiBadRequestResponse({ description: 'Invalid executor data' })
  async addExecutor(
    @Param('id') id: string,
    @Body() dto: AddExecutorDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.estatePlanningService.addExecutor(id, dto, req.user.id);
  }

  /**
   * Update an executor
   */
  @Put(':id/executors/:executorId')
  @ApiOperation({ summary: 'Update an executor' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiParam({ name: 'executorId', description: 'Executor UUID' })
  @ApiOkResponse({ description: 'Executor updated successfully' })
  @ApiNotFoundResponse({ description: 'Will or executor not found' })
  @ApiBadRequestResponse({ description: 'Invalid executor data' })
  async updateExecutor(
    @Param('id') id: string,
    @Param('executorId') executorId: string,
    @Body() dto: UpdateExecutorDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.estatePlanningService.updateExecutor(id, executorId, dto, req.user.id);
  }

  /**
   * Remove an executor from a will
   */
  @Delete(':id/executors/:executorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an executor from a will' })
  @ApiParam({ name: 'id', description: 'Will UUID' })
  @ApiParam({ name: 'executorId', description: 'Executor UUID' })
  @ApiNoContentResponse({ description: 'Executor removed successfully' })
  @ApiNotFoundResponse({ description: 'Will or executor not found' })
  async removeExecutor(
    @Param('id') id: string,
    @Param('executorId') executorId: string,
    @Req() req: AuthenticatedRequest
  ) {
    await this.estatePlanningService.removeExecutor(id, executorId, req.user.id);
  }
}