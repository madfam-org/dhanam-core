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
  ApiOkResponse,
  ApiBody,
  ApiResponse,
  ApiQuery,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { DocumentService, ConfirmUploadDto } from './document.service';
import {
  CreateManualAssetDto,
  UpdateManualAssetDto,
  ManualAssetResponseDto,
  ManualAssetSummaryDto,
  AddValuationDto,
  ManualAssetValuationDto,
} from './dto';
import { ManualAssetsService } from './manual-assets.service';
import { PEAnalyticsService, CreatePECashFlowDto } from './pe-analytics.service';

@ApiTags('manual-assets')
@Controller('spaces/:spaceId/manual-assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
@ApiForbiddenResponse({ description: 'User lacks access to this resource' })
export class ManualAssetsController {
  constructor(
    private readonly manualAssetsService: ManualAssetsService,
    private readonly peAnalyticsService: PEAnalyticsService,
    private readonly documentService: DocumentService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all manual assets in a space' })
  @ApiOkResponse({ type: [ManualAssetResponseDto] })
  findAll(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.manualAssetsService.findAll(spaceId, req.user!.id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get manual assets summary with totals by type' })
  @ApiOkResponse({ type: ManualAssetSummaryDto })
  getSummary(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.manualAssetsService.getSummary(spaceId, req.user!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a manual asset by id' })
  @ApiOkResponse({ type: ManualAssetResponseDto })
  @ApiNotFoundResponse({ description: 'Manual asset not found' })
  @ApiParam({ name: 'id', description: 'Manual asset ID' })
  findOne(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.manualAssetsService.findOne(spaceId, req.user!.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new manual asset' })
  @ApiOkResponse({ type: ManualAssetResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  create(
    @Param('spaceId') spaceId: string,
    @Body() createManualAssetDto: CreateManualAssetDto,
    @Req() req: Request
  ) {
    return this.manualAssetsService.create(spaceId, req.user!.id, createManualAssetDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a manual asset' })
  @ApiOkResponse({ type: ManualAssetResponseDto })
  @ApiNotFoundResponse({ description: 'Manual asset not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiParam({ name: 'id', description: 'Manual asset ID' })
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() updateManualAssetDto: UpdateManualAssetDto,
    @Req() req: Request
  ) {
    return this.manualAssetsService.update(spaceId, req.user!.id, id, updateManualAssetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a manual asset' })
  @ApiNotFoundResponse({ description: 'Manual asset not found' })
  @ApiParam({ name: 'id', description: 'Manual asset ID' })
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.manualAssetsService.remove(spaceId, req.user!.id, id);
  }

  @Post(':id/valuations')
  @ApiOperation({ summary: 'Add a valuation entry to track asset value over time' })
  @ApiOkResponse({ type: ManualAssetValuationDto })
  @ApiNotFoundResponse({ description: 'Manual asset not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiParam({ name: 'id', description: 'Manual asset ID' })
  addValuation(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() addValuationDto: AddValuationDto,
    @Req() req: Request
  ) {
    return this.manualAssetsService.addValuation(spaceId, req.user!.id, id, addValuationDto);
  }

  // ==================== Private Equity Endpoints ====================

  @Get('pe/portfolio')
  @ApiOperation({
    summary: 'Get PE portfolio summary',
    description:
      'Returns aggregated performance metrics for all private equity and angel investments in the space',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio summary with TVPI, DPI, IRR and per-asset breakdown',
  })
  getPEPortfolioSummary(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.peAnalyticsService.getPortfolioSummary(spaceId, req.user!.id);
  }

  @Get(':id/performance')
  @ApiOperation({
    summary: 'Get PE performance metrics',
    description:
      'Returns IRR, TVPI, DPI, RVPI and other performance metrics for a private equity asset',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics including IRR, multiples, and cash flow summary',
  })
  @ApiNotFoundResponse({ description: 'PE asset not found' })
  @ApiParam({ name: 'id', description: 'PE asset ID' })
  getPEPerformance(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: Request
  ) {
    return this.peAnalyticsService.getPerformance(spaceId, req.user!.id, id);
  }

  @Get(':id/cash-flows')
  @ApiOperation({
    summary: 'Get cash flows for a PE asset',
    description: 'Returns all capital calls, distributions, and fees for a private equity asset',
  })
  @ApiResponse({
    status: 200,
    description: 'List of cash flows ordered by date',
  })
  @ApiNotFoundResponse({ description: 'PE asset not found' })
  @ApiParam({ name: 'id', description: 'PE asset ID' })
  getPECashFlows(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.peAnalyticsService.getCashFlows(spaceId, req.user!.id, id);
  }

  @Post(':id/cash-flows')
  @ApiOperation({
    summary: 'Add a cash flow to a PE asset',
    description:
      'Record a capital call, distribution, management fee, or carried interest for a private equity asset',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'amount', 'currency', 'date'],
      properties: {
        type: {
          type: 'string',
          enum: ['capital_call', 'distribution', 'management_fee', 'carry', 'recallable'],
          description: 'Type of cash flow',
        },
        amount: { type: 'number', description: 'Cash flow amount (always positive)' },
        currency: { type: 'string', enum: ['USD', 'MXN', 'EUR'] },
        date: { type: 'string', format: 'date', description: 'Date of cash flow' },
        description: { type: 'string', description: 'Optional description' },
        notes: { type: 'string', description: 'Optional notes' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Cash flow created successfully',
  })
  @ApiNotFoundResponse({ description: 'PE asset not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiParam({ name: 'id', description: 'PE asset ID' })
  addPECashFlow(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: CreatePECashFlowDto,
    @Req() req: Request
  ) {
    return this.peAnalyticsService.addCashFlow(spaceId, req.user!.id, id, dto);
  }

  @Delete(':id/cash-flows/:cashFlowId')
  @ApiOperation({
    summary: 'Delete a cash flow from a PE asset',
    description: 'Remove a capital call, distribution, or fee record',
  })
  @ApiResponse({
    status: 200,
    description: 'Cash flow deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'PE asset or cash flow not found' })
  @ApiParam({ name: 'id', description: 'PE asset ID' })
  @ApiParam({ name: 'cashFlowId', description: 'Cash flow ID' })
  deletePECashFlow(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Param('cashFlowId') cashFlowId: string,
    @Req() req: Request
  ) {
    return this.peAnalyticsService.deleteCashFlow(spaceId, req.user!.id, id, cashFlowId);
  }

  // ==================== Document Management Endpoints ====================

  @Get('document-config')
  @ApiOperation({
    summary: 'Get document upload configuration',
    description: 'Returns allowed file types, categories, and storage availability',
  })
  getDocumentConfig() {
    return {
      available: this.documentService.isStorageAvailable(),
      allowedFileTypes: this.documentService.getAllowedFileTypes(),
      categories: this.documentService.getDocumentCategories(),
      maxFileSizeMB: 50,
    };
  }

  @Get(':id/documents')
  @ApiOperation({
    summary: 'Get all documents for an asset',
    description: 'Returns list of uploaded documents with metadata',
  })
  @ApiNotFoundResponse({ description: 'Asset not found' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  getDocuments(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.documentService.getDocuments(spaceId, req.user!.id, id);
  }

  @Post(':id/documents/upload-url')
  @ApiOperation({
    summary: 'Get presigned URL for document upload',
    description: 'Returns a presigned URL for direct browser upload to R2 storage',
  })
  @ApiQuery({ name: 'filename', required: true, description: 'Original filename' })
  @ApiQuery({ name: 'contentType', required: true, description: 'MIME type of the file' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Document category (deed, title, appraisal, etc.)',
  })
  @ApiNotFoundResponse({ description: 'Asset not found' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  getUploadUrl(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
    @Query('category') category: string = 'general',
    @Req() req: Request
  ) {
    return this.documentService.getUploadUrl(
      spaceId,
      req.user!.id,
      id,
      filename,
      contentType,
      category
    );
  }

  @Post(':id/documents/confirm')
  @ApiOperation({
    summary: 'Confirm document upload completion',
    description: 'Call after successful upload to add document to asset record',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['key', 'filename', 'fileType', 'fileSize'],
      properties: {
        key: { type: 'string', description: 'Storage key returned from upload-url' },
        filename: { type: 'string', description: 'Original filename' },
        fileType: { type: 'string', description: 'MIME type' },
        fileSize: { type: 'number', description: 'File size in bytes' },
        category: { type: 'string', description: 'Document category' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Asset not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  confirmUpload(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmUploadDto,
    @Req() req: Request
  ) {
    return this.documentService.confirmUpload(spaceId, req.user!.id, id, dto);
  }

  @Get(':id/documents/:documentKey/download-url')
  @ApiOperation({
    summary: 'Get presigned URL for document download',
    description: 'Returns a time-limited URL for downloading the document',
  })
  @ApiNotFoundResponse({ description: 'Asset or document not found' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiParam({ name: 'documentKey', description: 'Document storage key' })
  getDownloadUrl(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Param('documentKey') documentKey: string,
    @Req() req: Request
  ) {
    // Decode the key since it may contain slashes
    const decodedKey = decodeURIComponent(documentKey);
    return this.documentService.getDownloadUrl(spaceId, req.user!.id, id, decodedKey);
  }

  @Delete(':id/documents/:documentKey')
  @ApiOperation({
    summary: 'Delete a document from an asset',
    description: 'Removes document from both storage and asset record',
  })
  @ApiNotFoundResponse({ description: 'Asset or document not found' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiParam({ name: 'documentKey', description: 'Document storage key' })
  deleteDocument(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Param('documentKey') documentKey: string,
    @Req() req: Request
  ) {
    const decodedKey = decodeURIComponent(documentKey);
    return this.documentService.deleteDocument(spaceId, req.user!.id, id, decodedKey);
  }
}
