// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

import { Will, BeneficiaryDesignation, WillExecutor, AssetType, Prisma } from '@db';

import { AuditService } from '../../core/audit/audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';

import {
  CreateWillDto,
  UpdateWillDto,
  AddBeneficiaryDto,
  UpdateBeneficiaryDto,
  AddExecutorDto,
  UpdateExecutorDto,
} from './dto';

@Injectable()
export class EstatePlanningService {
  private readonly logger = new Logger(EstatePlanningService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  /**
   * Create a new will (draft status)
   */
  async createWill(dto: CreateWillDto, userId: string): Promise<Will> {
    // Verify user is a member of the household
    const householdMember = await this.prisma.householdMember.findFirst({
      where: {
        householdId: dto.householdId,
        userId,
      },
    });

    if (!householdMember) {
      throw new NotFoundException('Household not found or you are not a member');
    }

    const will = await this.prisma.will.create({
      data: {
        householdId: dto.householdId,
        name: dto.name,
        notes: dto.notes,
        legalDisclaimer: dto.legalDisclaimer || false,
        status: 'draft',
      },
      include: {
        beneficiaries: true,
        executors: true,
      },
    });

    await this.audit.log({
      userId,
      action: 'WILL_CREATED',
      resource: 'will',
      resourceId: will.id,
      severity: 'medium',
      metadata: {
        willName: will.name,
        householdId: will.householdId,
      },
    });

    this.logger.log(`Will created: ${will.id} by user ${userId}`);

    return will;
  }

  /**
   * Find will by ID (with access check)
   */
  async findById(
    willId: string,
    userId: string
  ): Promise<
    Prisma.WillGetPayload<{
      include: {
        beneficiaries: {
          include: {
            beneficiary: {
              include: { user: { select: { id: true; name: true; email: true } } };
            };
          };
        };
        executors: { include: { executor: { include: { user: true } } } };
      };
    }>
  > {
    const will = await this.prisma.will.findFirst({
      where: {
        id: willId,
        household: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        beneficiaries: {
          include: {
            beneficiary: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        executors: {
          include: {
            executor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        household: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!will) {
      throw new NotFoundException('Will not found or you do not have access');
    }

    return will;
  }

  /**
   * Find all wills for a household
   */
  async findByHousehold(householdId: string, userId: string): Promise<Will[]> {
    // Verify user is a member of the household
    const householdMember = await this.prisma.householdMember.findFirst({
      where: {
        householdId,
        userId,
      },
    });

    if (!householdMember) {
      throw new NotFoundException('Household not found or you are not a member');
    }

    return this.prisma.will.findMany({
      where: {
        householdId,
      },
      include: {
        beneficiaries: {
          include: {
            beneficiary: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        executors: {
          include: {
            executor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            beneficiaries: true,
            executors: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update a will
   */
  async updateWill(willId: string, dto: UpdateWillDto, userId: string): Promise<Will> {
    const will = await this.findById(willId, userId);

    // Cannot update if will is executed
    if (will.status === 'executed') {
      throw new BadRequestException('Cannot update an executed will');
    }

    const updated = await this.prisma.will.update({
      where: { id: willId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.legalDisclaimer !== undefined && { legalDisclaimer: dto.legalDisclaimer }),
      },
      include: {
        beneficiaries: true,
        executors: true,
      },
    });

    await this.audit.log({
      userId,
      action: 'WILL_UPDATED',
      resource: 'will',
      resourceId: willId,
      severity: 'low',
      metadata: { changes: Object.keys(dto) },
    });

    this.logger.log(`Will updated: ${willId} by user ${userId}`);

    return updated;
  }

  /**
   * Delete a will (only if draft)
   */
  async deleteWill(willId: string, userId: string): Promise<void> {
    const will = await this.findById(willId, userId);

    if (will.status !== 'draft') {
      throw new BadRequestException('Can only delete draft wills. Revoke active wills instead.');
    }

    await this.prisma.will.delete({
      where: { id: willId },
    });

    await this.audit.log({
      userId,
      action: 'WILL_DELETED',
      resource: 'will',
      resourceId: willId,
      severity: 'medium',
      metadata: { willName: will.name },
    });

    this.logger.log(`Will deleted: ${willId} by user ${userId}`);
  }

  /**
   * Activate a will (with validation)
   */
  async activateWill(willId: string, userId: string): Promise<Will> {
    const will = await this.findById(willId, userId);

    // Validation checks
    if (will.status !== 'draft') {
      throw new BadRequestException('Can only activate draft wills');
    }

    if (!will.legalDisclaimer) {
      throw new BadRequestException('Legal disclaimer must be accepted before activation');
    }

    if ((will.beneficiaries as any[]).length === 0) {
      throw new BadRequestException('Will must have at least one beneficiary');
    }

    if ((will.executors as any[]).length === 0) {
      throw new BadRequestException('Will must have at least one executor');
    }

    // Validate beneficiary allocations sum to 100% per asset type
    const validationResult = await this.validateBeneficiaryAllocations(willId);
    if (!validationResult.isValid) {
      throw new BadRequestException(
        `Beneficiary allocations are invalid: ${validationResult.errors.join(', ')}`
      );
    }

    // Revoke any other active will for this household
    await this.prisma.will.updateMany({
      where: {
        householdId: will.householdId,
        status: 'active',
      },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    });

    // Activate this will
    const activated = await this.prisma.will.update({
      where: { id: willId },
      data: {
        status: 'active',
        activatedAt: new Date(),
      },
      include: {
        beneficiaries: true,
        executors: true,
      },
    });

    await this.audit.log({
      userId,
      action: 'WILL_ACTIVATED',
      resource: 'will',
      resourceId: willId,
      severity: 'high',
      metadata: {
        willName: will.name,
        householdId: will.householdId,
      },
    });

    this.logger.log(`Will activated: ${willId} by user ${userId}`);

    return activated;
  }

  /**
   * Revoke a will
   */
  async revokeWill(willId: string, userId: string): Promise<Will> {
    const will = await this.findById(willId, userId);

    if (will.status !== 'active') {
      throw new BadRequestException('Can only revoke active wills');
    }

    const revoked = await this.prisma.will.update({
      where: { id: willId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
      },
      include: {
        beneficiaries: true,
        executors: true,
      },
    });

    await this.audit.log({
      userId,
      action: 'WILL_REVOKED',
      resource: 'will',
      resourceId: willId,
      severity: 'high',
      metadata: { willName: will.name },
    });

    this.logger.log(`Will revoked: ${willId} by user ${userId}`);

    return revoked;
  }

  /**
   * Validate beneficiary allocations (must sum to 100% per asset type)
   */
  async validateBeneficiaryAllocations(
    willId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const beneficiaries = await this.prisma.beneficiaryDesignation.findMany({
      where: { willId },
    });

    const errors: string[] = [];

    // Group by asset type
    const byAssetType = beneficiaries.reduce(
      (acc, b) => {
        if (!acc[b.assetType]) {
          acc[b.assetType] = [];
        }
        acc[b.assetType].push(b);
        return acc;
      },
      {} as Record<AssetType, BeneficiaryDesignation[]>
    );

    // Check each asset type sums to 100%
    for (const [assetType, designations] of Object.entries(byAssetType)) {
      const total = (designations as any[]).reduce((sum, d) => sum + Number(d.percentage), 0);

      if (Math.abs(total - 100) > 0.01) {
        // Allow for small floating point errors
        errors.push(`${assetType}: allocations sum to ${total}% (must be 100%)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Add a beneficiary to a will
   */
  async addBeneficiary(
    willId: string,
    dto: AddBeneficiaryDto,
    userId: string
  ): Promise<BeneficiaryDesignation> {
    const will = await this.findById(willId, userId);

    if (will.status === 'executed') {
      throw new BadRequestException('Cannot modify an executed will');
    }

    // Verify beneficiary is a member of the household
    const beneficiary = await this.prisma.householdMember.findFirst({
      where: {
        id: dto.beneficiaryId,
        householdId: will.householdId,
      },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary must be a member of the household');
    }

    const beneficiaryDesignation = await this.prisma.beneficiaryDesignation.create({
      data: {
        willId,
        beneficiaryId: dto.beneficiaryId,
        assetType: dto.assetType,
        assetId: dto.assetId,
        percentage: dto.percentage,
        conditions: dto.conditions,
        notes: dto.notes,
      },
      include: {
        beneficiary: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await this.audit.log({
      userId,
      action: 'BENEFICIARY_ADDED',
      resource: 'will',
      resourceId: willId,
      severity: 'medium',
      metadata: {
        beneficiaryId: dto.beneficiaryId,
        assetType: dto.assetType,
        percentage: dto.percentage,
      },
    });

    this.logger.log(`Beneficiary added to will: ${willId} by user ${userId}`);

    return beneficiaryDesignation;
  }

  /**
   * Update a beneficiary designation
   */
  async updateBeneficiary(
    willId: string,
    beneficiaryId: string,
    dto: UpdateBeneficiaryDto,
    userId: string
  ): Promise<BeneficiaryDesignation> {
    const will = await this.findById(willId, userId);

    if (will.status === 'executed') {
      throw new BadRequestException('Cannot modify an executed will');
    }

    const beneficiary = await this.prisma.beneficiaryDesignation.findFirst({
      where: {
        id: beneficiaryId,
        willId,
      },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary designation not found');
    }

    const updated = await this.prisma.beneficiaryDesignation.update({
      where: { id: beneficiaryId },
      data: {
        ...(dto.assetType && { assetType: dto.assetType }),
        ...(dto.assetId !== undefined && { assetId: dto.assetId }),
        ...(dto.percentage !== undefined && { percentage: dto.percentage }),
        ...(dto.conditions !== undefined && { conditions: dto.conditions }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        beneficiary: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await this.audit.log({
      userId,
      action: 'BENEFICIARY_UPDATED',
      resource: 'will',
      resourceId: willId,
      severity: 'medium',
      metadata: {
        beneficiaryDesignationId: beneficiaryId,
        changes: Object.keys(dto),
      },
    });

    this.logger.log(`Beneficiary updated in will: ${willId} by user ${userId}`);

    return updated;
  }

  /**
   * Remove a beneficiary from a will
   */
  async removeBeneficiary(willId: string, beneficiaryId: string, userId: string): Promise<void> {
    const will = await this.findById(willId, userId);

    if (will.status === 'executed') {
      throw new BadRequestException('Cannot modify an executed will');
    }

    const beneficiary = await this.prisma.beneficiaryDesignation.findFirst({
      where: {
        id: beneficiaryId,
        willId,
      },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary designation not found');
    }

    await this.prisma.beneficiaryDesignation.delete({
      where: { id: beneficiaryId },
    });

    await this.audit.log({
      userId,
      action: 'BENEFICIARY_REMOVED',
      resource: 'will',
      resourceId: willId,
      severity: 'medium',
      metadata: { beneficiaryDesignationId: beneficiaryId },
    });

    this.logger.log(`Beneficiary removed from will: ${willId} by user ${userId}`);
  }

  /**
   * Add an executor to a will
   */
  async addExecutor(willId: string, dto: AddExecutorDto, userId: string): Promise<WillExecutor> {
    const will = await this.findById(willId, userId);

    if (will.status === 'executed') {
      throw new BadRequestException('Cannot modify an executed will');
    }

    // Verify executor is a member of the household
    const executor = await this.prisma.householdMember.findFirst({
      where: {
        id: dto.executorId,
        householdId: will.householdId,
      },
    });

    if (!executor) {
      throw new NotFoundException('Executor must be a member of the household');
    }

    const willExecutor = await this.prisma.willExecutor.create({
      data: {
        willId,
        executorId: dto.executorId,
        isPrimary: dto.isPrimary || false,
        order: dto.order || 1,
        notes: dto.notes,
      },
      include: {
        executor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await this.audit.log({
      userId,
      action: 'EXECUTOR_ADDED',
      resource: 'will',
      resourceId: willId,
      severity: 'medium',
      metadata: {
        executorId: dto.executorId,
        isPrimary: dto.isPrimary,
      },
    });

    this.logger.log(`Executor added to will: ${willId} by user ${userId}`);

    return willExecutor;
  }

  /**
   * Update an executor
   */
  async updateExecutor(
    willId: string,
    executorId: string,
    dto: UpdateExecutorDto,
    userId: string
  ): Promise<WillExecutor> {
    const will = await this.findById(willId, userId);

    if (will.status === 'executed') {
      throw new BadRequestException('Cannot modify an executed will');
    }

    const executor = await this.prisma.willExecutor.findFirst({
      where: {
        id: executorId,
        willId,
      },
    });

    if (!executor) {
      throw new NotFoundException('Executor not found');
    }

    const updated = await this.prisma.willExecutor.update({
      where: { id: executorId },
      data: {
        ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        executor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await this.audit.log({
      userId,
      action: 'EXECUTOR_UPDATED',
      resource: 'will',
      resourceId: willId,
      severity: 'medium',
      metadata: {
        executorId,
        changes: Object.keys(dto),
      },
    });

    this.logger.log(`Executor updated in will: ${willId} by user ${userId}`);

    return updated;
  }

  /**
   * Remove an executor from a will
   */
  async removeExecutor(willId: string, executorId: string, userId: string): Promise<void> {
    const will = await this.findById(willId, userId);

    if (will.status === 'executed') {
      throw new BadRequestException('Cannot modify an executed will');
    }

    const executor = await this.prisma.willExecutor.findFirst({
      where: {
        id: executorId,
        willId,
      },
    });

    if (!executor) {
      throw new NotFoundException('Executor not found');
    }

    await this.prisma.willExecutor.delete({
      where: { id: executorId },
    });

    await this.audit.log({
      userId,
      action: 'EXECUTOR_REMOVED',
      resource: 'will',
      resourceId: willId,
      severity: 'medium',
      metadata: { executorId },
    });

    this.logger.log(`Executor removed from will: ${willId} by user ${userId}`);
  }
}