// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { UpdatePreferencesDto, PreferencesResponseDto, BulkPreferencesUpdateDto } from './dto';
import { PreferencesService } from './preferences.service';

@ApiTags('Preferences')
@ApiBearerAuth()
@Controller('preferences')
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiOkResponse({ description: 'User preferences retrieved successfully' })
  async getUserPreferences(@CurrentUser('id') userId: string): Promise<PreferencesResponseDto> {
    return this.preferencesService.getUserPreferences(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get preferences summary' })
  @ApiOkResponse({ description: 'Preferences summary retrieved successfully' })
  async getPreferencesSummary(@CurrentUser('id') userId: string) {
    return this.preferencesService.getPreferencesSummary(userId);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiOkResponse({ description: 'Preferences updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid preferences data' })
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePreferencesDto
  ): Promise<PreferencesResponseDto> {
    return this.preferencesService.updateUserPreferences(userId, dto);
  }

  @Put('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update user preferences' })
  @ApiOkResponse({ description: 'Preferences bulk updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid preferences data' })
  async bulkUpdatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkPreferencesUpdateDto
  ): Promise<PreferencesResponseDto> {
    return this.preferencesService.bulkUpdatePreferences(userId, dto);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user preferences to defaults' })
  @ApiOkResponse({ description: 'Preferences reset successfully' })
  async resetPreferences(@CurrentUser('id') userId: string): Promise<PreferencesResponseDto> {
    return this.preferencesService.resetPreferences(userId);
  }
}