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
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { CreateTransactionDto, UpdateTransactionDto, TransactionsFilterDto } from './dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@Controller('spaces/:spaceId/transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions in a space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'List of transactions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findAll(
    @Param('spaceId') spaceId: string,
    @Query() filter: TransactionsFilterDto,
    @Req() req: Request
  ) {
    return this.transactionsService.findAll(spaceId, req.user!.id, filter);
  }

  @Get('unreviewed-count')
  @ApiOperation({ summary: 'Get count of unreviewed transactions' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Unreviewed transaction count' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  getUnreviewedCount(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.transactionsService.getUnreviewedCount(spaceId, req.user!.id);
  }

  @Get('merchants')
  @ApiOperation({ summary: 'Get aggregated merchant list with transaction counts' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'List of merchants with counts' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  getMerchants(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.transactionsService.getMerchants(spaceId, req.user!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by id' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiOkResponse({ description: 'Transaction details' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findOne(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.transactionsService.findOne(spaceId, req.user!.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Transaction created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  create(
    @Param('spaceId') spaceId: string,
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: Request
  ) {
    return this.transactionsService.create(spaceId, req.user!.id, createTransactionDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiOkResponse({ description: 'Transaction updated successfully' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Req() req: Request
  ) {
    return this.transactionsService.update(spaceId, req.user!.id, id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiOkResponse({ description: 'Transaction deleted successfully' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.transactionsService.remove(spaceId, req.user!.id, id);
  }

  @Post('bulk-categorize')
  @ApiOperation({ summary: 'Bulk categorize transactions' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Transactions categorized successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body or transaction IDs' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  bulkCategorize(
    @Param('spaceId') spaceId: string,
    @Body() body: { transactionIds: string[]; categoryId: string },
    @Req() req: Request
  ) {
    return this.transactionsService.bulkCategorize(
      spaceId,
      req.user!.id,
      body.transactionIds,
      body.categoryId
    );
  }

  @Post('bulk-review')
  @ApiOperation({ summary: 'Bulk review/unreview transactions' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Transactions review status updated' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  bulkReview(
    @Param('spaceId') spaceId: string,
    @Body() body: { transactionIds: string[]; reviewed: boolean },
    @Req() req: Request
  ) {
    return this.transactionsService.bulkReview(
      spaceId,
      req.user!.id,
      body.transactionIds,
      body.reviewed
    );
  }

  @Post('merchants/rename')
  @ApiOperation({ summary: 'Rename a merchant across all transactions' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Merchant renamed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  renameMerchant(
    @Param('spaceId') spaceId: string,
    @Body() body: { oldName: string; newName: string },
    @Req() req: Request
  ) {
    return this.transactionsService.renameMerchant(
      spaceId,
      req.user!.id,
      body.oldName,
      body.newName
    );
  }

  @Post('merchants/merge')
  @ApiOperation({ summary: 'Merge multiple merchant names into one' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Merchants merged successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  mergeMerchants(
    @Param('spaceId') spaceId: string,
    @Body() body: { sourceNames: string[]; targetName: string },
    @Req() req: Request
  ) {
    return this.transactionsService.mergeMerchants(
      spaceId,
      req.user!.id,
      body.sourceNames,
      body.targetName
    );
  }
}