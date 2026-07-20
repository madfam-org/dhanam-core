// SPDX-License-Identifier: AGPL-3.0-or-later
import { Account, SyncAccountResponse } from '@dhanam-core/shared';
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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@core/types/authenticated-request';

import { RequireRole } from '../spaces/decorators/require-role.decorator';
import { SpaceGuard } from '../spaces/guards/space.guard';

import { AccountsService } from './accounts.service';
import { ConnectAccountDto } from './dto/connect-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdateOwnershipDto } from './dto/update-ownership.dto';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('spaces/:spaceId/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'List accounts in space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async listAccounts(
    @Param('spaceId') spaceId: string,
    @Query('type') type?: string
  ): Promise<Account[]> {
    return this.accountsService.listAccounts(spaceId, type);
  }

  @Post()
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Add manual account' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space or insufficient role' })
  async createAccount(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateAccountDto
  ): Promise<Account> {
    return this.accountsService.createAccount(spaceId, dto);
  }

  @Post('connect')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin')
  @ApiOperation({ summary: 'Connect external account' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiResponse({ status: 201, description: 'Account connected' })
  @ApiBadRequestResponse({ description: 'Invalid provider or connection details' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space or insufficient role' })
  async connectAccount(
    @Param('spaceId') spaceId: string,
    @Body() dto: ConnectAccountDto,
    @Req() req: AuthenticatedRequest
  ): Promise<Account[]> {
    const userId = req.user!.id;
    return this.accountsService.connectAccount(spaceId, userId, dto);
  }

  @Get(':accountId')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get account details' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account details' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getAccount(
    @Param('spaceId') spaceId: string,
    @Param('accountId') accountId: string
  ): Promise<Account> {
    return this.accountsService.getAccount(spaceId, accountId);
  }

  @Patch(':accountId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Update account' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account updated' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space or insufficient role' })
  async updateAccount(
    @Param('spaceId') spaceId: string,
    @Param('accountId') accountId: string,
    @Body() dto: UpdateAccountDto
  ): Promise<Account> {
    return this.accountsService.updateAccount(spaceId, accountId, dto);
  }

  @Delete(':accountId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete account' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space or insufficient role' })
  async deleteAccount(
    @Param('spaceId') spaceId: string,
    @Param('accountId') accountId: string
  ): Promise<void> {
    await this.accountsService.deleteAccount(spaceId, accountId);
  }

  @Post(':accountId/sync')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Sync account data' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Sync initiated' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async syncAccount(
    @Param('spaceId') spaceId: string,
    @Param('accountId') accountId: string
  ): Promise<SyncAccountResponse> {
    return this.accountsService.syncAccount(spaceId, accountId);
  }

  // Yours/Mine/Ours Visibility Endpoints

  @Patch(':accountId/ownership')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin')
  @ApiOperation({ summary: 'Update account ownership (Yours/Mine/Ours)' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Ownership updated' })
  @ApiNotFoundResponse({ description: 'Account not found' })
  @ApiBadRequestResponse({ description: 'Invalid ownership value' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space or insufficient role' })
  async updateOwnership(
    @Param('spaceId') spaceId: string,
    @Param('accountId') accountId: string,
    @Body() dto: UpdateOwnershipDto,
    @Req() req: AuthenticatedRequest
  ): Promise<Account> {
    const userId = req.user!.id;
    return this.accountsService.updateOwnership(spaceId, accountId, userId, dto);
  }

  @Get('by-ownership/:filter')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Get accounts by ownership filter',
    description: 'Filter: yours (your accounts), mine (partner accounts), ours (joint accounts)',
  })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'filter', description: 'Ownership filter: yours, mine, or ours' })
  @ApiResponse({ status: 200, description: 'Filtered accounts' })
  @ApiBadRequestResponse({ description: 'Invalid filter value' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getAccountsByOwnership(
    @Param('spaceId') spaceId: string,
    @Param('filter') filter: 'yours' | 'mine' | 'ours',
    @Req() req: AuthenticatedRequest
  ): Promise<Account[]> {
    const userId = req.user!.id;
    return this.accountsService.getAccountsByOwnership(spaceId, userId, filter);
  }

  @Get('net-worth/by-ownership')
  @UseGuards(SpaceGuard)
  @ApiOperation({
    summary: 'Get net worth aggregated by ownership',
    description: 'Returns yours, mine, ours, and total net worth',
  })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiResponse({ status: 200, description: 'Net worth by ownership' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getNetWorthByOwnership(
    @Param('spaceId') spaceId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<{ yours: number; mine: number; ours: number; total: number }> {
    const userId = req.user!.id;
    return this.accountsService.getNetWorthByOwnership(spaceId, userId);
  }
}