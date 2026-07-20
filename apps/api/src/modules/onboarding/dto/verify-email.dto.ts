// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({
    description: 'User ID to resend verification for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  userId: string;
}