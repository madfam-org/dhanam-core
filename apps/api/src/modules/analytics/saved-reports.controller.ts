// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { CreateSavedReportDto, UpdateSavedReportDto } from './dto';
import { ReportArchiveService } from './report-archive.service';
import { SavedReportService } from './saved-report.service';

@ApiTags('Saved Reports')
@ApiBearerAuth()
@Controller('reports/saved')
@UseGuards(JwtAuthGuard)
export class SavedReportsController {
  constructor(
    private readonly savedReportService: SavedReportService,
    private readonly reportArchiveService: ReportArchiveService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a saved report configuration' })
  @ApiCreatedResponse({ description: 'Saved report created' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateSavedReportDto) {
    return this.savedReportService.create(userId, dto);
  }

  @Get('space/:spaceId')
  @ApiOperation({ summary: 'List saved reports for a space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'List of saved reports' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async findAll(@CurrentUser('id') userId: string, @Param('spaceId') spaceId: string) {
    return this.savedReportService.findAll(userId, spaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get saved report details' })
  @ApiParam({ name: 'id', description: 'Saved report ID' })
  @ApiOkResponse({ description: 'Saved report details with recent history' })
  @ApiNotFoundResponse({ description: 'Report not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.savedReportService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update saved report configuration' })
  @ApiParam({ name: 'id', description: 'Saved report ID' })
  @ApiOkResponse({ description: 'Saved report updated' })
  @ApiNotFoundResponse({ description: 'Report not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSavedReportDto
  ) {
    return this.savedReportService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saved report' })
  @ApiParam({ name: 'id', description: 'Saved report ID' })
  @ApiNoContentResponse({ description: 'Saved report deleted' })
  @ApiNotFoundResponse({ description: 'Report not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.savedReportService.delete(userId, id);
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Generate a report now and archive to R2' })
  @ApiParam({ name: 'id', description: 'Saved report ID' })
  @ApiCreatedResponse({ description: 'Report generated with download URL' })
  @ApiNotFoundResponse({ description: 'Report not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async generate(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reportArchiveService.generateAndArchive(id, userId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'List generated report history' })
  @ApiParam({ name: 'id', description: 'Saved report ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'List of generated reports' })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('limit') limit?: string
  ) {
    await this.savedReportService.verifyAccess(userId, id, ['viewer', 'editor', 'manager']);
    return this.reportArchiveService.getHistory(id, limit ? parseInt(limit) : 20);
  }

  @Get('generated/:generatedId/download')
  @ApiOperation({ summary: 'Download a specific generated report' })
  @ApiParam({ name: 'generatedId', description: 'Generated report ID' })
  @ApiOkResponse({ description: 'Presigned download URL' })
  @ApiNotFoundResponse({ description: 'Generated report not found' })
  async download(@CurrentUser('id') userId: string, @Param('generatedId') generatedId: string) {
    return this.reportArchiveService.getDownloadUrl(generatedId, userId);
  }
}
