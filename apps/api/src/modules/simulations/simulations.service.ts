// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  monteCarloEngine,
  scenarioAnalysisEngine,
  type SimulationConfig,
  type RetirementSimulationConfig,
  ScenarioType,
} from '@dhanam-core/simulations';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';


import { PrismaService } from '../../core/prisma/prisma.service';

import {
  RunSimulationDto,
  RunRetirementSimulationDto,
  CalculateSafeWithdrawalRateDto,
  AnalyzeScenarioDto,
  ScenarioTypeDto,
} from './dto';

@Injectable()
export class SimulationsService {
  private readonly logger = new Logger(SimulationsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Run a Monte Carlo simulation
   */
  async runSimulation(userId: string, dto: RunSimulationDto) {
    this.logger.log(`Running ${dto.type} simulation for user ${userId}`);

    // Create simulation record
    const simulation = await this.prisma.simulation.create({
      data: {
        userId,
        spaceId: dto.spaceId,
        goalId: dto.goalId,
        type: dto.type,
        config: dto as any,
        status: 'running',
      },
    });

    try {
      // Clamp iterations to a safe upper bound
      const maxIterations = 100_000;

      const config: SimulationConfig = {
        initialBalance: dto.initialBalance,
        monthlyContribution: dto.monthlyContribution,
        years: dto.years,
        iterations: Math.min(dto.iterations || 10000, maxIterations),
        expectedReturn: dto.expectedReturn,
        returnVolatility: dto.returnVolatility,
        inflationRate: dto.inflationRate,
        inflationAdjustedContributions: dto.inflationAdjustedContributions,
      };

      const result = monteCarloEngine.simulate(config);

      // Update simulation with result
      await this.prisma.simulation.update({
        where: { id: simulation.id },
        data: {
          result: result as any,
          status: 'completed',
          executionTimeMs: result.executionTimeMs,
        },
      });

      // Track usage

      this.logger.log(`Simulation ${simulation.id} completed in ${result.executionTimeMs}ms`);

      return {
        simulationId: simulation.id,
        ...result,
      };
    } catch (error) {
      // Update simulation with error
      await this.prisma.simulation.update({
        where: { id: simulation.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      this.logger.error(`Simulation ${simulation.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Run a retirement-specific simulation
   */
  async runRetirementSimulation(userId: string, dto: RunRetirementSimulationDto) {
    this.logger.log(`Running retirement simulation for user ${userId}`);

    // Create simulation record
    const simulation = await this.prisma.simulation.create({
      data: {
        userId,
        spaceId: dto.spaceId,
        goalId: dto.goalId,
        type: 'retirement',
        config: dto as any,
        status: 'running',
      },
    });

    try {
      // Clamp iterations to a safe upper bound
      const retMaxIterations = 100_000;

      const config: RetirementSimulationConfig = {
        currentAge: dto.currentAge,
        retirementAge: dto.retirementAge,
        lifeExpectancy: dto.lifeExpectancy,
        currentSavings: dto.currentSavings,
        monthlyContribution: dto.monthlyContribution,
        monthlyWithdrawal: dto.monthlyWithdrawal,
        preRetirementReturn: dto.preRetirementReturn,
        postRetirementReturn: dto.postRetirementReturn,
        returnVolatility: dto.returnVolatility,
        iterations: Math.min(dto.iterations || 10000, retMaxIterations),
        inflationRate: dto.inflationRate,
      };

      const startTime = Date.now();
      const result = monteCarloEngine.simulateRetirement(config);
      const executionTimeMs = Date.now() - startTime;

      // Update simulation with result
      await this.prisma.simulation.update({
        where: { id: simulation.id },
        data: {
          result: result as any,
          status: 'completed',
          executionTimeMs,
        },
      });

      // Track usage

      this.logger.log(`Retirement simulation ${simulation.id} completed in ${executionTimeMs}ms`);

      return {
        simulationId: simulation.id,
        ...result,
      };
    } catch (error) {
      // Update simulation with error
      await this.prisma.simulation.update({
        where: { id: simulation.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      this.logger.error(`Retirement simulation ${simulation.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Calculate safe withdrawal rate
   */
  async calculateSafeWithdrawalRate(userId: string, dto: CalculateSafeWithdrawalRateDto) {
    this.logger.log(`Calculating safe withdrawal rate for user ${userId}`);

    const simulation = await this.prisma.simulation.create({
      data: {
        userId,
        spaceId: dto.spaceId,
        type: 'safe_withdrawal',
        config: dto as any,
        status: 'running',
      },
    });

    try {
      const startTime = Date.now();

      const safeRate = monteCarloEngine.calculateSafeWithdrawalRate({
        portfolioValue: dto.portfolioValue,
        yearsInRetirement: dto.yearsInRetirement,
        successProbability: dto.successProbability,
        expectedReturn: dto.expectedReturn,
        returnVolatility: dto.returnVolatility,
        inflationRate: dto.inflationRate,
      });

      const executionTimeMs = Date.now() - startTime;
      const annualWithdrawal = dto.portfolioValue * safeRate;
      const monthlyWithdrawal = annualWithdrawal / 12;

      const result = {
        safeWithdrawalRate: safeRate,
        annualWithdrawalAmount: annualWithdrawal,
        monthlyWithdrawalAmount: monthlyWithdrawal,
        successProbability: dto.successProbability,
        portfolioValue: dto.portfolioValue,
      };

      // Update simulation with result
      await this.prisma.simulation.update({
        where: { id: simulation.id },
        data: {
          result: result as any,
          status: 'completed',
          executionTimeMs,
        },
      });

      // Track usage

      this.logger.log(
        `Safe withdrawal calculation ${simulation.id} completed in ${executionTimeMs}ms`
      );

      return {
        simulationId: simulation.id,
        ...result,
      };
    } catch (error) {
      await this.prisma.simulation.update({
        where: { id: simulation.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      this.logger.error(`Safe withdrawal calculation ${simulation.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Analyze scenario stress test
   */
  async analyzeScenario(userId: string, dto: AnalyzeScenarioDto) {
    this.logger.log(`Running scenario analysis (${dto.scenarioType}) for user ${userId}`);

    const simulation = await this.prisma.simulation.create({
      data: {
        userId,
        type: 'scenario_analysis',
        config: dto as any,
        status: 'running',
      },
    });

    try {
      const startTime = Date.now();

      // Map DTO enum to package enum
      const scenarioTypeMap: Record<ScenarioTypeDto, ScenarioType> = {
        [ScenarioTypeDto.JOB_LOSS]: ScenarioType.JOB_LOSS,
        [ScenarioTypeDto.MARKET_CRASH]: ScenarioType.MARKET_CRASH,
        [ScenarioTypeDto.RECESSION]: ScenarioType.RECESSION,
        [ScenarioTypeDto.MEDICAL_EMERGENCY]: ScenarioType.MEDICAL_EMERGENCY,
        [ScenarioTypeDto.INFLATION_SPIKE]: ScenarioType.INFLATION_SPIKE,
        [ScenarioTypeDto.DISABILITY]: ScenarioType.DISABILITY,
        [ScenarioTypeDto.MARKET_CORRECTION]: ScenarioType.MARKET_CORRECTION,
      };

      // Clamp iterations to a safe upper bound
      const scenarioMaxIterations = 100_000;

      const baselineConfig: SimulationConfig = {
        initialBalance: dto.initialBalance,
        monthlyContribution: dto.monthlyContribution,
        years: dto.years,
        iterations: Math.min(dto.iterations || 10000, scenarioMaxIterations),
        expectedReturn: dto.expectedReturn,
        returnVolatility: dto.returnVolatility,
        inflationRate: dto.inflationRate,
      };

      const scenarioType = scenarioTypeMap[dto.scenarioType];
      const result = scenarioAnalysisEngine.analyzeScenario(baselineConfig, scenarioType);

      const executionTimeMs = Date.now() - startTime;

      // Update simulation with result
      await this.prisma.simulation.update({
        where: { id: simulation.id },
        data: {
          result: result as any,
          status: 'completed',
          executionTimeMs,
        },
      });

      // Track usage (scenario analysis counts as 2 simulations - baseline + stressed)

      this.logger.log(`Scenario analysis ${simulation.id} completed in ${executionTimeMs}ms`);

      return {
        simulationId: simulation.id,
        ...result,
      };
    } catch (error) {
      await this.prisma.simulation.update({
        where: { id: simulation.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      this.logger.error(`Scenario analysis ${simulation.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Get simulation by ID
   */
  async getSimulation(userId: string, simulationId: string) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        space: {
          select: {
            id: true,
            name: true,
          },
        },
        goal: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    if (simulation.userId !== userId) {
      throw new NotFoundException('Simulation not found');
    }

    return simulation;
  }

  /**
   * List user's simulations
   */
  async listSimulations(
    userId: string,
    options?: {
      spaceId?: string;
      goalId?: string;
      type?: string;
      limit?: number;
    }
  ) {
    const where: any = { userId };

    if (options?.spaceId) {
      where.spaceId = options.spaceId;
    }

    if (options?.goalId) {
      where.goalId = options.goalId;
    }

    if (options?.type) {
      where.type = options.type;
    }

    const simulations = await this.prisma.simulation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      include: {
        space: {
          select: {
            id: true,
            name: true,
          },
        },
        goal: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return simulations;
  }

  /**
   * Delete simulation
   */
  async deleteSimulation(userId: string, simulationId: string) {
    const simulation = await this.getSimulation(userId, simulationId);

    await this.prisma.simulation.delete({
      where: { id: simulation.id },
    });

    return { deleted: true };
  }
}