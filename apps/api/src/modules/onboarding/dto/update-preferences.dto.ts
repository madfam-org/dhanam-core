// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

import { Currency } from '@db';

export class OnboardingUpdatePreferencesDto {
  @ApiProperty({
    description: 'User preferred language',
    example: 'es',
    enum: ['es', 'en'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['es', 'en'])
  locale?: string;

  @ApiProperty({
    description: 'User timezone',
    example: 'America/Mexico_City',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    description: 'Preferred currency for display',
    enum: Currency,
    example: 'MXN',
    required: false,
  })
  @IsOptional()
  @IsIn(Object.values(Currency))
  currency?: Currency;

  @ApiProperty({
    description: 'Enable email notifications',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({
    description: 'Enable transaction categorization alerts',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  transactionAlerts?: boolean;

  @ApiProperty({
    description: 'Enable budget limit notifications',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  budgetAlerts?: boolean;

  @ApiProperty({
    description: 'Enable weekly summary emails',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  weeklyReports?: boolean;

  @ApiProperty({
    description: 'Enable monthly detailed reports',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  monthlyReports?: boolean;
}