// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomBytes } from 'crypto';

import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuditService } from '@core/audit/audit.service';
import { MailerService } from '@core/mailer/mailer.service';
import { PrismaService } from '@core/prisma/prisma.service';

export interface ExecutorAccessGrant {
  accessToken: string;
  expiresAt: Date;
  accountHolder: {
    id: string;
    name: string;
  };
  readOnlyAccess: boolean;
}

/**
 * Service to manage executor access provisioning for Life Beat
 * Implements two-person activation rule and time-limited read-only access
 */
@Injectable()
export class ExecutorAccessService {
  private readonly logger = new Logger(ExecutorAccessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: MailerService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Add a new executor assignment
   */
  async addExecutor(
    userId: string,
    executorData: {
      email: string;
      name: string;
      relationship: string;
      priority?: number;
    }
  ): Promise<{ id: string; verificationSent: boolean }> {
    // Check for existing assignment
    const existing = await this.prisma.executorAssignment.findUnique({
      where: {
        userId_executorEmail: {
          userId,
          executorEmail: executorData.email,
        },
      },
    });

    if (existing) {
      throw new ForbiddenException('This executor is already assigned');
    }

    // Get account holder info for email
    const accountHolder = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Get current max priority for ordering
    const maxPriority = await this.prisma.executorAssignment.aggregate({
      where: { userId },
      _max: { priority: true },
    });

    const assignment = await this.prisma.executorAssignment.create({
      data: {
        userId,
        executorEmail: executorData.email,
        executorName: executorData.name,
        relationship: executorData.relationship,
        priority: executorData.priority || (maxPriority._max.priority || 0) + 1,
      },
    });

    // Log the action
    await this.auditService.log({
      userId,
      action: 'executor_added',
      resource: 'executor_assignment',
      resourceId: assignment.id,
      metadata: {
        executorEmail: executorData.email,
        relationship: executorData.relationship,
      },
    });

    this.logger.log(`Executor ${executorData.email} added for user ${userId}`);

    // Send verification email to executor
    let verificationSent: boolean;
    try {
      const webUrl = this.configService.get<string>('WEB_URL', 'http://localhost:3000');
      const encodedEmail = encodeURIComponent(executorData.email);
      const verificationUrl = `${webUrl}/executor/verify?id=${assignment.id}&email=${encodedEmail}`;

      await this.emailService.sendTemplateEmail(executorData.email, 'executor-invitation', {
        recipient_name: executorData.name,
        inviter_name: accountHolder?.name || 'a user',
        role: 'Executor',
        message: `You have been designated as an executor for ${accountHolder?.name || 'a user'}'s estate planning.`,
        action_url: verificationUrl,
        expires_in: '30 days',
      });

      verificationSent = true;
    } catch (error) {
      this.logger.error(`Error sending executor verification email: ${error}`);
      verificationSent = false;
    }

    return { id: assignment.id, verificationSent };
  }

  /**
   * Verify an executor (called when executor confirms via email)
   */
  async verifyExecutor(
    assignmentId: string,
    executorEmail: string
  ): Promise<{ verified: boolean }> {
    const assignment = await this.prisma.executorAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Executor assignment not found');
    }

    if (assignment.executorEmail !== executorEmail) {
      throw new ForbiddenException('Email does not match assignment');
    }

    if (assignment.verified) {
      return { verified: true }; // Already verified
    }

    await this.prisma.executorAssignment.update({
      where: { id: assignmentId },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    this.logger.log(`Executor ${executorEmail} verified for assignment ${assignmentId}`);
    return { verified: true };
  }

  /**
   * Remove an executor assignment
   */
  async removeExecutor(userId: string, assignmentId: string): Promise<{ removed: boolean }> {
    const assignment = await this.prisma.executorAssignment.findFirst({
      where: {
        id: assignmentId,
        userId,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Executor assignment not found');
    }

    await this.prisma.executorAssignment.delete({
      where: { id: assignmentId },
    });

    await this.auditService.log({
      userId,
      action: 'executor_removed',
      resource: 'executor_assignment',
      resourceId: assignmentId,
      metadata: {
        executorEmail: assignment.executorEmail,
      },
    });

    this.logger.log(`Executor ${assignment.executorEmail} removed for user ${userId}`);
    return { removed: true };
  }

  /**
   * Get all executors for a user
   */
  async getExecutors(userId: string): Promise<
    Array<{
      id: string;
      email: string;
      name: string;
      relationship: string;
      priority: number;
      verified: boolean;
      verifiedAt: Date | null;
      accessGranted: boolean;
      accessExpiresAt: Date | null;
    }>
  > {
    const assignments = await this.prisma.executorAssignment.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
    });

    return assignments.map((a) => ({
      id: a.id,
      email: a.executorEmail,
      name: a.executorName,
      relationship: a.relationship,
      priority: a.priority,
      verified: a.verified,
      verifiedAt: a.verifiedAt,
      accessGranted: a.accessGranted,
      accessExpiresAt: a.accessExpiresAt,
    }));
  }

  /**
   * Request access as an executor (requires two-person confirmation for final access)
   */
  async requestAccess(
    assignmentId: string,
    executorEmail: string
  ): Promise<{ requestSubmitted: boolean; requiresSecondConfirmation: boolean }> {
    const assignment = await this.prisma.executorAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        accountHolder: {
          include: {
            executorAssignments: {
              where: { verified: true },
              orderBy: { priority: 'asc' },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Executor assignment not found');
    }

    if (assignment.executorEmail !== executorEmail) {
      throw new ForbiddenException('Unauthorized access request');
    }

    if (!assignment.verified) {
      throw new ForbiddenException('Executor must be verified first');
    }

    // Check if user has been inactive long enough
    const user = assignment.accountHolder;
    const lastActivity = user.lastActivityAt || user.lastLoginAt;
    if (lastActivity) {
      const daysSinceActivity = Math.floor(
        (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      const maxAlertDay = Math.max(...user.lifeBeatAlertDays);

      if (daysSinceActivity < maxAlertDay) {
        throw new ForbiddenException(
          `Account holder was active ${daysSinceActivity} days ago. Access requires ${maxAlertDay} days of inactivity.`
        );
      }
    }

    // Two-person rule: require confirmation from at least one other verified executor
    const verifiedExecutors = user.executorAssignments.filter((e) => e.verified);
    const requiresSecondConfirmation = verifiedExecutors.length > 1;

    // Log access request
    await this.auditService.log({
      userId: user.id,
      action: 'executor_access_requested',
      resource: 'executor_assignment',
      resourceId: assignmentId,
      metadata: {
        executorEmail,
        requiresSecondConfirmation,
      },
    });

    this.logger.log(`Access requested by executor ${executorEmail} for user ${user.id}`);

    return { requestSubmitted: true, requiresSecondConfirmation };
  }

  /**
   * Grant access to an executor (called after two-person confirmation if required)
   */
  async grantAccess(
    assignmentId: string,
    grantedByExecutorId?: string // For two-person rule
  ): Promise<ExecutorAccessGrant> {
    const assignment = await this.prisma.executorAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        accountHolder: {
          select: { id: true, name: true },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Executor assignment not found');
    }

    // Generate secure time-limited access token
    const accessToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day access window

    await this.prisma.executorAssignment.update({
      where: { id: assignmentId },
      data: {
        accessGranted: true,
        accessGrantedAt: new Date(),
        accessExpiresAt: expiresAt,
        accessToken,
      },
    });

    await this.auditService.log({
      userId: assignment.userId,
      action: 'executor_access_granted',
      resource: 'executor_assignment',
      resourceId: assignmentId,
      metadata: {
        executorEmail: assignment.executorEmail,
        grantedByExecutorId,
        expiresAt: expiresAt.toISOString(),
      },
    });

    this.logger.log(
      `Access granted to executor ${assignment.executorEmail} for user ${assignment.userId}`
    );

    return {
      accessToken,
      expiresAt,
      accountHolder: {
        id: assignment.accountHolder.id,
        name: assignment.accountHolder.name,
      },
      readOnlyAccess: true,
    };
  }

  /**
   * Validate an executor access token
   */
  async validateAccessToken(
    accessToken: string
  ): Promise<{ valid: boolean; assignment?: { id: string; userId: string } }> {
    const assignment = await this.prisma.executorAssignment.findUnique({
      where: { accessToken },
    });

    if (!assignment) {
      return { valid: false };
    }

    if (!assignment.accessGranted || !assignment.accessExpiresAt) {
      return { valid: false };
    }

    if (new Date() > assignment.accessExpiresAt) {
      return { valid: false };
    }

    return {
      valid: true,
      assignment: {
        id: assignment.id,
        userId: assignment.userId,
      },
    };
  }

  /**
   * Revoke executor access (called by account holder if they return)
   */
  async revokeAccess(userId: string, assignmentId: string): Promise<{ revoked: boolean }> {
    const assignment = await this.prisma.executorAssignment.findFirst({
      where: { id: assignmentId, userId },
    });

    if (!assignment) {
      throw new NotFoundException('Executor assignment not found');
    }

    await this.prisma.executorAssignment.update({
      where: { id: assignmentId },
      data: {
        accessGranted: false,
        accessToken: null,
        accessExpiresAt: null,
      },
    });

    await this.auditService.log({
      userId,
      action: 'executor_access_revoked',
      resource: 'executor_assignment',
      resourceId: assignmentId,
      metadata: {
        executorEmail: assignment.executorEmail,
      },
    });

    this.logger.log(`Access revoked for executor ${assignment.executorEmail}`);
    return { revoked: true };
  }

  /**
   * Log an executor action for audit purposes
   */
  async logExecutorAction(
    assignmentId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.prisma.executorAccessLog.create({
      data: {
        executorAssignmentId: assignmentId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Get executor access audit log
   */
  async getAccessLog(
    userId: string,
    assignmentId?: string
  ): Promise<
    Array<{
      action: string;
      resource: string | null;
      createdAt: Date;
      executorEmail: string;
    }>
  > {
    const logs = await this.prisma.executorAccessLog.findMany({
      where: assignmentId
        ? { executorAssignmentId: assignmentId }
        : {
            executorAssignmentId: {
              in: await this.prisma.executorAssignment
                .findMany({ where: { userId }, select: { id: true } })
                .then((a) => a.map((x) => x.id)),
            },
          },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Get assignment details for each log
    const assignmentIds = [...new Set(logs.map((l) => l.executorAssignmentId))];
    const assignments = await this.prisma.executorAssignment.findMany({
      where: { id: { in: assignmentIds } },
      select: { id: true, executorEmail: true },
    });
    const assignmentMap = new Map(assignments.map((a) => [a.id, a.executorEmail]));

    return logs.map((log) => ({
      action: log.action,
      resource: log.resourceType,
      createdAt: log.createdAt,
      executorEmail: assignmentMap.get(log.executorAssignmentId) || 'unknown',
    }));
  }
}
