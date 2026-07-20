// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';

import { RecurringStatus } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

import { CreateRecurringDto, UpdateRecurringDto, ConfirmRecurringDto } from './dto';
import { RecurringDetectorService } from './recurring-detector.service';

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
    private detectorService: RecurringDetectorService
  ) {}

  /**
   * Get all recurring transactions for a space
   */
  async findAll(
    spaceId: string,
    userId: string,
    options?: { status?: RecurringStatus; includeDetected?: boolean }
  ) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const where: any = { spaceId };

    if (options?.status) {
      where.status = options.status;
    } else if (!options?.includeDetected) {
      // By default, only show confirmed patterns
      where.status = { in: ['confirmed', 'paused'] };
    }

    const recurring = await this.prisma.recurringTransaction.findMany({
      where,
      orderBy: { nextExpected: 'asc' },
      include: {
        transactions: {
          take: 5,
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            amount: true,
            description: true,
          },
        },
      },
    });

    return recurring.map((r) => this.transformToResponse(r));
  }

  /**
   * Get a single recurring transaction
   */
  async findOne(spaceId: string, userId: string, id: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const recurring = await this.prisma.recurringTransaction.findFirst({
      where: { id, spaceId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 20,
          select: {
            id: true,
            date: true,
            amount: true,
            description: true,
            merchant: true,
          },
        },
      },
    });

    if (!recurring) {
      throw new NotFoundException('Recurring transaction not found');
    }

    return this.transformToResponse(recurring);
  }

  /**
   * Create a new recurring transaction pattern manually
   */
  async create(spaceId: string, userId: string, dto: CreateRecurringDto) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Check for existing pattern with same merchant
    const existing = await this.prisma.recurringTransaction.findFirst({
      where: {
        spaceId,
        merchantName: dto.merchantName,
        status: { in: ['confirmed', 'detected'] },
      },
    });

    if (existing) {
      throw new ConflictException('A recurring pattern for this merchant already exists');
    }

    const recurring = await this.prisma.recurringTransaction.create({
      data: {
        spaceId,
        merchantName: dto.merchantName,
        merchantPattern: dto.merchantPattern,
        expectedAmount: dto.expectedAmount,
        amountVariance: dto.amountVariance ?? 0.1,
        currency: dto.currency,
        frequency: dto.frequency,
        status: 'confirmed',
        categoryId: dto.categoryId,
        alertBeforeDays: dto.alertBeforeDays ?? 3,
        alertEnabled: dto.alertEnabled ?? true,
        notes: dto.notes,
        confidence: 1.0, // Manual creation = full confidence
        confirmedAt: new Date(),
      },
    });

    this.logger.log(`Created recurring transaction: ${recurring.id} for space: ${spaceId}`);
    return this.transformToResponse(recurring);
  }

  /**
   * Update a recurring transaction pattern
   */
  async update(spaceId: string, userId: string, id: string, dto: UpdateRecurringDto) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const existing = await this.prisma.recurringTransaction.findFirst({
      where: { id, spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Recurring transaction not found');
    }

    const recurring = await this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        ...(dto.merchantName && { merchantName: dto.merchantName }),
        ...(dto.merchantPattern !== undefined && { merchantPattern: dto.merchantPattern }),
        ...(dto.expectedAmount !== undefined && { expectedAmount: dto.expectedAmount }),
        ...(dto.amountVariance !== undefined && { amountVariance: dto.amountVariance }),
        ...(dto.frequency && { frequency: dto.frequency }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.alertBeforeDays !== undefined && { alertBeforeDays: dto.alertBeforeDays }),
        ...(dto.alertEnabled !== undefined && { alertEnabled: dto.alertEnabled }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return this.transformToResponse(recurring);
  }

  /**
   * Confirm a detected recurring pattern
   */
  async confirm(spaceId: string, userId: string, id: string, dto: ConfirmRecurringDto) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const existing = await this.prisma.recurringTransaction.findFirst({
      where: { id, spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Recurring transaction not found');
    }

    if (existing.status !== 'detected') {
      throw new ConflictException('Can only confirm detected patterns');
    }

    const recurring = await this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
        ...(dto.frequency && { frequency: dto.frequency }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.alertEnabled !== undefined && { alertEnabled: dto.alertEnabled }),
      },
    });

    this.logger.log(`Confirmed recurring transaction: ${id} for space: ${spaceId}`);
    return this.transformToResponse(recurring);
  }

  /**
   * Dismiss a detected recurring pattern
   */
  async dismiss(spaceId: string, userId: string, id: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const existing = await this.prisma.recurringTransaction.findFirst({
      where: { id, spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Recurring transaction not found');
    }

    const recurring = await this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        status: 'dismissed',
        dismissedAt: new Date(),
      },
    });

    return this.transformToResponse(recurring);
  }

  /**
   * Pause or resume tracking
   */
  async togglePause(spaceId: string, userId: string, id: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const existing = await this.prisma.recurringTransaction.findFirst({
      where: { id, spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Recurring transaction not found');
    }

    const newStatus: RecurringStatus = existing.status === 'paused' ? 'confirmed' : 'paused';

    const recurring = await this.prisma.recurringTransaction.update({
      where: { id },
      data: { status: newStatus },
    });

    return this.transformToResponse(recurring);
  }

  /**
   * Delete a recurring transaction pattern
   */
  async remove(spaceId: string, userId: string, id: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const existing = await this.prisma.recurringTransaction.findFirst({
      where: { id, spaceId },
    });

    if (!existing) {
      throw new NotFoundException('Recurring transaction not found');
    }

    // Unlink all associated transactions
    await this.prisma.transaction.updateMany({
      where: { recurringId: id },
      data: { recurringId: null },
    });

    await this.prisma.recurringTransaction.delete({
      where: { id },
    });
  }

  /**
   * Detect patterns and create detected recurring transactions
   */
  async detectAndStore(spaceId: string, userId: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const patterns = await this.detectorService.detectPatterns(spaceId);

    const created: Array<ReturnType<RecurringService['transformToResponse']>> = [];
    for (const pattern of patterns) {
      try {
        const recurring = await this.prisma.recurringTransaction.create({
          data: {
            spaceId,
            merchantName: pattern.merchantName,
            expectedAmount: pattern.averageAmount,
            amountVariance: pattern.amountVariance,
            currency: pattern.currency,
            frequency: pattern.suggestedFrequency,
            status: 'detected',
            lastOccurrence: new Date(pattern.lastOccurrence),
            nextExpected: this.detectorService.calculateNextExpected(
              new Date(pattern.lastOccurrence),
              pattern.suggestedFrequency
            ),
            occurrenceCount: pattern.occurrenceCount,
            confidence: pattern.confidence,
          },
        });

        // Link the detected transactions
        const transactionIds = pattern.transactions.map((t) => t.id);
        await this.prisma.transaction.updateMany({
          where: { id: { in: transactionIds } },
          data: { recurringId: recurring.id },
        });

        created.push(this.transformToResponse(recurring));
      } catch (error) {
        // Skip duplicates silently
        if ((error as any).code === 'P2002') {
          continue;
        }
        throw error;
      }
    }

    this.logger.log(`Detected and stored ${created.length} patterns for space: ${spaceId}`);
    return { detected: created, total: patterns.length };
  }

  /**
   * Get summary of recurring transactions
   */
  async getSummary(spaceId: string, userId: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const confirmed = await this.prisma.recurringTransaction.findMany({
      where: { spaceId, status: 'confirmed' },
    });

    const detected = await this.prisma.recurringTransaction.count({
      where: { spaceId, status: 'detected' },
    });

    // Calculate monthly total
    let totalMonthly = 0;
    for (const r of confirmed) {
      const amount = Number(r.expectedAmount);
      switch (r.frequency) {
        case 'daily':
          totalMonthly += amount * 30;
          break;
        case 'weekly':
          totalMonthly += amount * 4.33;
          break;
        case 'biweekly':
          totalMonthly += amount * 2.17;
          break;
        case 'monthly':
          totalMonthly += amount;
          break;
        case 'quarterly':
          totalMonthly += amount / 3;
          break;
        case 'yearly':
          totalMonthly += amount / 12;
          break;
      }
    }

    // Get upcoming this month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const upcoming = await this.prisma.recurringTransaction.findMany({
      where: {
        spaceId,
        status: 'confirmed',
        nextExpected: { gte: now, lte: endOfMonth },
      },
      orderBy: { nextExpected: 'asc' },
      take: 10,
    });

    return {
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalAnnual: Math.round(totalMonthly * 12 * 100) / 100,
      activeCount: confirmed.length,
      detectedCount: detected,
      upcomingThisMonth: upcoming.map((r) => ({
        id: r.id,
        merchantName: r.merchantName,
        expectedAmount: Number(r.expectedAmount),
        currency: r.currency,
        expectedDate: r.nextExpected?.toISOString(),
        daysUntil: r.nextExpected
          ? Math.ceil((r.nextExpected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      })),
    };
  }

  private transformToResponse(recurring: any) {
    return {
      id: recurring.id,
      spaceId: recurring.spaceId,
      merchantName: recurring.merchantName,
      merchantPattern: recurring.merchantPattern,
      expectedAmount: Number(recurring.expectedAmount),
      amountVariance: Number(recurring.amountVariance),
      currency: recurring.currency,
      frequency: recurring.frequency,
      status: recurring.status,
      categoryId: recurring.categoryId,
      lastOccurrence: recurring.lastOccurrence?.toISOString() || null,
      nextExpected: recurring.nextExpected?.toISOString() || null,
      occurrenceCount: recurring.occurrenceCount,
      confidence: Number(recurring.confidence),
      alertBeforeDays: recurring.alertBeforeDays,
      alertEnabled: recurring.alertEnabled,
      notes: recurring.notes,
      firstDetectedAt: recurring.firstDetectedAt?.toISOString(),
      confirmedAt: recurring.confirmedAt?.toISOString() || null,
      createdAt: recurring.createdAt?.toISOString(),
      updatedAt: recurring.updatedAt?.toISOString(),
      recentTransactions: recurring.transactions || [],
    };
  }
}