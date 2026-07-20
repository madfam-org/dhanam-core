// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';

import { CreateTagDto, UpdateTagDto } from './dto';

@Injectable()
export class TagsService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService
  ) {}

  async findAll(spaceId: string, userId: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    return this.prisma.tag.findMany({
      where: { spaceId },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(spaceId: string, userId: string, tagId: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'viewer');

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, spaceId },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async create(spaceId: string, userId: string, dto: CreateTagDto) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const existing = await this.prisma.tag.findUnique({
      where: { spaceId_name: { spaceId, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException(`Tag "${dto.name}" already exists in this space`);
    }

    return this.prisma.tag.create({
      data: {
        spaceId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        _count: { select: { transactions: true } },
      },
    });
  }

  async update(spaceId: string, userId: string, tagId: string, dto: UpdateTagDto) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    await this.findOne(spaceId, userId, tagId);

    if (dto.name) {
      const existing = await this.prisma.tag.findFirst({
        where: { spaceId, name: dto.name, id: { not: tagId } },
      });
      if (existing) {
        throw new ConflictException(`Tag "${dto.name}" already exists in this space`);
      }
    }

    return this.prisma.tag.update({
      where: { id: tagId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
      include: {
        _count: { select: { transactions: true } },
      },
    });
  }

  async remove(spaceId: string, userId: string, tagId: string) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'admin');

    await this.findOne(spaceId, userId, tagId);

    await this.prisma.tag.delete({ where: { id: tagId } });
  }

  async bulkAssign(spaceId: string, userId: string, transactionIds: string[], tagIds: string[]) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    // Verify all transactions belong to space
    const txCount = await this.prisma.transaction.count({
      where: { id: { in: transactionIds }, account: { spaceId } },
    });
    if (txCount !== transactionIds.length) {
      throw new NotFoundException('Some transactions not found in this space');
    }

    // Verify all tags belong to space
    const tagCount = await this.prisma.tag.count({
      where: { id: { in: tagIds }, spaceId },
    });
    if (tagCount !== tagIds.length) {
      throw new NotFoundException('Some tags not found in this space');
    }

    const data = transactionIds.flatMap((transactionId) =>
      tagIds.map((tagId) => ({ transactionId, tagId }))
    );

    await this.prisma.transactionTag.createMany({
      data,
      skipDuplicates: true,
    });

    return { assigned: data.length };
  }

  async bulkRemove(spaceId: string, userId: string, transactionIds: string[], tagIds: string[]) {
    await this.spacesService.verifyUserAccess(userId, spaceId, 'member');

    const result = await this.prisma.transactionTag.deleteMany({
      where: {
        transactionId: { in: transactionIds },
        tagId: { in: tagIds },
        tag: { spaceId },
      },
    });

    return { removed: result.count };
  }
}