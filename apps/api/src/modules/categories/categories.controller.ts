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
  ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@core/types/authenticated-request';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@ApiTags('categories')
@Controller('spaces/:spaceId/categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories in a space' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'List of categories in the space' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findAll(@Param('spaceId') spaceId: string, @Req() req: AuthenticatedRequest) {
    return this.categoriesService.findAll(spaceId, req.user!.id);
  }

  @Get('budget/:budgetId')
  @ApiOperation({ summary: 'Get categories by budget' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'budgetId', description: 'Budget UUID' })
  @ApiOkResponse({ description: 'List of categories for the budget' })
  @ApiNotFoundResponse({ description: 'Budget not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findByBudget(
    @Param('spaceId') spaceId: string,
    @Param('budgetId') budgetId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.categoriesService.findByBudget(spaceId, req.user!.id, budgetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiOkResponse({ description: 'Category details' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  findOne(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.categoriesService.findOne(spaceId, req.user!.id, id);
  }

  @Get(':id/spending')
  @ApiOperation({ summary: 'Get category spending details' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiOkResponse({ description: 'Category spending details' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  getCategorySpending(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.categoriesService.getCategorySpending(spaceId, req.user!.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiOkResponse({ description: 'Category created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  create(
    @Param('spaceId') spaceId: string,
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.categoriesService.create(spaceId, req.user!.id, createCategoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiOkResponse({ description: 'Category updated successfully' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.categoriesService.update(spaceId, req.user!.id, id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'spaceId', description: 'Space UUID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiOkResponse({ description: 'Category deleted successfully' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  @ApiForbiddenResponse({ description: 'User lacks access to this space' })
  remove(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.categoriesService.remove(spaceId, req.user!.id, id);
  }
}
