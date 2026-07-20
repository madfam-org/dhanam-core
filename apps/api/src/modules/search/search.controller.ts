// SPDX-License-Identifier: AGPL-3.0-or-later
import { Controller, Get, Query, UseGuards, Param, Req, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { NaturalLanguageService } from './natural-language.service';

@ApiTags('Search')
@Controller('spaces/:spaceId/search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
@ApiForbiddenResponse({ description: 'User lacks access to this space' })
export class SearchController {
  constructor(private readonly nlService: NaturalLanguageService) {}

  @Get()
  @ApiOperation({ summary: 'Search transactions using natural language' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({ name: 'q', required: true, description: 'Natural language query' })
  @ApiOkResponse({ description: 'Search results returned successfully' })
  @ApiBadRequestResponse({ description: 'Query parameter is required' })
  async search(@Param('spaceId') spaceId: string, @Query('q') query: string, @Req() req: Request) {
    if (Array.isArray(query)) throw new BadRequestException('q must be a single string');
    return this.nlService.search(spaceId, req.user!.id, String(query || ''));
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiQuery({ name: 'q', required: false, description: 'Partial query for suggestions' })
  @ApiOkResponse({ description: 'Search suggestions returned successfully' })
  async getSuggestions(
    @Param('spaceId') spaceId: string,
    @Query('q') query?: string,
    @Req() req?: Request
  ) {
    if (Array.isArray(query)) throw new BadRequestException('q must be a single string');
    return this.nlService.getSuggestions(spaceId, req!.user!.id, String(query ?? ''));
  }
}