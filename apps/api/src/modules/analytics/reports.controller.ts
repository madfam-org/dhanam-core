// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { Response } from 'express';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { SpacesService } from '../spaces/spaces.service';

import { ReportService } from './report.service';

class GenerateReportDto {
  @IsString()
  spaceId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsEnum(['pdf', 'csv', 'excel', 'json'])
  format?: 'pdf' | 'csv' | 'excel' | 'json';
}

class ReportListItem {
  id!: string;
  name!: string;
  type!: string;
  createdAt!: string;
}

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportService: ReportService,
    private readonly spacesService: SpacesService
  ) {}

  @Get(':spaceId')
  @ApiOperation({ summary: 'Get available report types for a space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'List of available report types' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getAvailableReports(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string
  ): Promise<{ reports: ReportListItem[] }> {
    // Verify user has access to space
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    // Return available report types
    const reports: ReportListItem[] = [
      {
        id: 'financial-summary',
        name: 'Financial Summary Report',
        type: 'pdf',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'transaction-export',
        name: 'Transaction Export',
        type: 'csv',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'budget-performance',
        name: 'Budget Performance Report',
        type: 'pdf',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'net-worth-trend',
        name: 'Net Worth Trend Report',
        type: 'pdf',
        createdAt: new Date().toISOString(),
      },
    ];

    return { reports };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a financial report' })
  @ApiOkResponse({ description: 'Report generated successfully (PDF or CSV)' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid date range or format' })
  async generateReport(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateReportDto,
    @Res() res: Response
  ): Promise<void> {
    // Verify user has access to space
    await this.spacesService.verifyUserAccess(userId, dto.spaceId, 'viewer');

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const format = dto.format || 'pdf';

    if (format === 'csv') {
      const csv = await this.reportService.generateCsvExport(dto.spaceId, startDate, endDate);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dhanam-export-${dto.startDate}-to-${dto.endDate}.csv"`
      );
      res.status(HttpStatus.OK).send(csv);
    } else if (format === 'excel') {
      const excel = await this.reportService.generateExcelExport(dto.spaceId, startDate, endDate);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dhanam-export-${dto.startDate}-to-${dto.endDate}.xlsx"`
      );
      res.status(HttpStatus.OK).send(excel);
    } else if (format === 'json') {
      const json = await this.reportService.generateJsonExport(dto.spaceId, startDate, endDate);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dhanam-export-${dto.startDate}-to-${dto.endDate}.json"`
      );
      res.status(HttpStatus.OK).send(json);
    } else {
      const pdf = await this.reportService.generatePdfReport(dto.spaceId, startDate, endDate);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="dhanam-report-${dto.startDate}-to-${dto.endDate}.pdf"`
      );
      res.status(HttpStatus.OK).send(pdf);
    }
  }

  @Get(':spaceId/download/pdf')
  @ApiOperation({ summary: 'Download PDF report' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiOkResponse({ description: 'PDF report file' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid date parameters' })
  async downloadPdfReport(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response
  ): Promise<void> {
    // Verify user has access to space
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const pdf = await this.reportService.generatePdfReport(
      spaceId,
      new Date(startDate),
      new Date(endDate)
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dhanam-report-${startDate}-to-${endDate}.pdf"`
    );
    res.status(HttpStatus.OK).send(pdf);
  }

  @Get(':spaceId/download/csv')
  @ApiOperation({ summary: 'Download CSV export' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiOkResponse({ description: 'CSV export file' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid date parameters' })
  async downloadCsvExport(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response
  ): Promise<void> {
    // Verify user has access to space
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const csv = await this.reportService.generateCsvExport(
      spaceId,
      new Date(startDate),
      new Date(endDate)
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dhanam-export-${startDate}-to-${endDate}.csv"`
    );
    res.status(HttpStatus.OK).send(csv);
  }

  @Get(':spaceId/download/excel')
  @ApiOperation({ summary: 'Download Excel export' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiOkResponse({ description: 'Excel export file' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid date parameters' })
  async downloadExcelExport(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response
  ): Promise<void> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const excel = await this.reportService.generateExcelExport(
      spaceId,
      new Date(startDate),
      new Date(endDate)
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dhanam-export-${startDate}-to-${endDate}.xlsx"`
    );
    res.status(HttpStatus.OK).send(excel);
  }

  @Get(':spaceId/download/json')
  @ApiOperation({ summary: 'Download JSON export' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiOkResponse({ description: 'JSON export file' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  @ApiBadRequestResponse({ description: 'Invalid date parameters' })
  async downloadJsonExport(
    @CurrentUser('id') userId: string,
    @Param('spaceId') spaceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response
  ): Promise<void> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const json = await this.reportService.generateJsonExport(
      spaceId,
      new Date(startDate),
      new Date(endDate)
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dhanam-export-${startDate}-to-${endDate}.json"`
    );
    res.status(HttpStatus.OK).send(json);
  }
}