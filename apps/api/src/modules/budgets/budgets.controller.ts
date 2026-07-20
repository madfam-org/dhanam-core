// SPDX-License-Identifier: AGPL-3.0-or-later
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { BudgetsService } from './budgets.service';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetResponseDto,
  BudgetSummaryDto,
  UpdateIncomeDto,
  AllocateFundsDto,
  RolloverBudgetDto,
} from './dto';

@ApiTags('budgets')
@Controller('spaces/:spaceId/budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all budgets in a space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ type: [BudgetResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findAll(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.budgetsService.findAll(spaceId, req.user!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a budget by id' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiOkResponse({ type: BudgetResponseDto })
  @ApiNotFoundResponse({ description: 'Budget not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findOne(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.budgetsService.findOne(spaceId, req.user!.id, id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get budget summary with spending details' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiOkResponse({ type: BudgetSummaryDto })
  @ApiNotFoundResponse({ description: 'Budget not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  getBudgetSummary(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request
  ) {
    return this.budgetsService.getBudgetSummary(spaceId, req.user!.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ type: BudgetResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  create(
    @Param('spaceId') spaceId: string,
    @Body() createBudgetDto: CreateBudgetDto,
    @Req() req: Request
  ) {
    return this.budgetsService.create(spaceId, req.user!.id, createBudgetDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiOkResponse({ type: BudgetResponseDto })
  @ApiNotFoundResponse({ description: 'Budget not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Req() req: Request
  ) {
    return this.budgetsService.update(spaceId, req.user!.id, id, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiNotFoundResponse({ description: 'Budget not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.budgetsService.remove(spaceId, req.user!.id, id);
  }

  @Patch(':id/income')
  @ApiOperation({ summary: 'Update budget income for zero-based allocation' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiOkResponse({ type: BudgetResponseDto })
  @ApiNotFoundResponse({ description: 'Budget not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  updateIncome(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() updateIncomeDto: UpdateIncomeDto,
    @Req() req: Request
  ) {
    return this.budgetsService.updateIncome(spaceId, req.user!.id, id, updateIncomeDto);
  }

  @Post(':id/allocate')
  @ApiOperation({ summary: 'Allocate funds to a category (zero-based budgeting)' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiOkResponse({ type: BudgetResponseDto })
  @ApiNotFoundResponse({ description: 'Budget not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  allocateFunds(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() allocateFundsDto: AllocateFundsDto,
    @Req() req: Request
  ) {
    return this.budgetsService.allocateFunds(spaceId, req.user!.id, id, allocateFundsDto);
  }

  @Post(':id/rollover')
  @ApiOperation({ summary: 'Rollover unspent funds to next budget period' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiOkResponse({ type: BudgetResponseDto })
  @ApiNotFoundResponse({ description: 'Budget not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  rolloverBudget(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() rolloverBudgetDto: RolloverBudgetDto,
    @Req() req: Request
  ) {
    return this.budgetsService.rolloverBudget(spaceId, req.user!.id, id, rolloverBudgetDto);
  }
}