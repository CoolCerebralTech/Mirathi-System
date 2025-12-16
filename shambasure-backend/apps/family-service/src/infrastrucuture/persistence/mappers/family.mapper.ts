// family.mapper.ts
import { Family as PrismaFamily, KenyanCounty as PrismaKenyanCounty } from '@prisma/client';

import { Family, FamilyProps } from '../../../domain/aggregates/family.aggregate';

export interface PersistenceFamily extends Omit<
  PrismaFamily,
  'createdAt' | 'updatedAt' | 'deletedAt'
> {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class FamilyMapper {
  // ============ CONVERSION METHODS ============

  /**
   * Convert Domain Family Aggregate to Persistence Model (STATIC)
   */
  static toPersistence(family: Family): PersistenceFamily {
    const json = family.toJSON();

    return {
      id: json.id,
      name: json.name,
      description: json.description ?? null,
      creatorId: json.creatorId,
      clanName: json.clanName ?? null,
      subClan: json.subClan ?? null,
      ancestralHome: json.ancestralHome ?? null,
      familyTotem: json.familyTotem ?? null,
      homeCounty: json.homeCounty as PrismaKenyanCounty | null,

      // Denormalized Counts
      memberCount: json.memberCount,
      livingMemberCount: json.livingMemberCount,
      deceasedMemberCount: json.deceasedMemberCount,
      minorCount: json.minorCount,
      dependantCount: json.dependantCount,

      // S.40 Polygamy Tracking
      isPolygamous: json.isPolygamous,
      polygamousHouseCount: json.polygamousHouseCount,

      // Versioning & Concurrency
      version: json.version,
      lastEventId: json.lastEventId ?? null,

      // Audit
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      deletedAt: json.deletedAt ?? null,
    };
  }

  /**
   * Convert Persistence Model to Domain Family Aggregate (STATIC)
   */
  static toDomain(
    persistenceFamily: PersistenceFamily,
    options?: {
      memberIds?: string[];
      marriageIds?: string[];
      polygamousHouseIds?: string[];
    },
  ): Family {
    const props: FamilyProps = {
      id: persistenceFamily.id,
      name: persistenceFamily.name,
      description: persistenceFamily.description ?? undefined,
      creatorId: persistenceFamily.creatorId,

      // Kenyan Cultural Identity
      clanName: persistenceFamily.clanName ?? undefined,
      subClan: persistenceFamily.subClan ?? undefined,
      ancestralHome: persistenceFamily.ancestralHome ?? undefined,
      familyTotem: persistenceFamily.familyTotem ?? undefined,
      homeCounty: persistenceFamily.homeCounty as PrismaKenyanCounty | undefined,

      // Performance: Denormalized Counts
      memberCount: persistenceFamily.memberCount,
      livingMemberCount: persistenceFamily.livingMemberCount,
      deceasedMemberCount: persistenceFamily.deceasedMemberCount,
      minorCount: persistenceFamily.minorCount,
      dependantCount: persistenceFamily.dependantCount,

      // S.40 Polygamy Tracking
      isPolygamous: persistenceFamily.isPolygamous,
      polygamousHouseCount: persistenceFamily.polygamousHouseCount,

      // Versioning
      version: persistenceFamily.version,
      lastEventId: persistenceFamily.lastEventId ?? undefined,

      // Audit
      createdAt: persistenceFamily.createdAt,
      updatedAt: persistenceFamily.updatedAt,
      deletedAt: persistenceFamily.deletedAt ?? undefined,
      deletedBy: undefined,
      deletionReason: undefined,
      isArchived: !!persistenceFamily.deletedAt,

      // Relationships
      memberIds: options?.memberIds ?? [],
      marriageIds: options?.marriageIds ?? [],
      polygamousHouseIds: options?.polygamousHouseIds ?? [],
    };

    return Family.createFromProps(props);
  }

  /**
   * Convert Prisma raw result to Domain Family Aggregate (STATIC)
   */
  static fromPrisma(
    prismaFamily: PrismaFamily & {
      members?: { id: string }[];
      marriages?: { id: string }[];
      polygamousHouses?: { id: string }[];
    },
    options?: {
      memberIds?: string[];
      marriageIds?: string[];
      polygamousHouseIds?: string[];
    },
  ): Family {
    // Use provided relationships or extract from included relations
    const relationships = options || this.extractRelationships(prismaFamily);

    return this.toDomain(
      {
        ...prismaFamily,
        createdAt: new Date(prismaFamily.createdAt),
        updatedAt: new Date(prismaFamily.updatedAt),
        deletedAt: prismaFamily.deletedAt ? new Date(prismaFamily.deletedAt) : null,
      },
      relationships,
    );
  }

  // ============ HELPER METHODS ============

  /**
   * Extract relationship IDs from Prisma family with includes
   */
  static extractRelationships(
    prismaFamily: PrismaFamily & {
      members?: { id: string }[];
      marriages?: { id: string }[];
      polygamousHouses?: { id: string }[];
    },
  ) {
    return {
      memberIds: prismaFamily.members?.map((member) => member.id) ?? [],
      marriageIds: prismaFamily.marriages?.map((marriage) => marriage.id) ?? [],
      polygamousHouseIds: prismaFamily.polygamousHouses?.map((house) => house.id) ?? [],
    };
  }

  /**
   * Create Prisma create input from domain
   */
  static toPrismaCreate(family: Family) {
    const persistence = this.toPersistence(family);
    const { id, ...data } = persistence;

    return {
      data: {
        ...data,
        id,
      },
    };
  }

  /**
   * Create Prisma update input from domain
   */
  static toPrismaUpdate(family: Family) {
    const persistence = this.toPersistence(family);
    const { id, ...data } = persistence;

    return {
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    };
  }

  // ============ INSTANCE METHODS (for dependency injection) ============

  toPersistenceInstance(family: Family): PersistenceFamily {
    return FamilyMapper.toPersistence(family);
  }

  toDomainInstance(
    persistenceFamily: PersistenceFamily,
    options?: {
      memberIds?: string[];
      marriageIds?: string[];
      polygamousHouseIds?: string[];
    },
  ): Family {
    return FamilyMapper.toDomain(persistenceFamily, options);
  }
}
