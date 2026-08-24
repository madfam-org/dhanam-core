// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { MailerService } from '@core/mailer/mailer.service';

import { AuditService } from '../../core/audit/audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PreferencesService } from '../preferences/preferences.service';

import {
  UpdateOnboardingStepDto,
  CompleteOnboardingDto,
  UpdatePreferencesDto,
  VerifyEmailDto,
  OnboardingStatusDto,
  OnboardingStep,
  ONBOARDING_STEPS,
} from './dto';
import { OnboardingAnalytics } from './onboarding.analytics';

interface OnboardingStepConfig {
  name: OnboardingStep;
  required: boolean;
  order: number;
  dependencies?: OnboardingStep[];
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  private readonly STEP_CONFIG: OnboardingStepConfig[] = [
    { name: 'welcome', required: true, order: 1 },
    { name: 'email_verification', required: true, order: 2 },
    { name: 'preferences', required: true, order: 3 },
    { name: 'space_setup', required: true, order: 4, dependencies: ['preferences'] },
    { name: 'connect_accounts', required: false, order: 5, dependencies: ['space_setup'] },
    { name: 'first_budget', required: false, order: 6, dependencies: ['space_setup'] },
    { name: 'feature_tour', required: false, order: 7 },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    // private readonly cryptoService: CryptoService,
    private readonly auditService: AuditService,
    private readonly jwtService: JwtService,
    private readonly emailService: MailerService,
    private readonly analytics: OnboardingAnalytics,
    private readonly preferencesService: PreferencesService
  ) {}

