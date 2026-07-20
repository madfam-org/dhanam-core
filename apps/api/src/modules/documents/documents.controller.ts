// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { CsvImportService } from './csv-import.service';
import { DocumentsService } from './documents.service';
import {
  RequestUploadUrlDto,
  ConfirmUploadDto,
  ImportCsvTransactionsDto,
  ListDocumentsQueryDto,
  UpdateCsvMappingDto,
} from './dto';

@ApiTags('documents')
@Controller('spaces/:spaceId/documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly csvImportService: CsvImportService
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Request a presigned upload URL',
    description:
      'Creates a pending document record and returns a presigned URL for direct upload to R2',
  })
  @ApiBadRequestResponse({ description: 'Invalid file type or quota exceeded' })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  requestUploadUrl(
    @Param('spaceId') spaceId: string,
    @Body() dto: RequestUploadUrlDto,
    @Req() req: Request
  ) {
    return this.documentsService.requestUploadUrl(spaceId, req.user!.id, dto, false);
  }

  @Post(':id/confirm')
  @ApiOperation({
    summary: 'Confirm document upload',
    description:
      'Verifies the file was uploaded to R2, enforces quota, and triggers CSV preview for CSV files',
  })
  @ApiNotFoundResponse({ description: 'Document not found' })
  @ApiBadRequestResponse({ description: 'File not found in storage or quota exceeded' })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  confirmUpload(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmUploadDto,
    @Req() req: Request
  ) {
    return this.documentsService.confirmUpload(spaceId, req.user!.id, id, dto, false);
  }

  @Get()
  @ApiOperation({
    summary: 'List documents for a space',
    description: 'Paginated list with optional category, status, and content type filters',
  })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  findAll(
    @Param('spaceId') spaceId: string,
    @Query() query: ListDocumentsQueryDto,
    @Req() req: Request
  ) {
    return this.documentsService.findAll(spaceId, req.user!.id, query);
  }

  @Get('storage')
  @ApiOperation({
    summary: 'Get storage usage for a space',
    description: 'Returns used bytes, limit, remaining, and document count',
  })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  getStorageUsage(@Param('spaceId') spaceId: string) {
    return this.documentsService.getStorageUsage(spaceId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single document',
    description: 'Returns full document metadata including CSV preview if available',
  })
  @ApiNotFoundResponse({ description: 'Document not found' })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  findOne(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.documentsService.findOne(spaceId, req.user!.id, id);
  }

  @Get(':id/download-url')
  @ApiOperation({
    summary: 'Get a presigned download URL',
    description: 'Returns a time-limited URL for downloading the document from R2',
  })
  @ApiNotFoundResponse({ description: 'Document not found' })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  getDownloadUrl(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.documentsService.getDownloadUrl(spaceId, req.user!.id, id);
  }

  @Patch(':id/csv-mapping')
  @ApiOperation({
    summary: 'Update CSV column mapping',
    description: 'Save column mapping configuration for future transaction import from this CSV',
  })
  @ApiNotFoundResponse({ description: 'Document not found' })
  @ApiBadRequestResponse({ description: 'Document is not a CSV' })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  updateCsvMapping(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCsvMappingDto,
    @Req() req: Request
  ) {
    return this.documentsService.updateCsvMapping(spaceId, req.user!.id, id, dto);
  }

  @Post(':id/import')
  @ApiOperation({
    summary: 'Import transactions from a mapped CSV document',
    description:
      'Executes the saved CSV column mapping against the stored file and creates deduplicated ' +
      'Transaction rows on the target account. Re-running the import creates nothing new.',
  })
  @ApiNotFoundResponse({ description: 'Document not found' })
  @ApiBadRequestResponse({ description: 'Missing CSV mapping, missing accountId, or not a CSV' })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  importTransactions(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: ImportCsvTransactionsDto,
    @Req() req: Request
  ) {
    return this.csvImportService.importTransactions(spaceId, req.user!.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a document',
    description: 'Soft-deletes the document record and removes the file from R2 storage',
  })
  @ApiNotFoundResponse({ description: 'Document not found' })
  @ApiParam({ name: 'spaceId', description: 'Space ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  deleteDocument(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.documentsService.deleteDocument(spaceId, req.user!.id, id);
  }
}