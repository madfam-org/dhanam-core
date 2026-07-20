// SPDX-License-Identifier: AGPL-3.0-or-later
import { User } from '@dhanam-core/shared';
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { Currency } from '@db';

import { SpaceGuard } from '../spaces/guards/space.guard';

import { ZeroBasedService } from './zero-based.service';

// DTOs for request/response
class CreateIncomeEventRequestDto {
  amount!: number;
  currency!: Currency;
  source!: string;
  description?: string;
  receivedAt!: string;
}

class AllocateFundsRequestDto {
  incomeEventId?: string;
  categoryId!: string;
  amount!: number;
  notes?: string;
}

class MoveFundsRequestDto {
  fromCategoryId!: string;
  toCategoryId!: string;
  amount!: number;
  notes?: string;
}

class SetCategoryGoalRequestDto {
  goalType!: 'monthly_spending' | 'target_balance' | 'weekly_spending' | 'percentage_income';
  targetAmount?: number;
  targetDate?: string;
  monthlyFunding?: number;
  percentageTarget?: number;
  notes?: string;
}

class RolloverMonthRequestDto {
  fromMonth!: string;
  toMonth!: string;
}

@ApiTags('Zero-Based Budgeting')
@Controller('budgets/zero-based')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ZeroBasedController {
  constructor(private readonly zeroBasedService: ZeroBasedService) {}

  @Get('spaces/:spaceId/allocation-status')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Get allocation status for a month',
    description:
      'Returns "Ready to Assign" amount, category allocations, and spending for envelope budgeting',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Month in YYYY-MM format (defaults to current month)',
  })
  @ApiResponse({
    status: 200,
    description: 'Allocation status for the month',
    schema: {
      type: 'object',
      properties: {
        month: { type: 'string', example: '2025-01' },
        totalIncome: { type: 'number' },
        totalAllocated: { type: 'number' },
        unallocated: { type: 'number', description: '"Ready to Assign" amount' },
        totalSpent: { type: 'number' },
        isFullyAllocated: { type: 'boolean' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryId: { type: 'string' },
              categoryName: { type: 'string' },
              allocated: { type: 'number' },
              spent: { type: 'number' },
              available: { type: 'number' },
              isOverspent: { type: 'boolean' },
              goalProgress: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getAllocationStatus(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Query('month') month?: string
  ) {
    return this.zeroBasedService.getAllocationStatus(user.id, spaceId, month);
  }

  @Get('spaces/:spaceId/income-events')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get income events for a space' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of income events' })
  async getIncomeEvents(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string
  ) {
    return this.zeroBasedService.getIncomeEvents(user.id, spaceId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('spaces/:spaceId/income-events')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Create a new income event',
    description: 'Record when money is received (paycheck, freelance, refund, etc.)',
  })
  @ApiBody({ type: CreateIncomeEventRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Income event created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        amount: { type: 'number' },
      },
    },
  })
  async createIncomeEvent(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateIncomeEventRequestDto
  ) {
    return this.zeroBasedService.createIncomeEvent(user.id, spaceId, {
      ...dto,
      receivedAt: new Date(dto.receivedAt),
    });
  }

  @Post('spaces/:spaceId/allocate')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Allocate funds to a category',
    description: 'Assign money from "Ready to Assign" to a specific budget category',
  })
  @ApiBody({ type: AllocateFundsRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Funds allocated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        remainingUnallocated: { type: 'number' },
      },
    },
  })
  async allocateFunds(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() dto: AllocateFundsRequestDto
  ) {
    return this.zeroBasedService.allocateToCategory(user.id, spaceId, dto);
  }

  @Post('spaces/:spaceId/move-funds')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Move funds between categories',
    description: 'Transfer allocated money from one category to another',
  })
  @ApiBody({ type: MoveFundsRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Funds moved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  async moveFunds(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() dto: MoveFundsRequestDto
  ) {
    return this.zeroBasedService.moveBetweenCategories(user.id, spaceId, dto);
  }

  @Post('spaces/:spaceId/auto-allocate')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Auto-allocate based on category goals',
    description: 'Automatically distribute unallocated funds based on configured category goals',
  })
  @ApiQuery({
    name: 'incomeEventId',
    required: false,
    description: 'Specific income event to allocate (optional)',
  })
  @ApiResponse({
    status: 201,
    description: 'Auto-allocation completed',
    schema: {
      type: 'object',
      properties: {
        allocations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryId: { type: 'string' },
              amount: { type: 'number' },
            },
          },
        },
        remainingUnallocated: { type: 'number' },
      },
    },
  })
  async autoAllocate(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Query('incomeEventId') incomeEventId?: string
  ) {
    return this.zeroBasedService.autoAllocate(user.id, spaceId, incomeEventId);
  }

  @Post('spaces/:spaceId/rollover')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Rollover unspent funds to next month',
    description: 'Carry over positive category balances to the next budget period',
  })
  @ApiBody({ type: RolloverMonthRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Rollover completed',
    schema: {
      type: 'object',
      properties: {
        categoriesRolledOver: { type: 'number' },
        totalCarryover: { type: 'number' },
      },
    },
  })
  async rolloverMonth(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: User,
    @Body() dto: RolloverMonthRequestDto
  ) {
    return this.zeroBasedService.rolloverMonth(user.id, spaceId, dto.fromMonth, dto.toMonth);
  }

  @Get('spaces/:spaceId/category-goals')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get category funding goals' })
  @ApiResponse({ status: 200, description: 'List of category goals' })
  async getCategoryGoals(@Param('spaceId') spaceId: string, @CurrentUser() user: User) {
    return this.zeroBasedService.getCategoryGoals(user.id, spaceId);
  }

  @Put('spaces/:spaceId/categories/:categoryId/goal')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Set a funding goal for a category',
    description: 'Configure how much should be allocated to a category each month',
  })
  @ApiBody({ type: SetCategoryGoalRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Goal set successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
    },
  })
  async setCategoryGoal(
    @Param('spaceId') spaceId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: User,
    @Body() dto: SetCategoryGoalRequestDto
  ) {
    return this.zeroBasedService.setCategoryGoal(user.id, spaceId, categoryId, {
      ...dto,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
    });
  }
}