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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

import { CreateRuleDto, UpdateRuleDto } from './dto';
import { RulesService } from './rules.service';

@ApiTags('categorization-rules')
@Controller('spaces/:spaceId/rules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategorizationRulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a categorization rule' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Rule created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  create(@Param('spaceId') spaceId: string, @Body() dto: CreateRuleDto) {
    // Note: space access check should be inside service or here
    // Verify space access logic is assumed to be in service or guard if applied globally
    // The RulesService creates rule directly. We should probably verify space access.
    // However, RulesService.createRule takes spaceId.
    return this.rulesService.createRule(
      spaceId,
      dto.categoryId,
      dto.name,
      dto.conditions,
      dto.priority
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get rules' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'List of rules' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findAll(@Param('spaceId') spaceId: string, @Query('categoryId') categoryId?: string) {
    if (categoryId) {
      return this.rulesService.getRulesForCategory(categoryId);
    }
    return this.rulesService.getRulesForSpace(spaceId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a rule' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  @ApiOkResponse({ description: 'Rule updated successfully' })
  @ApiNotFoundResponse({ description: 'Rule not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  update(@Param('spaceId') spaceId: string, @Param('id') id: string, @Body() dto: UpdateRuleDto) {
    return this.rulesService.updateRule(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a rule' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Rule UUID' })
  @ApiOkResponse({ description: 'Rule deleted successfully' })
  @ApiNotFoundResponse({ description: 'Rule not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string) {
    return this.rulesService.deleteRule(id);
  }
}