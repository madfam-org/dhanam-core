// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';

export const ONBOARDING_STEPS = [
  'welcome',
  'email_verification',
  'preferences',
  'space_setup',
  'connect_accounts',
  'first_budget',
  'feature_tour',
  'completed',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export class UpdateOnboardingStepDto {
  @ApiProperty({
    description: 'Current onboarding step',
    enum: ONBOARDING_STEPS,
    example: 'preferences',
  })
  @IsString()
  @IsIn(ONBOARDING_STEPS)
  step: OnboardingStep;

  @ApiProperty({
    description: 'Step-specific data',
    example: { completed: true, skipped: false },
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}