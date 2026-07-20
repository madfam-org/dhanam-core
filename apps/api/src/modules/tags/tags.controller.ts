// SPDX-License-Identifier: AGPL-3.0-or-later
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { CreateTagDto, UpdateTagDto } from './dto';
import { TagsService } from './tags.service';

@ApiTags('tags')
@Controller('spaces/:spaceId/tags')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tags in a space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'List of tags' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findAll(@Param('spaceId') spaceId: string, @Req() req: Request) {
    return this.tagsService.findAll(spaceId, req.user!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by id' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiOkResponse({ description: 'Tag details' })
  @ApiNotFoundResponse({ description: 'Tag not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findOne(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.tagsService.findOne(spaceId, req.user!.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Tag created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiConflictResponse({ description: 'Tag name already exists in this space' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  create(
    @Param('spaceId') spaceId: string,
    @Body() createTagDto: CreateTagDto,
    @Req() req: Request
  ) {
    return this.tagsService.create(spaceId, req.user!.id, createTagDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiOkResponse({ description: 'Tag updated successfully' })
  @ApiNotFoundResponse({ description: 'Tag not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiConflictResponse({ description: 'Tag name already exists in this space' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
    @Req() req: Request
  ) {
    return this.tagsService.update(spaceId, req.user!.id, id, updateTagDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Tag UUID' })
  @ApiOkResponse({ description: 'Tag deleted successfully' })
  @ApiNotFoundResponse({ description: 'Tag not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string, @Req() req: Request) {
    return this.tagsService.remove(spaceId, req.user!.id, id);
  }

  @Post('bulk-assign')
  @ApiOperation({ summary: 'Bulk assign tags to transactions' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Tags assigned successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  bulkAssign(
    @Param('spaceId') spaceId: string,
    @Body() body: { transactionIds: string[]; tagIds: string[] },
    @Req() req: Request
  ) {
    return this.tagsService.bulkAssign(spaceId, req.user!.id, body.transactionIds, body.tagIds);
  }

  @Post('bulk-remove')
  @ApiOperation({ summary: 'Bulk remove tags from transactions' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Tags removed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  bulkRemoveTags(
    @Param('spaceId') spaceId: string,
    @Body() body: { transactionIds: string[]; tagIds: string[] },
    @Req() req: Request
  ) {
    return this.tagsService.bulkRemove(spaceId, req.user!.id, body.transactionIds, body.tagIds);
  }
}