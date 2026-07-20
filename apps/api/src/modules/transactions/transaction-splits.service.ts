// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { LoggerService } from '@core/logger/logger.service';
import { PrismaService } from '@core/prisma/prisma.service';

import { SplitTransactionDto, UpdateSplitDto } from './dto/split-transaction.dto';

@Injectable()
export class TransactionSplitsService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService
  ) {}

  /**
   * Split a transaction between multiple users (for couples/roommates)
   */
  async splitTransaction(
    spaceId: string,
    transactionId: string,
    userId: string,
    dto: SplitTransactionDto
  ) {
    // Verify transaction exists and belongs to space
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        account: { spaceId },
      },
      include: {
        account: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Validate split amounts sum to transaction total
    const totalSplitAmount = dto.splits.reduce((sum, split) => sum + split.amount, 0);
    const transactionAmount = parseFloat(transaction.amount.toString());

    if (Math.abs(totalSplitAmount - Math.abs(transactionAmount)) > 0.01) {
      throw new BadRequestException(
        `Split amounts (${totalSplitAmount}) must equal transaction amount (${Math.abs(transactionAmount)})`
      );
    }

    // Delete existing splits if any
    await this.prisma.transactionSplit.deleteMany({
      where: { transactionId },
    });

    // Create new splits
    const splits = await this.prisma.$transaction(
      dto.splits.map((split) =>
        this.prisma.transactionSplit.create({
          data: {
            transactionId,
            userId: split.userId,
            amount: split.amount,
            percentage: split.percentage,
            note: split.note,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
      )
    );

    // Mark transaction as split
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { isSplit: true },
    });

    this.logger.log(
      `Transaction ${transactionId} split among ${dto.splits.length} users`,
      'TransactionSplitsService'
    );

    return splits;
  }

  /**
   * Get splits for a transaction
   */
  async getTransactionSplits(spaceId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        account: { spaceId },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const splits = await this.prisma.transactionSplit.findMany({
      where: { transactionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { amount: 'desc' },
    });

    return splits;
  }

  /**
   * Update a specific user's split
   */
  async updateSplit(
    spaceId: string,
    transactionId: string,
    splitUserId: string,
    userId: string,
    dto: UpdateSplitDto
  ) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        account: { spaceId },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const split = await this.prisma.transactionSplit.findUnique({
      where: {
        transactionId_userId: {
          transactionId,
          userId: splitUserId,
        },
      },
    });

    if (!split) {
      throw new NotFoundException('Split not found');
    }

    const updated = await this.prisma.transactionSplit.update({
      where: {
        transactionId_userId: {
          transactionId,
          userId: splitUserId,
        },
      },
      data: {
        amount: dto.amount,
        percentage: dto.percentage,
        note: dto.note,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Split updated for user ${splitUserId} on transaction ${transactionId}`);

    return updated;
  }

  /**
   * Remove split (convert back to regular transaction)
   */
  async removeSplit(spaceId: string, transactionId: string, _userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        account: { spaceId },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.prisma.transactionSplit.deleteMany({
      where: { transactionId },
    });

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { isSplit: false },
    });

    this.logger.log(`Split removed from transaction ${transactionId}`);
  }

  /**
   * Get all split transactions for a user
   */
  async getUserSplitTransactions(spaceId: string, userId: string) {
    const splits = await this.prisma.transactionSplit.findMany({
      where: {
        userId,
        transaction: {
          account: { spaceId },
        },
      },
      include: {
        transaction: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        transaction: {
          date: 'desc',
        },
      },
    });

    return splits;
  }
}