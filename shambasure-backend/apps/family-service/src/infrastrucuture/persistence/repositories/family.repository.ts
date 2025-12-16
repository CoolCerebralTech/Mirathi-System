import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Family } from '../../../domain/aggregates/family.aggregate';
import { IFamilyRepository } from '../../../domain/interfaces/repositories/ifamily.repository';
import { FamilyMapper } from '../mappers/family.mapper';

// This type allows us to use the regular Prisma client or a transactional client.
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class FamilyRepository implements IFamilyRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly familyMapper: FamilyMapper,
  ) {}

  /**
   * Defines the relations to include when fetching a Family to ensure
   * the aggregate can be fully reconstituted.
   * This is optimized to only select the 'id' of related entities.
   */
  private readonly includeRelations = {
    members: { select: { id: true } },
    marriages: { select: { id: true } },
    polygamousHouses: { select: { id: true } },
  };

  async findById(id: string): Promise<Family | null> {
    const family = await this.prisma.family.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    return this.familyMapper.toDomain(family);
  }

  async findByCreatorId(creatorId: string): Promise<Family[]> {
    const families = await this.prisma.family.findMany({
      where: { creatorId },
      include: this.includeRelations,
    });

    // The `map` and `filter` ensure we return a clean array of domain objects.
    return families
      .map((family) => this.familyMapper.toDomain(family))
      .filter((family): family is Family => family !== null);
  }

  async save(family: Family, tx?: TransactionClient): Promise<Family> {
    const prismaClient = tx || this.prisma;
    const persistenceData = this.familyMapper.toPersistence(family);

    const { id, ...updateData } = persistenceData;

    const savedFamily = await prismaClient.family.upsert({
      where: { id },
      create: persistenceData,
      update: updateData,
      include: this.includeRelations,
    });

    return this.familyMapper.toDomain(savedFamily)!;
  }

  async delete(id: string, tx?: TransactionClient): Promise<void> {
    const prismaClient = tx || this.prisma;
    await prismaClient.family.delete({
      where: { id },
    });
  }

  async search(criteria: {
    name?: string;
    county?: string;
    clanName?: string;
    isPolygamous?: boolean;
  }): Promise<Family[]> {
    const where: Prisma.FamilyWhereInput = {};

    if (criteria.name) {
      where.name = { contains: criteria.name, mode: 'insensitive' };
    }
    if (criteria.county) {
      where.homeCounty = criteria.county as any;
    }
    if (criteria.clanName) {
      where.clanName = { contains: criteria.clanName, mode: 'insensitive' };
    }
    if (criteria.isPolygamous !== undefined) {
      where.isPolygamous = criteria.isPolygamous;
    }

    const families = await this.prisma.family.findMany({
      where,
      include: this.includeRelations,
    });

    return families
      .map((family) => this.familyMapper.toDomain(family))
      .filter((family): family is Family => family !== null);
  }
}
