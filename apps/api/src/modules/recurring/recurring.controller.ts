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
  ApiQuery,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RecurringStatus } from '@db';

import { CreateRecurringDto, UpdateRecurringDto, ConfirmRecurringDto } from './dto';
import { RecurringService } from './recurring.service';

@ApiTags('recurring')
@Controller('spaces/:spaceId/recurring')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Get()
  @ApiOperation({ summary: 'Get all recurring transactions in a space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['detected', 'confirmed', 'dismissed', 'paused'],
  })
  @ApiQuery({ name: 'includeDetected', required: false, type: Boolean })
  @ApiOkResponse({ description: 'List of recurring transactions' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findAll(
    @Param('spaceId') spaceId: string,
    @Query('status') status?: RecurringStatus,
    @Query('includeDetected') includeDetected?: boolean,
    @Req() req?: Request
  ) {
    return this.recurringService.findAll(spaceId, req!.user!.id, {
      status,
      includeDetected: includeDetected === true || String(includeDetected) === 'true',
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary of recurring transactions' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Recurring transactions summary' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  getSummary(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.recurringService.getSummary(spaceId, req.user!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recurring transaction by id' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Recurring pattern UUID' })
  @ApiOkResponse({ description: 'Recurring transaction details' })
  @ApiNotFoundResponse({ description: 'Recurring pattern not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findOne(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.recurringService.findOne(spaceId, req.user!.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new recurring transaction pattern' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Recurring pattern created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  create(@Param('spaceId') spaceId: string, @Body() dto: CreateRecurringDto, @Req() req: Request) {
    return this.recurringService.create(spaceId, req.user!.id, dto);
  }

  @Post('detect')
  @ApiOperation({ summary: 'Detect recurring patterns from transaction history' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Recurring patterns detected and stored' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  detect(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.recurringService.detectAndStore(spaceId, req.user!.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recurring transaction pattern' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Recurring pattern UUID' })
  @ApiOkResponse({ description: 'Recurring pattern updated successfully' })
  @ApiNotFoundResponse({ description: 'Recurring pattern not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringDto,
    @Req() req: Request
  ) {
    return this.recurringService.update(spaceId, req.user!.id, id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm a detected recurring pattern' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Recurring pattern UUID' })
  @ApiOkResponse({ description: 'Pattern confirmed successfully' })
  @ApiNotFoundResponse({ description: 'Recurring pattern not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  confirm(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmRecurringDto,
    @Req() req: Request
  ) {
    return this.recurringService.confirm(spaceId, req.user!.id, id, dto);
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss a detected recurring pattern' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Recurring pattern UUID' })
  @ApiOkResponse({ description: 'Pattern dismissed successfully' })
  @ApiNotFoundResponse({ description: 'Recurring pattern not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  dismiss(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.recurringService.dismiss(spaceId, req.user!.id, id);
  }

  @Post(':id/toggle-pause')
  @ApiOperation({ summary: 'Pause or resume tracking for a recurring pattern' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Recurring pattern UUID' })
  @ApiOkResponse({ description: 'Pattern pause state toggled successfully' })
  @ApiNotFoundResponse({ description: 'Recurring pattern not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  togglePause(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.recurringService.togglePause(spaceId, req.user!.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recurring transaction pattern' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Recurring pattern UUID' })
  @ApiOkResponse({ description: 'Pattern deleted successfully' })
  @ApiNotFoundResponse({ description: 'Recurring pattern not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.recurringService.remove(spaceId, req.user!.id, id);
  }
}