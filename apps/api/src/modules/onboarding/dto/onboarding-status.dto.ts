// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from '@nestjs/swagger';

import { OnboardingStep } from './update-onboarding-step.dto';

export class OnboardingStatusDto {
  @ApiProperty({
    description: 'Whether onboarding is completed',
    example: false,
  })
  completed: boolean;

  @ApiProperty({
    description: 'Current onboarding step',
    enum: [
      'welcome',
      'email_verification',
      'preferences',
      'space_setup',
      'connect_accounts',
      'first_budget',
      'feature_tour',
      'completed',
    ],
    example: 'preferences',
  })
  currentStep: OnboardingStep | null;

  @ApiProperty({
    description: 'Completion timestamp',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  completedAt: string | null;

  @ApiProperty({
    description: 'Overall onboarding progress percentage',
    example: 42.5,
  })
  progress: number;

  @ApiProperty({
    description: 'Step completion status',
    example: {
      welcome: true,
      email_verification: true,
      preferences: false,
      space_setup: false,
      connect_accounts: false,
      first_budget: false,
      feature_tour: false,
    },
  })
  stepStatus: Record<string, boolean>;

  @ApiProperty({
    description: 'Required steps remaining',
    example: ['preferences', 'space_setup'],
  })
  remainingSteps: string[];

  @ApiProperty({
    description: 'Optional steps that can be skipped',
    example: ['connect_accounts', 'feature_tour'],
  })
  optionalSteps: string[];
}