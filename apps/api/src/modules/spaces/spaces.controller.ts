// SPDX-License-Identifier: AGPL-3.0-or-later
import { Space, SpaceMember } from '@dhanam-core/shared';
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
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { SpaceLimitGuard } from '@core/feature-gates';

import { RequireRole } from './decorators/require-role.decorator';
import { CreateSpaceDto } from './dto/create-space.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { SpaceGuard } from './guards/space.guard';
import { SpacesService } from './spaces.service';

@ApiTags('Spaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  @ApiOperation({ summary: 'List user spaces' })
  @ApiResponse({ status: 200, description: 'List of spaces' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async listSpaces(@CurrentUser('id') userId: string): Promise<Space[]> {
    return this.spacesService.listUserSpaces(userId);
  }

  @Post()
  @UseGuards(SpaceLimitGuard)
  @ApiOperation({ summary: 'Create new space' })
  @ApiResponse({ status: 201, description: 'Space created' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async createSpace(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSpaceDto
  ): Promise<Space> {
    return this.spacesService.createSpace(userId, dto);
  }

  @Get(':spaceId')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'Get space details' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiResponse({ status: 200, description: 'Space details' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async getSpace(@Param('spaceId') spaceId: string): Promise<Space> {
    return this.spacesService.getSpace(spaceId);
  }

  @Patch(':spaceId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin')
  @ApiOperation({ summary: 'Update space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiResponse({ status: 200, description: 'Space updated' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space or insufficient role' })
  async updateSpace(
    @Param('spaceId') spaceId: string,
    @Body() dto: UpdateSpaceDto
  ): Promise<Space> {
    return this.spacesService.updateSpace(spaceId, dto);
  }

  @Delete(':spaceId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiResponse({ status: 204, description: 'Space deleted' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User is not the owner of this space' })
  async deleteSpace(@Param('spaceId') spaceId: string): Promise<void> {
    await this.spacesService.deleteSpace(spaceId);
  }

  @Get(':spaceId/members')
  @UseGuards(SpaceGuard)
  @ApiOperation({ summary: 'List space members' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiResponse({ status: 200, description: 'List of members' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  async listMembers(@Param('spaceId') spaceId: string): Promise<SpaceMember[]> {
    return this.spacesService.listMembers(spaceId);
  }

  @Post(':spaceId/members')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin')
  @ApiOperation({ summary: 'Invite member to space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiResponse({ status: 201, description: 'Member invited' })
  @ApiNotFoundResponse({ description: 'Space not found' })
  @ApiBadRequestResponse({ description: 'Invalid email or member already exists' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space or insufficient role' })
  async inviteMember(
    @Param('spaceId') spaceId: string,
    @Body() dto: InviteMemberDto
  ): Promise<SpaceMember> {
    return this.spacesService.inviteMember(spaceId, dto);
  }

  @Patch(':spaceId/members/:userId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner')
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID to update' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiNotFoundResponse({ description: 'Space or member not found' })
  @ApiBadRequestResponse({ description: 'Invalid role value' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User is not the owner of this space' })
  async updateMemberRole(
    @Param('spaceId') spaceId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto
  ): Promise<SpaceMember> {
    return this.spacesService.updateMemberRole(spaceId, userId, dto);
  }

  @Delete(':spaceId/members/:userId')
  @UseGuards(SpaceGuard)
  @RequireRole('owner', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID to remove' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiNotFoundResponse({ description: 'Space or member not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space or insufficient role' })
  async removeMember(
    @Param('spaceId') spaceId: string,
    @Param('userId') userId: string,
    @CurrentUser('id') currentUserId: string
  ): Promise<void> {
    await this.spacesService.removeMember(spaceId, userId, currentUserId);
  }
}
