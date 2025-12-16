// family.mapper.ts
import { Family as PrismaFamily, KenyanCounty as PrismaKenyanCounty } from '@prisma/client';

import { Family, FamilyProps } from '../../../domain/aggregates/family.aggregate';

/**
 * Interface for persistence layer Family (Prisma model)
 */
export interface PersistenceFamily extends Omit<
  PrismaFamily,
  'createdAt' | 'updatedAt' | 'deletedAt'
> {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * FamilyMapper - Maps between Domain Aggregate and Persistence Layer
 */
export class FamilyMapper {
  /**
   * Convert Domain Family Aggregate to Persistence Model
   */
  static toPersistence(family: Family): PersistenceFamily {
    return {
      id: family.id,
      name: family.name,
      description: family.description ?? null,
      creatorId: family.creatorId,
      clanName: family.clanName ?? null,
      subClan: family.subClan ?? null,
      ancestralHome: family.ancestralHome ?? null,
      familyTotem: family.familyTotem ?? null,
      homeCounty: family.homeCounty as PrismaKenyanCounty | null,

      // Denormalized Counts
      memberCount: family.memberCount,
      livingMemberCount: family.livingMemberCount,
      deceasedMemberCount: family.deceasedMemberCount,
      minorCount: family.minorCount,
      dependantCount: family.dependantCount,

      // S.40 Polygamy Tracking
      isPolygamous: family.isPolygamous,
      polygamousHouseCount: family.polygamousHouseCount,

      // Versioning & Concurrency
      version: family.version,
      lastEventId: family.lastEventId ?? null,

      // Audit
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
      deletedAt: family.deletedAt ?? null,

      // Note: Relationships are not mapped here as they're handled separately
      // memberIds, marriageIds, polygamousHouseIds are managed via foreign keys
    };
  }

  /**
   * Convert Persistence Model to Domain Family Aggregate
   * Note: Relationships are loaded separately by the repository
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

      // Versioning for concurrency control
      version: persistenceFamily.version,
      lastEventId: persistenceFamily.lastEventId ?? undefined,

      // Audit
      createdAt: persistenceFamily.createdAt,
      updatedAt: persistenceFamily.updatedAt,
      deletedAt: persistenceFamily.deletedAt ?? undefined,
      deletedBy: undefined, // Not stored in persistence, managed via audit logs
      deletionReason: undefined, // Not stored in persistence
      isArchived: !!persistenceFamily.deletedAt, // Archived if deletedAt is set

      // Relationships (loaded separately or provided)
      memberIds: options?.memberIds ?? [],
      marriageIds: options?.marriageIds ?? [],
      polygamousHouseIds: options?.polygamousHouseIds ?? [],
    };

    return Family.createFromProps(props);
  }

  /**
   * Convert Prisma raw result to Domain Family Aggregate
   * Handles Prisma's serialized date strings and null handling
   */
  static fromPrisma(
    prismaFamily: PrismaFamily,
    options?: {
      memberIds?: string[];
      marriageIds?: string[];
      polygamousHouseIds?: string[];
    },
  ): Family {
    // Convert Prisma's potential string dates to Date objects
    const persistenceFamily: PersistenceFamily = {
      ...prismaFamily,
      createdAt: new Date(prismaFamily.createdAt),
      updatedAt: new Date(prismaFamily.updatedAt),
      deletedAt: prismaFamily.deletedAt ? new Date(prismaFamily.deletedAt) : null,
    };

    return this.toDomain(persistenceFamily, options);
  }

  /**
   * Convert Domain Family to Prisma create input
   * For use with Prisma's create method
   */
  static toPrismaCreate(family: Family) {
    return {
      data: {
        id: family.id,
        name: family.name,
        description: family.description,
        creatorId: family.creatorId,
        clanName: family.clanName,
        subClan: family.subClan,
        ancestralHome: family.ancestralHome,
        familyTotem: family.familyTotem,
        homeCounty: family.homeCounty,

        // Denormalized Counts
        memberCount: family.memberCount,
        livingMemberCount: family.livingMemberCount,
        deceasedMemberCount: family.deceasedMemberCount,
        minorCount: family.minorCount,
        dependantCount: family.dependantCount,

        // S.40 Polygamy Tracking
        isPolygamous: family.isPolygamous,
        polygamousHouseCount: family.polygamousHouseCount,

        // Versioning & Concurrency
        version: family.version,
        lastEventId: family.lastEventId,

        // Audit timestamps will be set by Prisma defaults
      },
    };
  }

  /**
   * Convert Domain Family to Prisma update input
   * For use with Prisma's update method
   */
  static toPrismaUpdate(family: Family) {
    return {
      where: { id: family.id },
      data: {
        name: family.name,
        description: family.description,
        clanName: family.clanName,
        subClan: family.subClan,
        ancestralHome: family.ancestralHome,
        familyTotem: family.familyTotem,
        homeCounty: family.homeCounty,

        // Denormalized Counts
        memberCount: family.memberCount,
        livingMemberCount: family.livingMemberCount,
        deceasedMemberCount: family.deceasedMemberCount,
        minorCount: family.minorCount,
        dependantCount: family.dependantCount,

        // S.40 Polygamy Tracking
        isPolygamous: family.isPolygamous,
        polygamousHouseCount: family.polygamousHouseCount,

        // Versioning & Concurrency
        version: family.version,
        lastEventId: family.lastEventId,
        updatedAt: new Date(), // Ensure updatedAt is always set

        // Handle soft delete
        deletedAt: family.deletedAt,
      },
    };
  }

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
   * Validate mapping consistency between domain and persistence
   */
  static validateMapping(family: Family, persistenceFamily: PersistenceFamily): boolean {
    const errors: string[] = [];

    // Basic ID validation
    if (family.id !== persistenceFamily.id) {
      errors.push(`ID mismatch: Domain=${family.id}, Persistence=${persistenceFamily.id}`);
    }

    // Version validation
    if (family.version !== persistenceFamily.version) {
      errors.push(
        `Version mismatch: Domain=${family.version}, Persistence=${persistenceFamily.version}`,
      );
    }

    // Count validation
    if (family.memberCount !== persistenceFamily.memberCount) {
      errors.push(
        `MemberCount mismatch: Domain=${family.memberCount}, Persistence=${persistenceFamily.memberCount}`,
      );
    }

    // Polygamy consistency
    if (family.isPolygamous !== persistenceFamily.isPolygamous) {
      errors.push(
        `Polygamy status mismatch: Domain=${family.isPolygamous}, Persistence=${persistenceFamily.isPolygamous}`,
      );
    }

    if (
      family.isPolygamous &&
      family.polygamousHouseCount !== persistenceFamily.polygamousHouseCount
    ) {
      errors.push(
        `House count mismatch: Domain=${family.polygamousHouseCount}, Persistence=${persistenceFamily.polygamousHouseCount}`,
      );
    }

    // Validate invariants are preserved
    if (family.memberCount !== family.livingMemberCount + family.deceasedMemberCount) {
      errors.push(
        `Domain invariant violated: memberCount (${family.memberCount}) != living (${family.livingMemberCount}) + deceased (${family.deceasedMemberCount})`,
      );
    }

    if (
      persistenceFamily.memberCount !==
      persistenceFamily.livingMemberCount + persistenceFamily.deceasedMemberCount
    ) {
      errors.push(
        `Persistence invariant violated: memberCount (${persistenceFamily.memberCount}) != living (${persistenceFamily.livingMemberCount}) + deceased (${persistenceFamily.deceasedMemberCount})`,
      );
    }

    if (errors.length > 0) {
      console.warn('Family mapping validation errors:', errors);
      return false;
    }

    return true;
  }

  /**
   * Create a partial update DTO from domain changes
   * Useful for tracking what fields changed
   */
  static getChangedFields(oldFamily: Family, newFamily: Family): Partial<PersistenceFamily> {
    const changed: Partial<PersistenceFamily> = {};

    if (oldFamily.name !== newFamily.name) changed.name = newFamily.name;
    if (oldFamily.description !== newFamily.description)
      changed.description = newFamily.description ?? null;
    if (oldFamily.clanName !== newFamily.clanName) changed.clanName = newFamily.clanName ?? null;
    if (oldFamily.homeCounty !== newFamily.homeCounty)
      changed.homeCounty = newFamily.homeCounty as PrismaKenyanCounty | null;

    if (oldFamily.memberCount !== newFamily.memberCount)
      changed.memberCount = newFamily.memberCount;
    if (oldFamily.livingMemberCount !== newFamily.livingMemberCount)
      changed.livingMemberCount = newFamily.livingMemberCount;
    if (oldFamily.deceasedMemberCount !== newFamily.deceasedMemberCount)
      changed.deceasedMemberCount = newFamily.deceasedMemberCount;
    if (oldFamily.minorCount !== newFamily.minorCount) changed.minorCount = newFamily.minorCount;
    if (oldFamily.dependantCount !== newFamily.dependantCount)
      changed.dependantCount = newFamily.dependantCount;

    if (oldFamily.isPolygamous !== newFamily.isPolygamous)
      changed.isPolygamous = newFamily.isPolygamous;
    if (oldFamily.polygamousHouseCount !== newFamily.polygamousHouseCount)
      changed.polygamousHouseCount = newFamily.polygamousHouseCount;

    if (oldFamily.version !== newFamily.version) changed.version = newFamily.version;
    if (oldFamily.lastEventId !== newFamily.lastEventId)
      changed.lastEventId = newFamily.lastEventId ?? null;

    if (oldFamily.deletedAt !== newFamily.deletedAt)
      changed.deletedAt = newFamily.deletedAt ?? null;

    // Always update timestamp
    changed.updatedAt = new Date();

    return changed;
  }

  /**
   * Merge relationships from multiple sources
   * Useful when aggregating data from multiple repository calls
   */
  static mergeRelationships(
    ...sources: Array<{
      memberIds?: string[];
      marriageIds?: string[];
      polygamousHouseIds?: string[];
    }>
  ) {
    const memberIds = new Set<string>();
    const marriageIds = new Set<string>();
    const polygamousHouseIds = new Set<string>();

    sources.forEach((source) => {
      source.memberIds?.forEach((id) => memberIds.add(id));
      source.marriageIds?.forEach((id) => marriageIds.add(id));
      source.polygamousHouseIds?.forEach((id) => polygamousHouseIds.add(id));
    });

    return {
      memberIds: Array.from(memberIds),
      marriageIds: Array.from(marriageIds),
      polygamousHouseIds: Array.from(polygamousHouseIds),
    };
  }
}

/**
 * Factory for creating FamilyMapper with dependency injection support
 */
export class FamilyMapperFactory {
  static create(): FamilyMapper {
    return new FamilyMapper();
  }
}

/**
 * Type guard for Prisma Family with relationships
 */
export function isPrismaFamilyWithRelationships(family: any): family is PrismaFamily & {
  members?: { id: string }[];
  marriages?: { id: string }[];
  polygamousHouses?: { id: string }[];
} {
  return family && typeof family === 'object' && 'id' in family;
}
