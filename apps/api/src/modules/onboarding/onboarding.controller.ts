// SPDX-License-Identifier: AGPL-3.0-or-later
import { User } from '@dhanam-core/shared';
import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import {
  UpdateOnboardingStepDto,
  CompleteOnboardingDto,
  UpdatePreferencesDto,
  VerifyEmailDto,
  OnboardingStatusDto,
  OnboardingStep,
} from './dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('Onboarding')
@Controller('onboarding')
@ApiBearerAuth()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user onboarding status and progress' })
  @ApiOkResponse({
    description: 'Onboarding status retrieved successfully',
    type: OnboardingStatusDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getOnboardingStatus(@CurrentUser() user: User): Promise<OnboardingStatusDto> {
    return await this.onboardingService.getOnboardingStatus(user.id);
  }

  @Put('step')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current onboarding step' })
  @ApiOkResponse({ description: 'Onboarding step updated successfully', type: OnboardingStatusDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBadRequestResponse({ description: 'Invalid step data' })
  async updateOnboardingStep(
    @CurrentUser() user: User,
    @Body() dto: UpdateOnboardingStepDto
  ): Promise<OnboardingStatusDto> {
    return await this.onboardingService.updateOnboardingStep(user.id, dto);
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark onboarding as completed' })
  @ApiOkResponse({ description: 'Onboarding completed successfully', type: OnboardingStatusDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async completeOnboarding(
    @CurrentUser() user: User,
    @Body() dto: CompleteOnboardingDto
  ): Promise<OnboardingStatusDto> {
    return await this.onboardingService.completeOnboarding(user.id, dto);
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user preferences during onboarding' })
  @ApiOkResponse({ description: 'Preferences updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBadRequestResponse({ description: 'Invalid preferences data' })
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdatePreferencesDto
  ): Promise<{ success: boolean }> {
    return await this.onboardingService.updatePreferences(user.id, dto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify user email address' })
  @ApiOkResponse({ description: 'Email verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid verification token' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ success: boolean; message: string }> {
    return await this.onboardingService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiOkResponse({ description: 'Verification email sent' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async resendEmailVerification(
    @CurrentUser() user: User
  ): Promise<{ success: boolean; message: string }> {
    return await this.onboardingService.sendEmailVerification(user.id);
  }

  @Post('skip/:step')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Skip an optional onboarding step' })
  @ApiParam({ name: 'step', description: 'Onboarding step to skip' })
  @ApiOkResponse({ description: 'Step skipped successfully', type: OnboardingStatusDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiBadRequestResponse({ description: 'Step cannot be skipped' })
  async skipOnboardingStep(
    @CurrentUser() user: User,
    @Param('step') step: OnboardingStep
  ): Promise<OnboardingStatusDto> {
    return await this.onboardingService.skipOnboardingStep(user.id, step);
  }

  @Post('reset')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reset onboarding progress (for testing/support)' })
  @ApiOkResponse({ description: 'Onboarding reset successfully', type: OnboardingStatusDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async resetOnboarding(@CurrentUser() user: User): Promise<OnboardingStatusDto> {
    return await this.onboardingService.resetOnboarding(user.id);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check onboarding service health' })
  @ApiOkResponse({ description: 'Service health status' })
  getHealth() {
    return {
      service: 'onboarding',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      features: {
        stepTracking: true,
        emailVerification: true,
        progressTracking: true,
        preferenceManagement: true,
      },
    };
  }
}