  async getOnboardingStatus(userId: string): Promise<OnboardingStatusDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSpaces: {
          include: {
            space: {
              include: {
                accounts: true,
                budgets: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stepStatus = await this.calculateStepStatus(user);
    const progress = this.calculateProgress(stepStatus);
    const remainingSteps = this.getRemainingSteps(stepStatus);
    const optionalSteps = this.getOptionalSteps();

    return {
      completed: user.onboardingCompleted,
      currentStep: (user.onboardingStep as OnboardingStep) || null,
      completedAt: user.onboardingCompletedAt?.toISOString() || null,
      progress,
      stepStatus,
      remainingSteps,
      optionalSteps,
    };
  }

  private async calculateStepStatus(user: any): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};

    // Welcome - always completed after registration
    status.welcome = true;

    // Email verification
    status.email_verification = user.emailVerified;

    // Preferences - check if user has customized beyond defaults
    status.preferences =
      user.locale !== 'es' ||
      user.timezone !== 'America/Mexico_City' ||
      user.userSpaces.some((us: any) => us.space.currency !== 'MXN');

    // Space setup - check if user has spaces configured
    status.space_setup = user.userSpaces.length > 0;

    // Add accounts - check if the user has added any accounts
    status.connect_accounts = user.userSpaces.some((us: any) => us.space.accounts.length > 0);

    // First budget - check if user has created budgets
    status.first_budget = user.userSpaces.some((us: any) => us.space.budgets.length > 0);

    // Feature tour - check onboarding completion or step tracking
    status.feature_tour = user.onboardingCompleted || user.onboardingStep === 'completed';

    return status;
  }

  private calculateProgress(stepStatus: Record<string, boolean>): number {
    const totalSteps = this.STEP_CONFIG.length;
    const completedSteps = Object.values(stepStatus).filter(Boolean).length;
    return Math.round((completedSteps / totalSteps) * 100);
  }

  private getRemainingSteps(stepStatus: Record<string, boolean>): string[] {
    return this.STEP_CONFIG.filter((config) => config.required && !stepStatus[config.name]).map(
      (config) => config.name
    );
  }

  private getOptionalSteps(): string[] {
    return this.STEP_CONFIG.filter((config) => !config.required).map((config) => config.name);
  }

  async updateOnboardingStep(
    userId: string,
    dto: UpdateOnboardingStepDto
  ): Promise<OnboardingStatusDto> {
    // Validate step exists
    if (!ONBOARDING_STEPS.includes(dto.step)) {
      throw new BadRequestException(`Invalid onboarding step: ${dto.step}`);
    }

    // Check step dependencies
    const stepConfig = this.STEP_CONFIG.find((s) => s.name === dto.step);
    if (stepConfig?.dependencies) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userSpaces: {
            include: {
              space: {
                include: {
                  accounts: true,
                  budgets: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const currentStatus = await this.calculateStepStatus(user);

      for (const dependency of stepConfig.dependencies) {
        if (!currentStatus[dependency]) {
          throw new BadRequestException(`Must complete ${dependency} step first`);
        }
      }
    }

    // Update user's current step
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStep: dto.step,
        updatedAt: new Date(),
      },
    });

    // Log step progression
    await this.auditService.logEvent({
      action: 'onboarding_step_updated',
      resource: 'user',
      resourceId: userId,
      userId,
      metadata: {
        step: dto.step,
        data: dto.data,
      },
    });

    // Track analytics
    await this.analytics.trackStepCompleted(userId, dto.step, undefined, dto.data);

    // Auto-complete if user reaches completed step
    if (dto.step === 'completed') {
      return await this.completeOnboarding(userId, {});
    }

    return await this.getOnboardingStatus(userId);
  }

  async completeOnboarding(
    userId: string,
    dto: CompleteOnboardingDto
  ): Promise<OnboardingStatusDto> {
    const completedAt = new Date();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: completedAt,
        onboardingStep: 'completed',
        updatedAt: completedAt,
      },
    });

    // Send completion email
    try {
      await this.emailService.sendOnboardingComplete(userId, {
        skipOptional: dto.skipOptional || false,
        completedAt: completedAt.toISOString(),
        metadata: dto.metadata || {},
      });
    } catch (error) {
      this.logger.error('Failed to send onboarding completion email:', error);
    }

    // Log completion
    await this.auditService.logEvent({
      action: 'onboarding_completed',
      resource: 'user',
      resourceId: userId,
      userId,
      metadata: {
        skipOptional: dto.skipOptional,
        completedAt: completedAt.toISOString(),
        ...dto.metadata,
      },
    });

    // Track analytics
    const totalTime = dto.metadata?.timeSpent || undefined;
    await this.analytics.trackOnboardingCompleted(userId, totalTime);

    this.logger.log(`User ${userId} completed onboarding`);
    return await this.getOnboardingStatus(userId);
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto
  ): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userSpaces: { include: { space: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user basic preferences
    const updateData: any = {};
    if (dto.locale) updateData.locale = dto.locale;
    if (dto.timezone) updateData.timezone = dto.timezone;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // Update space currency if specified
    if (dto.currency) {
      const personalSpace = user.userSpaces.find((us) => us.space.type === 'personal')?.space;
      if (personalSpace) {
        await this.prisma.space.update({
          where: { id: personalSpace.id },
          data: { currency: dto.currency },
        });
      }
    }

    // Update detailed preferences using preferences service
    if (
      dto.emailNotifications !== undefined ||
      dto.transactionAlerts !== undefined ||
      dto.budgetAlerts !== undefined ||
      dto.weeklyReports !== undefined ||
      dto.monthlyReports !== undefined
    ) {
      await this.preferencesService.updateUserPreferences(userId, {
        emailNotifications: dto.emailNotifications,
        transactionAlerts: dto.transactionAlerts,
        budgetAlerts: dto.budgetAlerts,
        weeklyReports: dto.weeklyReports,
        monthlyReports: dto.monthlyReports,
        defaultCurrency: dto.currency,
      });
    }

    // Track analytics for preferences update
    await this.analytics.trackPreferencesUpdated(userId, dto);

    return { success: true };
  }

  async sendEmailVerification(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      return { success: false, message: 'Email already verified' };
    }

    // Generate verification token
    const verificationToken = this.jwtService.sign(
      { userId, email: user.email, type: 'email_verification' },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '24h',
      }
    );

    // Send verification email
    await this.emailService.sendEmailVerification(userId, {
      verificationToken,
      verificationUrl: `${this.configService.get('WEB_URL')}/verify-email?token=${verificationToken}`,
    });

    // Log verification sent
    await this.auditService.logEvent({
      action: 'email_verification_sent',
      resource: 'user',
      resourceId: userId,
      userId,
      metadata: { email: user.email },
    });

    // Track analytics
    await this.analytics.trackEmailVerificationSent(userId, user.email);

    return { success: true, message: 'Verification email sent' };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ success: boolean; message: string }> {
    try {
      const payload = this.jwtService.verify(dto.token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if (payload.type !== 'email_verification' || !payload.userId) {
        throw new BadRequestException('Invalid verification token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.email !== payload.email) {
        throw new BadRequestException('Token email mismatch');
      }

      if (user.emailVerified) {
        return { success: false, message: 'Email already verified' };
      }

      // Mark email as verified
      await this.prisma.user.update({
        where: { id: payload.userId },
        data: {
          emailVerified: true,
          updatedAt: new Date(),
        },
      });

      // Log verification
      await this.auditService.logEvent({
        action: 'email_verified',
        resource: 'user',
        resourceId: payload.userId,
        userId: payload.userId,
        metadata: { email: user.email },
      });

      // Track analytics
      await this.analytics.trackEmailVerificationCompleted(payload.userId, user.email);

      // Auto-advance onboarding step if user is on email verification
      if (user.onboardingStep === 'email_verification') {
        await this.updateOnboardingStep(payload.userId, { step: 'preferences' });
      }

      this.logger.log(`Email verified for user ${payload.userId}`);
      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')
      ) {
        throw new BadRequestException('Invalid or expired verification token');
      }
      throw error;
    }
  }

  async skipOnboardingStep(userId: string, step: OnboardingStep): Promise<OnboardingStatusDto> {
    const stepConfig = this.STEP_CONFIG.find((s) => s.name === step);

    if (!stepConfig) {
      throw new BadRequestException(`Invalid step: ${step}`);
    }

    if (stepConfig.required) {
      throw new BadRequestException(`Cannot skip required step: ${step}`);
    }

    // Log step skip
    await this.auditService.logEvent({
      action: 'onboarding_step_skipped',
      resource: 'user',
      resourceId: userId,
      userId,
      metadata: { step },
    });

    // Find next step
    const currentOrder = stepConfig.order;
    const nextStep = this.STEP_CONFIG.filter((s) => s.order > currentOrder).sort(
      (a, b) => a.order - b.order
    )[0];

    if (nextStep) {
      return await this.updateOnboardingStep(userId, { step: nextStep.name });
    } else {
      return await this.completeOnboarding(userId, { skipOptional: true });
    }
  }

  async resetOnboarding(userId: string): Promise<OnboardingStatusDto> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: false,
        onboardingCompletedAt: null,
        onboardingStep: 'welcome',
        updatedAt: new Date(),
      },
    });

    // Log reset
    await this.auditService.logEvent({
      action: 'onboarding_reset',
      resource: 'user',
      resourceId: userId,
      userId,
    });

    return await this.getOnboardingStatus(userId);
  }
}
