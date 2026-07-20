// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

import {
  CreateManualAssetDto,
  UpdateManualAssetDto,
  ManualAssetResponseDto,
  ManualAssetSummaryDto,
  AddValuationDto,
  ManualAssetValuationDto,
} from './dto';

@Injectable()
export class ManualAssetsService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService
  ) {}

  async findAll(spaceId: string, userId: string): Promise<ManualAssetResponseDto[]> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const assets = await this.prisma.manualAsset.findMany({
      where: { spaceId },
      include: {
        valuationHistory: {
          orderBy: { date: 'desc' },
          take: 5, // Latest 5 valuations
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assets.map((asset) => this.transformAssetToDto(asset));
  }

  async findOne(spaceId: string, userId: string, assetId: string): Promise<ManualAssetResponseDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const asset = await this.prisma.manualAsset.findFirst({
      where: {
        id: assetId,
        spaceId,
      },
      include: {
        valuationHistory: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Manual asset not found');
    }

    return this.transformAssetToDto(asset);
  }

  async create(
    spaceId: string,
    userId: string,
    dto: CreateManualAssetDto
  ): Promise<ManualAssetResponseDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const asset = await this.prisma.manualAsset.create({
      data: {
        spaceId,
        name: dto.name,
        type: dto.type as any,
        description: dto.description,
        currentValue: dto.currentValue,
        currency: dto.currency as any,
        acquisitionDate: dto.acquisitionDate ? new Date(dto.acquisitionDate) : null,
        acquisitionCost: dto.acquisitionCost,
        metadata: dto.metadata,
        notes: dto.notes,
      },
      include: {
        valuationHistory: true,
      },
    });

    // Create initial valuation entry
    await this.prisma.manualAssetValuation.create({
      data: {
        assetId: asset.id,
        date: new Date(),
        value: dto.currentValue,
        currency: dto.currency as any,
        source: 'Initial Entry',
      },
    });

    return this.transformAssetToDto(asset);
  }

  async update(
    spaceId: string,
    userId: string,
    assetId: string,
    dto: UpdateManualAssetDto
  ): Promise<ManualAssetResponseDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const existing = await this.prisma.manualAsset.findFirst({
      where: {
        id: assetId,
        spaceId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Manual asset not found');
    }

    const asset = await this.prisma.manualAsset.update({
      where: { id: assetId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.currentValue !== undefined && { currentValue: dto.currentValue }),
        ...(dto.currency && { currency: dto.currency as any }),
        ...(dto.acquisitionDate && { acquisitionDate: new Date(dto.acquisitionDate) }),
        ...(dto.acquisitionCost !== undefined && { acquisitionCost: dto.acquisitionCost }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        valuationHistory: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });

    return this.transformAssetToDto(asset);
  }

  async remove(spaceId: string, userId: string, assetId: string): Promise<void> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'admin');

    const asset = await this.prisma.manualAsset.findFirst({
      where: {
        id: assetId,
        spaceId,
      },
    });

    if (!asset) {
      throw new NotFoundException('Manual asset not found');
    }

    await this.prisma.manualAsset.delete({
      where: { id: assetId },
    });
  }

  async addValuation(
    spaceId: string,
    userId: string,
    assetId: string,
    dto: AddValuationDto
  ): Promise<ManualAssetValuationDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const asset = await this.prisma.manualAsset.findFirst({
      where: {
        id: assetId,
        spaceId,
      },
    });

    if (!asset) {
      throw new NotFoundException('Manual asset not found');
    }

    const valuation = await this.prisma.manualAssetValuation.create({
      data: {
        assetId,
        date: new Date(dto.date),
        value: dto.value,
        currency: dto.currency as any,
        source: dto.source,
        notes: dto.notes,
      },
    });

    // Update current value on the asset if this is the latest valuation
    const latestValuation = await this.prisma.manualAssetValuation.findFirst({
      where: { assetId },
      orderBy: { date: 'desc' },
    });

    if (latestValuation?.id === valuation.id) {
      await this.prisma.manualAsset.update({
        where: { id: assetId },
        data: { currentValue: dto.value },
      });
    }

    return {
      id: valuation.id,
      assetId: valuation.assetId,
      date: valuation.date.toISOString(),
      value: valuation.value.toNumber(),
      currency: valuation.currency,
      source: valuation.source,
      notes: valuation.notes,
      createdAt: valuation.createdAt.toISOString(),
    };
  }

  async getSummary(spaceId: string, userId: string): Promise<ManualAssetSummaryDto> {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const assets = await this.prisma.manualAsset.findMany({
      where: { spaceId },
    });

    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue.toNumber(), 0);

    const byType: Record<string, { count: number; value: number }> = {};
    assets.forEach((asset) => {
      if (!byType[asset.type]) {
        byType[asset.type] = { count: 0, value: 0 };
      }
      byType[asset.type].count++;
      byType[asset.type].value += asset.currentValue.toNumber();
    });

    const unrealizedGain = assets.reduce((sum, asset) => {
      const cost = asset.acquisitionCost?.toNumber() || 0;
      const current = asset.currentValue.toNumber();
      return sum + (current - cost);
    }, 0);

    // Use the space's default currency
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    return {
      totalAssets,
      totalValue,
      currency: space?.currency || 'USD',
      byType,
      unrealizedGain,
    };
  }

  private transformAssetToDto(asset: any): ManualAssetResponseDto {
    return {
      id: asset.id,
      spaceId: asset.spaceId,
      name: asset.name,
      type: asset.type,
      description: asset.description,
      currentValue: asset.currentValue.toNumber(),
      currency: asset.currency,
      acquisitionDate: asset.acquisitionDate?.toISOString() || null,
      acquisitionCost: asset.acquisitionCost?.toNumber() || null,
      metadata: asset.metadata,
      documents: asset.documents,
      notes: asset.notes,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      valuationHistory: asset.valuationHistory?.map((v: any) => ({
        id: v.id,
        assetId: v.assetId,
        date: v.date.toISOString(),
        value: v.value.toNumber(),
        currency: v.currency,
        source: v.source,
        notes: v.notes,
        createdAt: v.createdAt.toISOString(),
      })),
    };
  }
}