// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsObject, IsBoolean } from 'class-validator';

export class CompleteOnboardingDto {
  @ApiProperty({
    description: 'Whether to skip remaining optional steps',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  skipOptional?: boolean;

  @ApiProperty({
    description: 'Final completion metadata',
    example: { source: 'web', timeSpent: 300 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
