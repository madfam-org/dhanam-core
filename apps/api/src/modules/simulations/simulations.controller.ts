// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
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
  ApiQuery,
  ApiNoContentResponse,
} from '@nestjs/swagger';

import {
  UsageMetricType,
  TrackUsage,
  SubscriptionGuard,
  UsageLimitGuard,
} from '@core/feature-gates';

import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { MonitorPerformance } from '../../core/decorators/monitor-performance.decorator';

import {
  RunSimulationDto,
  RunRetirementSimulationDto,
  CalculateSafeWithdrawalRateDto,
  AnalyzeScenarioDto,
} from './dto';
import { SimulationsService } from './simulations.service';

@ApiTags('Simulations')
@ApiBearerAuth()
@Controller('simulations')
@UseGuards(JwtAuthGuard)
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Post('monte-carlo')
  @UseGuards(SubscriptionGuard, UsageLimitGuard)
  @TrackUsage(UsageMetricType.monte_carlo_simulation)
  @MonitorPerformance(15000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run Monte Carlo simulation' })
  @ApiOkResponse({ description: 'Simulation completed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid simulation parameters' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async runSimulation(@CurrentUser() user: { id: string }, @Body() dto: RunSimulationDto) {
    return this.simulationsService.runSimulation(user.id, dto);
  }

  @Post('retirement')
  @UseGuards(SubscriptionGuard, UsageLimitGuard)
  @TrackUsage(UsageMetricType.monte_carlo_simulation)
  @MonitorPerformance(20000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run retirement planning simulation' })
  @ApiOkResponse({ description: 'Retirement simulation completed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid retirement parameters' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async runRetirementSimulation(
    @CurrentUser() user: { id: string },
    @Body() dto: RunRetirementSimulationDto
  ) {
    return this.simulationsService.runRetirementSimulation(user.id, dto);
  }

  @Post('safe-withdrawal-rate')
  @UseGuards(SubscriptionGuard, UsageLimitGuard)
  @TrackUsage(UsageMetricType.monte_carlo_simulation)
  @MonitorPerformance(15000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate safe withdrawal rate' })
  @ApiOkResponse({ description: 'Safe withdrawal rate calculated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid withdrawal rate parameters' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async calculateSafeWithdrawalRate(
    @CurrentUser() user: { id: string },
    @Body() dto: CalculateSafeWithdrawalRateDto
  ) {
    return this.simulationsService.calculateSafeWithdrawalRate(user.id, dto);
  }

  @Post('scenario-analysis')
  @UseGuards(SubscriptionGuard, UsageLimitGuard)
  @MonitorPerformance(30000) // Longer timeout for stress testing
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run scenario analysis with stress testing' })
  @ApiOkResponse({ description: 'Scenario analysis completed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid scenario parameters' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async analyzeScenario(@CurrentUser() user: { id: string }, @Body() dto: AnalyzeScenarioDto) {
    return this.simulationsService.analyzeScenario(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List saved simulations' })
  @ApiQuery({ name: 'spaceId', required: false, description: 'Filter by space UUID' })
  @ApiQuery({ name: 'goalId', required: false, description: 'Filter by goal UUID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by simulation type' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results' })
  @ApiOkResponse({ description: 'List of simulations' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async listSimulations(
    @CurrentUser() user: { id: string },
    @Query('spaceId') spaceId?: string,
    @Query('goalId') goalId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string
  ) {
    return this.simulationsService.listSimulations(user.id, {
      spaceId,
      goalId,
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get simulation details' })
  @ApiParam({ name: 'id', description: 'Simulation UUID' })
  @ApiOkResponse({ description: 'Simulation details' })
  @ApiNotFoundResponse({ description: 'Simulation not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getSimulation(@CurrentUser() user: { id: string }, @Param('id') simulationId: string) {
    return this.simulationsService.getSimulation(user.id, simulationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a simulation' })
  @ApiParam({ name: 'id', description: 'Simulation UUID' })
  @ApiNoContentResponse({ description: 'Simulation deleted successfully' })
  @ApiNotFoundResponse({ description: 'Simulation not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async deleteSimulation(@CurrentUser() user: { id: string }, @Param('id') simulationId: string) {
    return this.simulationsService.deleteSimulation(user.id, simulationId);
  }
}
