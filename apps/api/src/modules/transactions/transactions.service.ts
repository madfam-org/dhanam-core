// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import type { InputJsonValue } from '@db';
import { Transaction, Prisma } from '@db';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

import { CreateTransactionDto, UpdateTransactionDto, TransactionsFilterDto } from './dto';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService
  ) {}

  async findAll(
    spaceId: string,
    userId: string,
    filter: TransactionsFilterDto
  ): Promise<{ data: Transaction[]; total: number; page: number; limit: number }> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const where: Prisma.TransactionWhereInput = {
      account: { spaceId },
      ...(filter.accountId && { accountId: filter.accountId }),
      ...(filter.categoryId && { categoryId: filter.categoryId }),
      ...(filter.budgetId && { category: { budgetId: filter.budgetId } }),
      ...(filter.startDate && { date: { gte: filter.startDate } }),
      ...(filter.endDate && { date: { lte: filter.endDate } }),
      ...(filter.minAmount && { amount: { gte: filter.minAmount } }),
      ...(filter.maxAmount && { amount: { lte: filter.maxAmount } }),
      ...(filter.merchant && { merchant: { contains: filter.merchant, mode: 'insensitive' } }),
      ...(filter.reviewed !== undefined && { reviewed: filter.reviewed }),
      ...(filter.tagIds &&
        filter.tagIds.length > 0 && {
          tags: { some: { tagId: { in: filter.tagIds } } },
        }),
      ...(filter.excludeFromTotals !== undefined && {
        excludeFromTotals: filter.excludeFromTotals,
      }),
      ...(filter.search && {
        OR: [
          { description: { contains: filter.search, mode: 'insensitive' } },
          { merchant: { contains: filter.search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.TransactionOrderByWithRelationInput = filter.sortBy
      ? { [filter.sortBy]: filter.sortOrder || 'desc' }
      : { date: 'desc' };

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          account: true,
          category: true,
          tags: { include: { tag: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(spaceId: string, userId: string, transactionId: string): Promise<Transaction> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        account: { spaceId },
      },
      include: {
        account: true,
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async create(spaceId: string, userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Verify account belongs to space
    const account = await this.prisma.account.findFirst({
      where: {
        id: dto.accountId,
        spaceId,
      },
    });

    if (!account) {
      throw new ForbiddenException('Account not found or does not belong to this space');
    }

    // Verify category belongs to space if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          budget: { spaceId },
        },
      });

      if (!category) {
        throw new ForbiddenException('Category not found or does not belong to this space');
      }
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        accountId: dto.accountId,
        amount: dto.amount,
        currency: account.currency,
        date: dto.date,
        description: dto.description,
        merchant: dto.merchant,
        categoryId: dto.categoryId,
        reviewed: dto.reviewed ?? false,
        reviewedAt: dto.reviewed ? new Date() : null,
        excludeFromTotals: dto.excludeFromTotals ?? false,
        metadata: dto.metadata as InputJsonValue,
        ...(dto.tagIds &&
          dto.tagIds.length > 0 && {
            tags: {
              createMany: {
                data: dto.tagIds.map((tagId) => ({ tagId })),
                skipDuplicates: true,
              },
            },
          }),
      },
      include: {
        account: true,
        category: true,
        tags: { include: { tag: true } },
      },
    });

    // Update account balance
    await this.prisma.account.update({
      where: { id: dto.accountId },
      data: {
        balance: {
          increment: dto.amount,
        },
      },
    });

    return transaction;
  }

  async update(
    spaceId: string,
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto
  ): Promise<Transaction> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const existingTransaction = await this.findOne(spaceId, userId, transactionId);

    // Verify category belongs to space if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          budget: { spaceId },
        },
      });

      if (!category) {
        throw new ForbiddenException('Category not found or does not belong to this space');
      }
    }

    // Update account balance if amount changed
    if (dto.amount !== undefined && dto.amount !== existingTransaction.amount.toNumber()) {
      const difference = dto.amount - existingTransaction.amount.toNumber();
      await this.prisma.account.update({
        where: { id: existingTransaction.accountId },
        data: {
          balance: {
            increment: difference,
          },
        },
      });
    }

    // Handle tag updates if provided
    if (dto.tagIds !== undefined) {
      await this.prisma.transactionTag.deleteMany({
        where: { transactionId },
      });
      if (dto.tagIds.length > 0) {
        await this.prisma.transactionTag.createMany({
          data: dto.tagIds.map((tagId) => ({ transactionId, tagId })),
          skipDuplicates: true,
        });
      }
    }

    const transaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.date && { date: dto.date }),
        ...(dto.description && { description: dto.description }),
        ...(dto.merchant !== undefined && { merchant: dto.merchant }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.reviewed !== undefined && {
          reviewed: dto.reviewed,
          reviewedAt: dto.reviewed ? new Date() : null,
        }),
        ...(dto.excludeFromTotals !== undefined && { excludeFromTotals: dto.excludeFromTotals }),
        ...(dto.metadata && { metadata: dto.metadata as InputJsonValue }),
      },
      include: {
        account: true,
        category: true,
        tags: { include: { tag: true } },
      },
    });

    return transaction;
  }

  async remove(spaceId: string, userId: string, transactionId: string): Promise<void> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const transaction = await this.findOne(spaceId, userId, transactionId);

    // Update account balance
    await this.prisma.account.update({
      where: { id: transaction.accountId },
      data: {
        balance: {
          decrement: transaction.amount,
        },
      },
    });

    await this.prisma.transaction.delete({
      where: { id: transactionId },
    });
  }

  async bulkCategorize(
    spaceId: string,
    userId: string,
    transactionIds: string[],
    categoryId: string
  ): Promise<Transaction[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Verify category belongs to space
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        budget: { spaceId },
      },
    });

    if (!category) {
      throw new ForbiddenException('Category not found or does not belong to this space');
    }

    // Verify all transactions belong to space
    const transactionCount = await this.prisma.transaction.count({
      where: {
        id: { in: transactionIds },
        account: { spaceId },
      },
    });

    if (transactionCount !== transactionIds.length) {
      throw new ForbiddenException('Some transactions not found or do not belong to this space');
    }

    await this.prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
      },
      data: {
        categoryId,
      },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
      },
      include: {
        account: true,
        category: true,
        tags: { include: { tag: true } },
      },
    });

    return transactions;
  }

  async bulkReview(
    spaceId: string,
    userId: string,
    transactionIds: string[],
    reviewed: boolean
  ): Promise<{ updated: number }> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Verify all transactions belong to space
    const transactionCount = await this.prisma.transaction.count({
      where: {
        id: { in: transactionIds },
        account: { spaceId },
      },
    });

    if (transactionCount !== transactionIds.length) {
      throw new ForbiddenException('Some transactions not found or do not belong to this space');
    }

    const result = await this.prisma.transaction.updateMany({
      where: { id: { in: transactionIds } },
      data: {
        reviewed,
        reviewedAt: reviewed ? new Date() : null,
      },
    });

    return { updated: result.count };
  }

  async getUnreviewedCount(spaceId: string, userId: string): Promise<number> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    return this.prisma.transaction.count({
      where: {
        account: { spaceId },
        reviewed: false,
      },
    });
  }

  async getMerchants(
    spaceId: string,
    userId: string
  ): Promise<{ merchant: string; count: number; firstDate: Date | null; lastDate: Date | null }[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const results = await this.prisma.transaction.groupBy({
      by: ['merchant'],
      where: {
        account: { spaceId },
        merchant: { not: null },
      },
      _count: { id: true },
      _min: { date: true },
      _max: { date: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return results
      .filter((r) => r.merchant !== null)
      .map((r) => ({
        merchant: r.merchant!,
        count: r._count.id,
        firstDate: r._min.date,
        lastDate: r._max.date,
      }));
  }

  async renameMerchant(
    spaceId: string,
    userId: string,
    oldName: string,
    newName: string
  ): Promise<{ updated: number }> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const result = await this.prisma.transaction.updateMany({
      where: {
        account: { spaceId },
        merchant: oldName,
      },
      data: { merchant: newName },
    });

    return { updated: result.count };
  }

  async mergeMerchants(
    spaceId: string,
    userId: string,
    sourceNames: string[],
    targetName: string
  ): Promise<{ updated: number }> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const result = await this.prisma.transaction.updateMany({
      where: {
        account: { spaceId },
        merchant: { in: sourceNames },
      },
      data: { merchant: targetName },
    });

    return { updated: result.count };
  }
}
