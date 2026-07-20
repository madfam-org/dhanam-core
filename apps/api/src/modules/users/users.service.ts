// SPDX-License-Identifier: AGPL-3.0-or-later
import { User, UserProfile } from '@dhanam-core/shared';
import { Injectable } from '@nestjs/common';

import {
  BusinessRuleException,
  InfrastructureException,
  ValidationException,
} from '@core/exceptions/domain-exceptions';
import { isPrismaKnownRequestError } from '@core/filters/prisma-error.guard';
import { LoggerService } from '@core/logger/logger.service';
import { PrismaService } from '@core/prisma/prisma.service';

import { UpdateUserDto } from './dto/update-user.dto';

/**
 * UsersService
 * Note: Soft delete is implemented. Use Prisma middleware for global filtering of deleted users.
 */
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService
  ) {}

  /**
   * Handle Prisma errors and map to domain exceptions
   */
  private handlePrismaError(error: unknown, operation: string): never {
    if (isPrismaKnownRequestError(error)) {
      switch (error.code) {
        case 'P2025':
          throw BusinessRuleException.resourceNotFound('User', operation);
        case 'P2002':
          throw ValidationException.duplicateEntry(
            (error.meta?.target as string[])?.join(', ') || 'field'
          );
        default:
          throw InfrastructureException.databaseError(
            operation,
            error instanceof Error ? error : new Error(String(error))
          );
      }
    }

    if (error instanceof BusinessRuleException || error instanceof ValidationException) {
      throw error;
    }

    throw InfrastructureException.databaseError(
      operation,
      error instanceof Error ? error : new Error(String(error))
    );
  }

  async getProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userSpaces: {
            include: {
              space: true,
            },
          },
        },
      });

      if (!user) {
        throw BusinessRuleException.resourceNotFound('User', userId);
      }

      const spaces = user.userSpaces.map((us) => ({
        id: us.space.id,
        name: us.space.name,
        type: us.space.type,
        role: us.role,
      }));

      return {
        ...this.sanitizeUser(user),
        spaces,
      };
    } catch (error) {
      if (error instanceof BusinessRuleException) {
        throw error;
      }
      this.handlePrismaError(error, 'getProfile');
    }
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<User> {
    try {
      // Validate input
      if (dto.name !== undefined && dto.name.trim().length === 0) {
        throw ValidationException.invalidInput('name', 'Name cannot be empty');
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: dto.name,
          locale: dto.locale,
          timezone: dto.timezone,
        },
      });

      this.logger.log(`Profile updated for user: ${userId}`, 'UsersService');

      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error;
      }
      this.handlePrismaError(error, 'updateProfile');
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          // Delete user's spaces where they are the only owner
          const ownedSpaces = await tx.userSpace.findMany({
            where: {
              userId,
              role: 'owner',
            },
            include: {
              space: {
                include: {
                  userSpaces: true,
                },
              },
            },
          });

          for (const userSpace of ownedSpaces) {
            const otherOwners = userSpace.space.userSpaces.filter(
              (us) => us.userId !== userId && us.role === 'owner'
            );

            if (otherOwners.length === 0) {
              await tx.space.delete({
                where: { id: userSpace.spaceId },
              });
            }
          }

          // Soft delete the user (mark as deleted, purged by retention job after 30 days)
          await tx.user.update({
            where: { id: userId },
            data: {
              deletedAt: new Date(),
              isActive: false,
            },
          });
        },
        {
          maxWait: 5000, // 5 seconds max wait for transaction slot
          timeout: 30000, // 30 seconds transaction timeout
        }
      );

      this.logger.log(`Account deleted for user: ${userId}`, 'UsersService');
    } catch (error) {
      this.handlePrismaError(error, 'deleteAccount');
    }
  }

  private sanitizeUser(user: Record<string, unknown>): User {
    const { passwordHash: _passwordHash, totpSecret: _totpSecret, ...sanitized } = user;
    return sanitized as unknown as User;
  }
}