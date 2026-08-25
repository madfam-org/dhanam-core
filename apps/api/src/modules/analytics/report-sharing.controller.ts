// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { ShareReportDto, UpdateShareRoleDto, CreateShareTokenDto } from './dto';
import { ReportCollaborationService } from './report-collaboration.service';
import { ReportShareTokenService } from './report-share-token.service';

@ApiTags('Report Sharing')
@Controller('reports')
export class ReportSharingController {
  constructor(
    private readonly collaborationService: ReportCollaborationService,
    private readonly shareTokenService: ReportShareTokenService
  ) {}

  // ── User-to-User Sharing ──────────────────────────────

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share a report with another user' })
  @ApiParam({ name: 'id', description: 'Saved report ID' })
  @ApiCreatedResponse({ description: 'Report shared' })
  @ApiNotFoundResponse({ description: 'Report or user not found' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async share(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: ShareReportDto
  ) {
    return this.collaborationService.shareReport(userId, {
      reportId,
      shareWithEmail: dto.shareWithEmail,
      role: dto.role,
      message: dto.message,
    });
  }

  @Get(':id/shares')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List collaborators for a report' })
  @ApiParam({ name: 'id', description: 'Saved report ID' })
  @ApiOkResponse({ description: 'List of shares' })
  async getShares(@CurrentUser('id') userId: string, @Param('id') reportId: string) {
    return this.collaborationService.getReportShares(userId, reportId);
  }

  @Post('shares/:shareId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a report share invitation' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  @ApiOkResponse({ description: 'Share accepted' })
  async acceptShare(@CurrentUser('id') userId: string, @Param('shareId') shareId: string) {
    return this.collaborationService.acceptShare(userId, shareId);
  }

  @Post('shares/:shareId/decline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Decline a report share invitation' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  @ApiNoContentResponse({ description: 'Share declined' })
  async declineShare(@CurrentUser('id') userId: string, @Param('shareId') shareId: string) {
    await this.collaborationService.declineShare(userId, shareId);
  }

  @Delete('shares/:shareId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a report share' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  @ApiNoContentResponse({ description: 'Share revoked' })
  async revokeShare(@CurrentUser('id') userId: string, @Param('shareId') shareId: string) {
    await this.collaborationService.revokeShare(userId, shareId);
  }

  @Patch('shares/:shareId/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a collaborator role' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  @ApiOkResponse({ description: 'Role updated' })
  async updateRole(
    @CurrentUser('id') userId: string,
    @Param('shareId') shareId: string,
    @Body() dto: UpdateShareRoleDto
  ) {
    return this.collaborationService.updateShareRole(userId, {
      shareId,
      newRole: dto.role,
    });
  }

  @Get('shared-with-me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reports shared with me' })
  @ApiOkResponse({ description: 'List of shared reports' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async sharedWithMe(@CurrentUser('id') userId: string) {
    return this.collaborationService.getSharedWithMe(userId);
  }

  // ── Public Share Links ────────────────────────────────

  @Post(':id/share-link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a public share link' })
  @ApiParam({ name: 'id', description: 'Saved report ID' })
  @ApiCreatedResponse({ description: 'Share link created' })
  async createShareLink(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: CreateShareTokenDto
  ) {
    return this.shareTokenService.createToken(userId, reportId, {
      expiresInHours: dto.expiresInHours,
      maxAccess: dto.maxAccess,
      generatedReportId: dto.generatedReportId,
    });
  }

  @Get(':id/share-links')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active share links for a report' })
  @ApiParam({ name: 'id', description: 'Saved report ID' })
  @ApiOkResponse({ description: 'List of active share links' })
  async listShareLinks(@CurrentUser('id') userId: string, @Param('id') reportId: string) {
    return this.shareTokenService.listTokens(userId, reportId);
  }

  @Delete('share-links/:tokenId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a share link' })
  @ApiParam({ name: 'tokenId', description: 'Share token ID' })
  @ApiNoContentResponse({ description: 'Share link revoked' })
  async revokeShareLink(@CurrentUser('id') userId: string, @Param('tokenId') tokenId: string) {
    await this.shareTokenService.revokeToken(userId, tokenId);
  }

  // ── Public Access (No Auth) ───────────────────────────

  @Get('public/:token')
  @ApiOperation({ summary: 'Access a report via public share link' })
  @ApiParam({ name: 'token', description: 'Share token' })
  @ApiOkResponse({ description: 'Report details and download URL' })
  @ApiNotFoundResponse({ description: 'Invalid or expired link' })
  async accessPublicReport(@Param('token') token: string) {
    return this.shareTokenService.validateAndGetReport(token);
  }
}
