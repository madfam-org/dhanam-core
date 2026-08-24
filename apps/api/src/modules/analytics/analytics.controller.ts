// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  NetWorthResponse,
  CashflowForecast,
  SpendingByCategory,
  IncomeVsExpenses,
  AccountBalanceAnalytics,
  PortfolioAllocation,
} from '@dhanam-core/shared';
import { Controller, Get, Post, Query, Body, UseGuards, Request, Param } from '@nestjs/common';
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
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { CASHFLOW_FORECAST_MAX_DAYS } from '@core/feature-gates';
import { AuthenticatedRequest } from '@core/types/authenticated-request';
import { Currency } from '@db';

import {
  NetWorthHistoryPoint,
  NetWorthByOwnership,
  OwnershipFilter,
  AnalyticsService,
} from './analytics.service';
import { AnomalyService } from './anomaly.service';
import {
  LongTermForecastService,
  CreateProjectionDto,
  WhatIfComparisonDto,
} from './long-term-forecast.service';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly anomalyService: AnomalyService,
    private readonly longTermForecastService: LongTermForecastService
  ) {}

  @Get('consolidated-net-worth')
  @ApiOperation({ summary: 'Get consolidated net worth across all user spaces' })
  @ApiQuery({
    name: 'currency',
    required: false,
    description: 'Base currency for consolidation (e.g., MXN, USD)',
  })
  @ApiOkResponse({ description: 'Consolidated net worth retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getConsolidatedNetWorth(
    @Request() req: AuthenticatedRequest,
    @Query('currency') currency?: string
  ) {
    const baseCurrency = currency ? (currency.toUpperCase() as Currency) : undefined;
    return this.analyticsService.getConsolidatedNetWorth(req.user!.userId, baseCurrency);
  }

  @Get(':spaceId/net-worth')
  @ApiOperation({ summary: 'Get net worth for a space (with multi-currency conversion)' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to retrieve net worth for' })
  @ApiQuery({
    name: 'currency',
    required: false,
    description: 'Target currency for conversion (e.g., USD, MXN, EUR)',
  })
  @ApiOkResponse({ description: 'Net worth data retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getNetWorth(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('currency') currency?: string
  ): Promise<NetWorthResponse> {
    const targetCurrency = currency ? (currency.toUpperCase() as Currency) : undefined;
    return this.analyticsService.getNetWorth(req.user!.userId, spaceId, targetCurrency);
  }

  @Get(':spaceId/net-worth-history')
  @ApiOperation({ summary: 'Get net worth history for charting' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to retrieve net worth history for' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days of history (default: 30)',
  })
  @ApiOkResponse({ description: 'Net worth history retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getNetWorthHistory(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('days') days?: string
  ): Promise<NetWorthHistoryPoint[]> {
    return this.analyticsService.getNetWorthHistory(
      req.user!.userId,
      spaceId,
      days ? parseInt(days, 10) : 30
    );
  }

  @Get(':spaceId/net-worth-by-ownership')
  @ApiOperation({ summary: 'Get net worth breakdown by ownership (yours, mine, ours)' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to retrieve ownership breakdown for' })
  @ApiQuery({ name: 'currency', required: false, description: 'Target currency for conversion' })
  @ApiOkResponse({ description: 'Net worth by ownership retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getNetWorthByOwnership(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('currency') currency?: string
  ): Promise<NetWorthByOwnership> {
    const targetCurrency = currency ? (currency.toUpperCase() as Currency) : undefined;
    return this.analyticsService.getNetWorthByOwnership(req.user!.userId, spaceId, targetCurrency);
  }

  @Get(':spaceId/accounts-by-ownership')
  @ApiOperation({ summary: 'Get accounts filtered by ownership type' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to retrieve accounts for' })
  @ApiQuery({
    name: 'ownership',
    required: false,
    description: 'Ownership filter (yours, mine, ours, all)',
  })
  @ApiOkResponse({ description: 'Accounts by ownership retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getAccountsByOwnership(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('ownership') ownership?: string
  ) {
    const filter = (ownership as OwnershipFilter) || 'all';
    return this.analyticsService.getAccountsByOwnership(req.user!.userId, spaceId, filter);
  }

  @Get(':spaceId/cashflow-forecast')
  @ApiOperation({ summary: 'Get cashflow forecast' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to generate cashflow forecast for' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to forecast (default: 60, clamped to a 365-day maximum).',
  })
  @ApiOkResponse({ description: 'Cashflow forecast retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getCashflowForecast(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('days') days?: string
  ): Promise<CashflowForecast> {
    return this.analyticsService.getCashflowForecast(
      req.user!.userId,
      spaceId,
      this.clampForecastDays(days ? parseInt(days, 10) : 60)
    );
  }

  /**
   * Clamp the requested forecast horizon to the configured maximum
   * (CASHFLOW_FORECAST_MAX_DAYS).
   */
  private clampForecastDays(requestedDays: number): number {
    if (!Number.isFinite(requestedDays) || requestedDays < 1) {
      return Math.min(60, CASHFLOW_FORECAST_MAX_DAYS);
    }
    return Math.min(requestedDays, CASHFLOW_FORECAST_MAX_DAYS);
  }

  @Get(':spaceId/spending-by-category')
  @ApiOperation({ summary: 'Get spending breakdown by category' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to retrieve spending breakdown for' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date for the analysis period (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date for the analysis period (ISO 8601)',
  })
  @ApiQuery({
    name: 'budgetId',
    required: false,
    description: "Filter by budget (only transactions in this budget's categories)",
  })
  @ApiOkResponse({ description: 'Spending by category retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  @ApiBadRequestResponse({ description: 'Invalid date format' })
  async getSpendingByCategory(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('budgetId') budgetId?: string
  ): Promise<SpendingByCategory[]> {
    return this.analyticsService.getSpendingByCategory(
      req.user!.userId,
      spaceId,
      new Date(startDate),
      new Date(endDate),
      budgetId
    );
  }

  @Get(':spaceId/income-vs-expenses')
  @ApiOperation({ summary: 'Get income vs expenses trend' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to retrieve income vs expenses for' })
  @ApiQuery({
    name: 'months',
    required: false,
    description: 'Number of months to analyze (default: 6)',
  })
  @ApiQuery({
    name: 'budgetId',
    required: false,
    description: "Filter by budget (only transactions in this budget's categories)",
  })
  @ApiOkResponse({ description: 'Income vs expenses trend retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getIncomeVsExpenses(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('months') months?: string,
    @Query('budgetId') budgetId?: string
  ): Promise<IncomeVsExpenses[]> {
    return this.analyticsService.getIncomeVsExpenses(
      req.user!.userId,
      spaceId,
      months ? parseInt(months, 10) : 6,
      budgetId
    );
  }

  @Get(':spaceId/account-balances')
  @ApiOperation({ summary: 'Get all account balances' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to retrieve account balances for' })
  @ApiOkResponse({ description: 'Account balances retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getAccountBalances(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string
  ): Promise<AccountBalanceAnalytics[]> {
    return this.analyticsService.getAccountBalances(req.user!.userId, spaceId);
  }

  @Get(':spaceId/portfolio-allocation')
  @ApiOperation({ summary: 'Get portfolio allocation breakdown' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to retrieve portfolio allocation for' })
  @ApiOkResponse({ description: 'Portfolio allocation retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getPortfolioAllocation(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string
  ): Promise<PortfolioAllocation[]> {
    return this.analyticsService.getPortfolioAllocation(req.user!.userId, spaceId);
  }

  @Get(':spaceId/dashboard-data')
  @ApiOperation({ summary: 'Get combined dashboard data in a single request' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to retrieve dashboard data for' })
  @ApiOkResponse({ description: 'Dashboard data retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getDashboardData(@Request() req: AuthenticatedRequest, @Param('spaceId') spaceId: string) {
    return this.analyticsService.getDashboardData(req.user!.userId, spaceId);
  }

  @Get(':spaceId/statistics')
  @ApiOperation({ summary: 'Get statistics: top purchases, merchants, categories' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'budgetId', required: false, description: 'Filter by budget' })
  @ApiOkResponse({ description: 'Statistics retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getStatistics(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('budgetId') budgetId?: string
  ) {
    return this.analyticsService.getStatistics(
      req.user!.userId,
      spaceId,
      new Date(startDate),
      new Date(endDate),
      budgetId
    );
  }

  @Get(':spaceId/trends')
  @ApiOperation({ summary: 'Get annual trends with savings rate' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({ name: 'months', required: false, description: 'Number of months (default: 12)' })
  @ApiQuery({ name: 'budgetId', required: false, description: 'Filter by budget' })
  @ApiOkResponse({ description: 'Trends retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getAnnualTrends(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('months') months?: string,
    @Query('budgetId') budgetId?: string
  ) {
    return this.analyticsService.getAnnualTrends(
      req.user!.userId,
      spaceId,
      months ? parseInt(months, 10) : 12,
      budgetId
    );
  }

  @Get(':spaceId/calendar')
  @ApiOperation({ summary: 'Get transactions grouped by day for calendar view' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({ name: 'year', required: true, description: 'Year (e.g. 2026)' })
  @ApiQuery({ name: 'month', required: true, description: 'Month (1-12)' })
  @ApiQuery({ name: 'budgetId', required: false, description: 'Filter by budget' })
  @ApiOkResponse({ description: 'Calendar data retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getCalendarData(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('budgetId') budgetId?: string
  ) {
    return this.analyticsService.getCalendarData(
      req.user!.userId,
      spaceId,
      parseInt(year, 10),
      parseInt(month, 10),
      budgetId
    );
  }

  @Post(':spaceId/query')
  @ApiOperation({ summary: 'Execute flexible ad-hoc query for analysis' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Query results retrieved successfully' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async executeQuery(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Body()
    body: {
      startDate: string;
      endDate: string;
      groupBy: 'month' | 'category' | 'merchant' | 'account' | 'tag';
      categoryIds?: string[];
      tagIds?: string[];
      merchantNames?: string[];
      accountIds?: string[];
      amountMin?: number;
      amountMax?: number;
      aggregation?: 'sum' | 'count' | 'average';
      budgetId?: string;
    }
  ) {
    return this.analyticsService.executeQuery(req.user!.userId, spaceId, {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  @Get(':spaceId/anomalies')
  @ApiOperation({ summary: 'Detect spending anomalies' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to detect anomalies for' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze (default: 30)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of anomalies to return (default: 50)',
  })
  @ApiOkResponse({ description: 'Anomalies detected successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getAnomalies(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('days') days?: string,
    @Query('limit') limit?: string
  ) {
    return this.anomalyService.detectAnomalies(req.user!.userId, spaceId, {
      days: days ? parseInt(days, 10) : 30,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':spaceId/anomalies/summary')
  @ApiOperation({ summary: 'Get anomaly detection summary' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to get anomaly summary for' })
  @ApiOkResponse({ description: 'Anomaly summary retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  async getAnomalySummary(@Request() req: AuthenticatedRequest, @Param('spaceId') spaceId: string) {
    return this.anomalyService.getAnomalySummary(spaceId, req.user!.userId);
  }

  // Long-Term Projection Endpoints

  @Post(':spaceId/projections')
  @ApiOperation({ summary: 'Generate a long-term financial projection (10-30 years)' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to generate projection for' })
  @ApiOkResponse({ description: 'Projection generated successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async generateProjection(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateProjectionDto
  ) {
    return this.longTermForecastService.generateProjection(req.user!.userId, spaceId, dto);
  }

  @Post(':spaceId/projections/compare')
  @ApiOperation({ summary: 'Compare what-if scenarios against baseline projection' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to compare scenarios for' })
  @ApiOkResponse({ description: 'Scenario comparison completed successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  async compareScenarios(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Body() dto: WhatIfComparisonDto
  ) {
    return this.longTermForecastService.compareScenarios(req.user!.userId, spaceId, dto);
  }

  @Get(':spaceId/projections/quick')
  @ApiOperation({ summary: 'Get quick projection summary for dashboard' })
  @ApiParam({ name: 'spaceId', description: 'The space ID to get quick projection for' })
  @ApiQuery({ name: 'currentAge', required: true, description: 'Current age of the user' })
  @ApiQuery({ name: 'retirementAge', required: true, description: 'Target retirement age' })
  @ApiOkResponse({ description: 'Quick projection retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  async getQuickProjection(
    @Request() req: AuthenticatedRequest,
    @Param('spaceId') spaceId: string,
    @Query('currentAge') currentAge: string,
    @Query('retirementAge') retirementAge: string
  ) {
    return this.longTermForecastService.getQuickProjection(
      req.user!.userId,
      spaceId,
      parseInt(currentAge, 10),
      parseInt(retirementAge, 10)
    );
  }

  @Get(':spaceId/projections/scenario-templates')
  @ApiOperation({ summary: 'Get predefined what-if scenario templates' })
  @ApiParam({ name: 'spaceId', description: 'The space ID (used for context)' })
  @ApiOkResponse({ description: 'Scenario templates retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  getScenarioTemplates() {
    return this.longTermForecastService.getScenarioTemplates();
  }
}
