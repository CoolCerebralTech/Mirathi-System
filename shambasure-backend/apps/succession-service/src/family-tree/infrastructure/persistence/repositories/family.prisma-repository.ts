import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Family } from '../../../domain/entities/family.entity';
import { FamilyRepositoryInterface } from '../../../domain/interfaces/family.repository.interface';
import { FamilyMapper } from '../mappers/family.mapper';

@Injectable()
export class FamilyPrismaRepository implements FamilyRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // BASIC PERSISTENCE OPERATIONS
  // ---------------------------------------------------------

  async save(family: Family): Promise<void> {

    await this.prisma.family.upsert({
      where: { id: family.getId() },
      create: FamilyMapper.toPrismaCreate(family),
      update: FamilyMapper.toPrismaUpdate(family),
    });
  }

  async findById(id: string): Promise<Family | null> {
    const record = await this.prisma.family.findUnique({
      where: { id },
    });

    return record ? FamilyMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.family.delete({
      where: { id },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.family.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async restore(id: string): Promise<void> {
    await this.prisma.family.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  // ---------------------------------------------------------
  // DOMAIN LOOKUPS
  // ---------------------------------------------------------

  async findByCreatorId(creatorId: string): Promise<Family[]> {
    const records = await this.prisma.family.findMany({
      where: {
        creatorId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  async findByName(creatorId: string, name: string): Promise<Family | null> {
    const record = await this.prisma.family.findFirst({
      where: {
        creatorId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    return record ? FamilyMapper.toDomain(record) : null;
  }

  // ---------------------------------------------------------
  // KENYAN FAMILY LAW SPECIFIC QUERIES
  // ---------------------------------------------------------

  async findFamiliesWithCustomaryMarriages(): Promise<Family[]> {
    const records = await this.prisma.family.findMany({
      where: {
        deletedAt: null,
        hasCustomaryMarriage: true,
      },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  async findFamiliesWithPolygamousMarriages(): Promise<Family[]> {
    const records = await this.prisma.family.findMany({
      where: {
        deletedAt: null,
        hasPolygamousMarriage: true,
      },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  async findFamiliesWithMinors(): Promise<Family[]> {
    const records = await this.prisma.family.findMany({
      where: {
        deletedAt: null,
        minorCount: {
          gt: 0,
        },
      },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  async findByClan(clanName: string, subClan?: string): Promise<Family[]> {
    const whereClause: Prisma.FamilyWhereInput = {
      deletedAt: null,
      clanName: {
        contains: clanName,
        mode: 'insensitive',
      },
    };

    if (subClan) {
      whereClause.subClan = {
        contains: subClan,
        mode: 'insensitive',
      };
    }

    const records = await this.prisma.family.findMany({
      where: whereClause,
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  // ---------------------------------------------------------
  // ANALYTICS & REPORTING
  // ---------------------------------------------------------

  async getFamilyStatistics(familyId: string): Promise<{
    memberCount: number;
    livingMemberCount: number;
    minorCount: number;
    customaryMarriageCount: number;
    polygamousMarriageCount: number;
  }> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      select: {
        memberCount: true,
        livingMemberCount: true,
        minorCount: true,
        customaryMarriageCount: true,
        polygamousMarriageCount: true,
      },
    });

    if (!family) {
      return {
        memberCount: 0,
        livingMemberCount: 0,
        minorCount: 0,
        customaryMarriageCount: 0,
        polygamousMarriageCount: 0,
      };
    }

    return {
      memberCount: family.memberCount,
      livingMemberCount: family.livingMemberCount,
      minorCount: family.minorCount,
      customaryMarriageCount: family.customaryMarriageCount,
      polygamousMarriageCount: family.polygamousMarriageCount,
    };
  }

  async countByCreator(creatorId: string): Promise<number> {
    return this.prisma.family.count({
      where: {
        creatorId,
        deletedAt: null,
      },
    });
  }

  // ---------------------------------------------------------
  // ADDITIONAL QUERIES FOR COMPREHENSIVE FAMILY MANAGEMENT
  // ---------------------------------------------------------

  async findFamiliesWithFamilyHead(familyHeadId: string): Promise<Family[]> {
    const records = await this.prisma.family.findMany({
      where: {
        familyHeadId,
        deletedAt: null,
      },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  async findFamiliesByAncestralHome(ancestralHome: string): Promise<Family[]> {
    const records = await this.prisma.family.findMany({
      where: {
        ancestralHome: {
          contains: ancestralHome,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  async findActiveFamilies(): Promise<Family[]> {
    const records = await this.prisma.family.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }

  async findFamiliesWithDeceasedMembers(): Promise<Family[]> {
    const records = await this.prisma.family.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            memberCount: {
              gt: this.prisma.family.fields.livingMemberCount,
            },
          },
          {
            livingMemberCount: 0,
            memberCount: {
              gt: 0,
            },
          },
        ],
      },
    });

    return records.map((record) => FamilyMapper.toDomain(record));
  }
}