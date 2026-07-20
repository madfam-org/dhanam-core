// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

// DTOs for PE Analytics
export interface PECashFlowDto {
  id: string;
  assetId: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreatePECashFlowDto {
  type: 'capital_call' | 'distribution' | 'management_fee' | 'carry' | 'recallable';
  amount: number;
  currency: string;
  date: string;
  description?: string;
  notes?: string;
  metadata?: object;
}

export interface PEPerformanceDto {
  assetId: string;
  assetName: string;
  currentValue: number;
  currency: string;

  // Capital metrics
  totalContributed: number; // Total capital calls
  totalDistributed: number; // Total distributions
  totalFees: number; // Management fees + carry
  netContributed: number; // Contributions - fees

  // Multiple metrics (all ratios)
  tvpiMultiple: number; // Total Value to Paid-In (Distributions + NAV) / Contributions
  dpiMultiple: number; // Distributions to Paid-In (Distributions / Contributions)
  rvpiMultiple: number; // Residual Value to Paid-In (NAV / Contributions)

  // IRR (annualized return %)
  irr: number | null; // Internal Rate of Return (null if cannot be calculated)

  // Cash flow summary
  cashFlowCount: number;
  firstCashFlowDate: string | null;
  lastCashFlowDate: string | null;

  // Unrealized gain/loss
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
}

export interface PEPortfolioSummaryDto {
  totalAssets: number;
  totalCurrentValue: number;
  totalContributed: number;
  totalDistributed: number;
  portfolioTVPI: number;
  portfolioDPI: number;
  portfolioIRR: number | null;
  currency: string;
  assets: PEPerformanceDto[];
}

@Injectable()
export class PEAnalyticsService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService
  ) {}

  /**
   * Add a cash flow to a private equity asset
   */
  async addCashFlow(
    spaceId: string,
    userId: string,
    assetId: string,
    dto: CreatePECashFlowDto
  ): Promise<PECashFlowDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.type !== 'private_equity' && asset.type !== 'angel_investment') {
      throw new BadRequestException(
        'Cash flows can only be added to private equity or angel investment assets'
      );
    }

    const cashFlow = await this.prisma.privateEquityCashFlow.create({
      data: {
        assetId,
        type: dto.type as any,
        amount: dto.amount,
        currency: dto.currency as any,
        date: new Date(dto.date),
        description: dto.description,
        notes: dto.notes,
        metadata: dto.metadata as any,
      },
    });

    return this.transformCashFlowToDto(cashFlow);
  }

  /**
   * Get all cash flows for an asset
   */
  async getCashFlows(spaceId: string, userId: string, assetId: string): Promise<PECashFlowDto[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const cashFlows = await this.prisma.privateEquityCashFlow.findMany({
      where: { assetId },
      orderBy: { date: 'asc' },
    });

    return cashFlows.map((cf) => this.transformCashFlowToDto(cf));
  }

  /**
   * Delete a cash flow
   */
  async deleteCashFlow(
    spaceId: string,
    userId: string,
    assetId: string,
    cashFlowId: string
  ): Promise<void> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const cashFlow = await this.prisma.privateEquityCashFlow.findFirst({
      where: { id: cashFlowId, assetId },
      include: { asset: true },
    });

    if (!cashFlow || cashFlow.asset.spaceId !== spaceId) {
      throw new NotFoundException('Cash flow not found');
    }

    await this.prisma.privateEquityCashFlow.delete({
      where: { id: cashFlowId },
    });
  }

  /**
   * Get performance metrics for a single PE asset
   */
  async getPerformance(
    spaceId: string,
    userId: string,
    assetId: string
  ): Promise<PEPerformanceDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const asset = await this.prisma.manualAsset.findFirst({
      where: { id: assetId, spaceId },
      include: {
        cashFlows: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return this.calculatePerformance(asset);
  }

  /**
   * Get portfolio summary for all PE assets in a space
   */
  async getPortfolioSummary(spaceId: string, userId: string): Promise<PEPortfolioSummaryDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    const assets = await this.prisma.manualAsset.findMany({
      where: {
        spaceId,
        type: { in: ['private_equity', 'angel_investment'] },
      },
      include: {
        cashFlows: {
          orderBy: { date: 'asc' },
        },
      },
    });

    const performances = assets.map((asset) => this.calculatePerformance(asset));

    // Aggregate portfolio metrics
    const totalCurrentValue = performances.reduce((sum, p) => sum + p.currentValue, 0);
    const totalContributed = performances.reduce((sum, p) => sum + p.totalContributed, 0);
    const totalDistributed = performances.reduce((sum, p) => sum + p.totalDistributed, 0);

    // Calculate portfolio-level multiples
    const portfolioTVPI =
      totalContributed > 0 ? (totalDistributed + totalCurrentValue) / totalContributed : 0;
    const portfolioDPI = totalContributed > 0 ? totalDistributed / totalContributed : 0;

    // Calculate portfolio-level IRR (aggregate all cash flows)
    const allCashFlows: { date: Date; amount: number }[] = [];
    for (const asset of assets) {
      for (const cf of asset.cashFlows) {
        const amount = cf.amount.toNumber();
        // Capital calls are negative (money going out)
        // Distributions and carry are positive (money coming in)
        const sign = cf.type === 'capital_call' || cf.type === 'management_fee' ? -1 : 1;
        allCashFlows.push({
          date: cf.date,
          amount: amount * sign,
        });
      }
      // Add current value as final positive cash flow
      if (asset.currentValue.toNumber() > 0) {
        allCashFlows.push({
          date: new Date(),
          amount: asset.currentValue.toNumber(),
        });
      }
    }

    const portfolioIRR = this.calculateIRR(allCashFlows);

    return {
      totalAssets: assets.length,
      totalCurrentValue,
      totalContributed,
      totalDistributed,
      portfolioTVPI: Math.round(portfolioTVPI * 100) / 100,
      portfolioDPI: Math.round(portfolioDPI * 100) / 100,
      portfolioIRR,
      currency: space?.currency || 'USD',
      assets: performances,
    };
  }

  /**
   * Calculate performance metrics for an asset with cash flows
   */
  private calculatePerformance(asset: any): PEPerformanceDto {
    const cashFlows = asset.cashFlows || [];
    const currentValue = asset.currentValue.toNumber();

    // Sum up different cash flow types
    let totalContributed = 0;
    let totalDistributed = 0;
    let totalFees = 0;

    for (const cf of cashFlows) {
      const amount = cf.amount.toNumber();
      switch (cf.type) {
        case 'capital_call':
          totalContributed += amount;
          break;
        case 'distribution':
          totalDistributed += amount;
          break;
        case 'management_fee':
        case 'carry':
          totalFees += amount;
          break;
        case 'recallable':
          // Recallable distributions reduce the distributed amount
          totalDistributed -= amount;
          break;
      }
    }

    const netContributed = totalContributed + totalFees;

    // Calculate multiples
    const tvpiMultiple =
      totalContributed > 0 ? (totalDistributed + currentValue) / totalContributed : 0;
    const dpiMultiple = totalContributed > 0 ? totalDistributed / totalContributed : 0;
    const rvpiMultiple = totalContributed > 0 ? currentValue / totalContributed : 0;

    // Calculate IRR
    const irrCashFlows: { date: Date; amount: number }[] = cashFlows.map((cf: any) => {
      const amount = cf.amount.toNumber();
      const sign = cf.type === 'capital_call' || cf.type === 'management_fee' ? -1 : 1;
      return { date: cf.date, amount: amount * sign };
    });

    // Add current value as terminal cash flow
    if (currentValue > 0) {
      irrCashFlows.push({ date: new Date(), amount: currentValue });
    }

    const irr = this.calculateIRR(irrCashFlows);

    // Unrealized gain/loss
    const unrealizedGainLoss = currentValue - (totalContributed - totalDistributed);
    const unrealizedGainLossPercent =
      totalContributed > 0 ? (unrealizedGainLoss / totalContributed) * 100 : 0;

    // Date range
    const dates = cashFlows.map((cf: any) => cf.date);
    const firstCashFlowDate =
      dates.length > 0 ? new Date(Math.min(...dates.map((d: Date) => d.getTime()))) : null;
    const lastCashFlowDate =
      dates.length > 0 ? new Date(Math.max(...dates.map((d: Date) => d.getTime()))) : null;

    return {
      assetId: asset.id,
      assetName: asset.name,
      currentValue,
      currency: asset.currency,
      totalContributed,
      totalDistributed,
      totalFees,
      netContributed,
      tvpiMultiple: Math.round(tvpiMultiple * 100) / 100,
      dpiMultiple: Math.round(dpiMultiple * 100) / 100,
      rvpiMultiple: Math.round(rvpiMultiple * 100) / 100,
      irr,
      cashFlowCount: cashFlows.length,
      firstCashFlowDate: firstCashFlowDate?.toISOString() || null,
      lastCashFlowDate: lastCashFlowDate?.toISOString() || null,
      unrealizedGainLoss: Math.round(unrealizedGainLoss * 100) / 100,
      unrealizedGainLossPercent: Math.round(unrealizedGainLossPercent * 100) / 100,
    };
  }

  /**
   * Calculate IRR using Newton-Raphson method
   * Returns annualized IRR as a percentage (e.g., 15.5 for 15.5%)
   */
  private calculateIRR(cashFlows: { date: Date; amount: number }[]): number | null {
    if (cashFlows.length < 2) {
      return null;
    }

    // Check if there are both positive and negative cash flows
    const hasPositive = cashFlows.some((cf) => cf.amount > 0);
    const hasNegative = cashFlows.some((cf) => cf.amount < 0);
    if (!hasPositive || !hasNegative) {
      return null;
    }

    // Sort by date
    const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
    const firstDate = sorted[0].date;

    // Convert to years from first cash flow
    const yearsAndAmounts = sorted.map((cf) => ({
      years: (cf.date.getTime() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      amount: cf.amount,
    }));

    // Newton-Raphson iteration
    let rate = 0.1; // Initial guess: 10%
    const maxIterations = 100;
    const tolerance = 0.00001;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let derivative = 0;

      for (const { years, amount } of yearsAndAmounts) {
        const discountFactor = Math.pow(1 + rate, -years);
        npv += amount * discountFactor;
        derivative -= (years * amount * discountFactor) / (1 + rate);
      }

      if (Math.abs(derivative) < 1e-10) {
        // Derivative too small, can't continue
        break;
      }

      const newRate = rate - npv / derivative;

      // Check for convergence
      if (Math.abs(newRate - rate) < tolerance) {
        // Return as percentage, rounded to 2 decimal places
        return Math.round(newRate * 10000) / 100;
      }

      rate = newRate;

      // Guard against divergence
      if (rate < -0.99 || rate > 10) {
        // Rate out of reasonable bounds
        break;
      }
    }

    // Fallback to simple calculation if Newton-Raphson doesn't converge
    // Calculate simple return
    const totalInvested = yearsAndAmounts
      .filter((cf) => cf.amount < 0)
      .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);
    const totalReturned = yearsAndAmounts
      .filter((cf) => cf.amount > 0)
      .reduce((sum, cf) => sum + cf.amount, 0);

    if (totalInvested === 0) {
      return null;
    }

    const lastCashFlow = yearsAndAmounts[yearsAndAmounts.length - 1];
    const years = lastCashFlow.years || 1;
    const totalReturn = totalReturned / totalInvested - 1;
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1;

    return Math.round(annualizedReturn * 10000) / 100;
  }

  private transformCashFlowToDto(cashFlow: any): PECashFlowDto {
    return {
      id: cashFlow.id,
      assetId: cashFlow.assetId,
      type: cashFlow.type,
      amount: cashFlow.amount.toNumber(),
      currency: cashFlow.currency,
      date: cashFlow.date.toISOString(),
      description: cashFlow.description,
      notes: cashFlow.notes,
      createdAt: cashFlow.createdAt.toISOString(),
    };
  }
}