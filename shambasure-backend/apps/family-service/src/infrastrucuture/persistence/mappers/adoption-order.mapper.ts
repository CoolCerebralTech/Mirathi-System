// adoption-order.mapper.ts
import { Injectable } from '@nestjs/common';
import { Prisma, AdoptionOrder as PrismaAdoptionOrder } from '@prisma/client';

import {
  AdoptionOrder,
  AdoptionOrderProps,
  AdoptionType,
} from '../../../domain/entities/adoption-order.entity';

@Injectable()
export class AdoptionOrderMapper {
  /**
   * Converts Prisma AdoptionOrder record to Domain AdoptionOrder entity
   * Handles JSON fields and proper type conversions
   */
  toDomain(raw: PrismaAdoptionOrder | null): AdoptionOrder | null {
    if (!raw) return null;

    try {
      // Parse JSON fields safely
      let hasConsents = raw.hasConsents;
      if (typeof hasConsents === 'string') {
        try {
          hasConsents = JSON.parse(hasConsents);
        } catch {
          hasConsents = { biologicalParents: false, spouse: false };
        }
      }

      // Ensure consentDocuments is an array
      let consentDocuments: string[] = [];
      if (Array.isArray(raw.consentDocuments)) {
        consentDocuments = raw.consentDocuments;
      } else if (typeof raw.consentDocuments === 'string') {
        try {
          const parsed = JSON.parse(raw.consentDocuments);
          if (Array.isArray(parsed)) {
            consentDocuments = parsed;
          }
        } catch {
          // Leave as empty array
        }
      }

      const props: AdoptionOrderProps = {
        id: raw.id,
        familyId: raw.familyId,
        adopteeId: raw.adopteeId,
        adopterId: raw.adopterId,
        adoptionType: raw.adoptionType,
        courtOrderNumber: raw.courtOrderNumber ?? undefined,
        adoptionDate: new Date(raw.adoptionDate),
        registrationDate: raw.registrationDate ? new Date(raw.registrationDate) : undefined,
        hasConsents,
        consentDocuments,
        childWelfareReport: raw.childWelfareReport ?? undefined,
        suitabilityReport: raw.suitabilityReport ?? undefined,
        version: raw.version,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
      };

      return AdoptionOrder.createFromProps(props);
    } catch (error) {
      console.error('Error reconstituting AdoptionOrder from persistence:', error);
      throw new Error(`Failed to reconstitute AdoptionOrder ${raw.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain AdoptionOrder entity to Prisma create/update input
   * Properly serializes JSON fields and handles all data types
   */
  toPersistence(entity: AdoptionOrder): Prisma.AdoptionOrderUncheckedCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      familyId: props.familyId,
      adopteeId: props.adopteeId,
      adopterId: props.adopterId,
      adoptionType: props.adoptionType,
      courtOrderNumber: props.courtOrderNumber,
      adoptionDate: props.adoptionDate,
      registrationDate: props.registrationDate,
      hasConsents: props.hasConsents as Prisma.JsonValue,
      consentDocuments: props.consentDocuments,
      childWelfareReport: props.childWelfareReport,
      suitabilityReport: props.suitabilityReport,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates a partial update DTO from domain changes
   * Useful for updating only changed fields
   */
  toPrismaUpdate(entity: AdoptionOrder): Prisma.AdoptionOrderUncheckedUpdateInput {
    const props = entity.toJSON();

    return {
      adoptionType: props.adoptionType,
      courtOrderNumber: props.courtOrderNumber,
      adoptionDate: props.adoptionDate,
      registrationDate: props.registrationDate,
      hasConsents: props.hasConsents as Prisma.JsonValue,
      consentDocuments: props.consentDocuments,
      childWelfareReport: props.childWelfareReport,
      suitabilityReport: props.suitabilityReport,
      version: props.version,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts domain entity to Prisma create input
   * For initial creation with all required fields
   */
  toPrismaCreate(entity: AdoptionOrder): Prisma.AdoptionOrderCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      family: { connect: { id: props.familyId } },
      adoptee: { connect: { id: props.adopteeId } },
      adopter: { connect: { id: props.adopterId } },
      adoptionType: props.adoptionType,
      courtOrderNumber: props.courtOrderNumber,
      adoptionDate: props.adoptionDate,
      registrationDate: props.registrationDate,
      hasConsents: props.hasConsents as Prisma.JsonValue,
      consentDocuments: props.consentDocuments,
      childWelfareReport: props.childWelfareReport,
      suitabilityReport: props.suitabilityReport,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates Prisma where clause for finding by ID
   */
  createWhereById(id: string): Prisma.AdoptionOrderWhereUniqueInput {
    return { id };
  }

  /**
   * Creates Prisma where clause for finding by court order number
   */
  createWhereByCourtOrderNumber(courtOrderNumber: string): Prisma.AdoptionOrderWhereInput {
    return { courtOrderNumber };
  }

  /**
   * Creates Prisma where clause for finding by family
   */
  createWhereByFamily(familyId: string): Prisma.AdoptionOrderWhereInput {
    return { familyId };
  }

  /**
   * Creates Prisma where clause for finding by adoptee
   */
  createWhereByAdoptee(adopteeId: string): Prisma.AdoptionOrderWhereInput {
    return { adopteeId };
  }

  /**
   * Creates Prisma where clause for finding by adopter
   */
  createWhereByAdopter(adopterId: string): Prisma.AdoptionOrderWhereInput {
    return { adopterId };
  }

  /**
   * Creates Prisma include clause for eager loading relationships
   */
  createIncludeClause(): Prisma.AdoptionOrderInclude {
    return {
      family: true,
      adoptee: true,
      adopter: true,
    };
  }

  /**
   * Validates mapping consistency between domain and persistence
   */
  validateMapping(entity: AdoptionOrder, raw: PrismaAdoptionOrder): boolean {
    const errors: string[] = [];

    // Basic ID validation
    if (entity.id !== raw.id) {
      errors.push(`ID mismatch: Domain=${entity.id}, Persistence=${raw.id}`);
    }

    // Version validation for optimistic concurrency
    if (entity.version !== raw.version) {
      errors.push(`Version mismatch: Domain=${entity.version}, Persistence=${raw.version}`);
    }

    // Validate adoption type
    if (entity.adoptionType !== raw.adoptionType) {
      errors.push(
        `Adoption type mismatch: Domain=${entity.adoptionType}, Persistence=${raw.adoptionType}`,
      );
    }

    // Validate court order number consistency
    if (entity.courtOrderNumber !== (raw.courtOrderNumber || undefined)) {
      errors.push(
        `Court order number mismatch: Domain=${entity.courtOrderNumber}, Persistence=${raw.courtOrderNumber}`,
      );
    }

    // Validate dates
    const rawAdoptionDate = new Date(raw.adoptionDate);
    if (entity.adoptionDate.getTime() !== rawAdoptionDate.getTime()) {
      errors.push(
        `Adoption date mismatch: Domain=${entity.adoptionDate}, Persistence=${rawAdoptionDate}`,
      );
    }

    if (entity.registrationDate && raw.registrationDate) {
      const rawRegistrationDate = new Date(raw.registrationDate);
      if (entity.registrationDate.getTime() !== rawRegistrationDate.getTime()) {
        errors.push(
          `Registration date mismatch: Domain=${entity.registrationDate}, Persistence=${rawRegistrationDate}`,
        );
      }
    } else if (
      entity.registrationDate !==
      (raw.registrationDate ? new Date(raw.registrationDate) : undefined)
    ) {
      errors.push(`Registration date presence mismatch`);
    }

    // Validate compliance flags
    const domainCompliant = entity.isCompliantWithChildrenAct;
    const persistenceCompliant = this.determinePersistenceCompliance(raw);

    if (domainCompliant !== persistenceCompliant) {
      errors.push(
        `Compliance mismatch: Domain=${domainCompliant}, Persistence=${persistenceCompliant}`,
      );
    }

    if (errors.length > 0) {
      console.warn('AdoptionOrder mapping validation errors:', errors);
      return false;
    }

    return true;
  }

  /**
   * Determines compliance from persistence data
   */
  private determinePersistenceCompliance(raw: PrismaAdoptionOrder): boolean {
    const isStatutory = raw.adoptionType === AdoptionType.STATUTORY;
    const isCustomary = raw.adoptionType === AdoptionType.CUSTOMARY;

    // Parse hasConsents safely
    let hasConsents: any;
    if (typeof raw.hasConsents === 'string') {
      try {
        hasConsents = JSON.parse(raw.hasConsents);
      } catch {
        hasConsents = { biologicalParents: false, spouse: false };
      }
    } else {
      hasConsents = raw.hasConsents || {};
    }

    if (isStatutory) {
      return (
        !!raw.courtOrderNumber &&
        !!raw.childWelfareReport &&
        !!raw.suitabilityReport &&
        (hasConsents?.biologicalParents || raw.courtOrderNumber)
      );
    }

    if (isCustomary) {
      return hasConsents?.biologicalParents === true || raw.courtOrderNumber !== null;
    }

    return !!raw.registrationDate;
  }

  /**
   * Extracts relationship IDs from Prisma result with includes
   */
  extractRelationships(
    prismaAdoption: PrismaAdoptionOrder & {
      family?: { id: string };
      adoptee?: { id: string };
      adopter?: { id: string };
    },
  ) {
    return {
      familyId: prismaAdoption.family?.id || prismaAdoption.familyId,
      adopteeId: prismaAdoption.adoptee?.id || prismaAdoption.adopteeId,
      adopterId: prismaAdoption.adopter?.id || prismaAdoption.adopterId,
    };
  }

  /**
   * Creates a batch mapper for multiple adoption orders
   */
  toDomainBatch(rawList: PrismaAdoptionOrder[]): AdoptionOrder[] {
    return rawList.map((raw) => this.toDomain(raw)).filter(Boolean) as AdoptionOrder[];
  }

  /**
   * Creates batch persistence data
   */
  toPersistenceBatch(entityList: AdoptionOrder[]): Prisma.AdoptionOrderUncheckedCreateInput[] {
    return entityList.map((entity) => this.toPersistence(entity));
  }

  /**
   * Checks if adoption is finalized based on persistence data
   */
  isFinalizedInPersistence(raw: PrismaAdoptionOrder): boolean {
    return !!raw.registrationDate;
  }

  /**
   * Gets adoption type enum from persistence
   */
  getAdoptionTypeFromPersistence(raw: PrismaAdoptionOrder): AdoptionType {
    return raw.adoptionType as AdoptionType;
  }

  /**
   * Creates filter for finalized adoptions
   */
  createFinalizedFilter(isFinalized: boolean = true): Prisma.AdoptionOrderWhereInput {
    if (isFinalized) {
      return { registrationDate: { not: null } };
    }
    return { registrationDate: null };
  }

  /**
   * Creates filter by adoption type
   */
  createTypeFilter(adoptionType: AdoptionType): Prisma.AdoptionOrderWhereInput {
    return { adoptionType };
  }

  /**
   * Creates filter for adoptions requiring court orders
   */
  createRequiresCourtOrderFilter(): Prisma.AdoptionOrderWhereInput {
    return {
      OR: [{ adoptionType: AdoptionType.STATUTORY }, { adoptionType: AdoptionType.INTER_COUNTRY }],
    };
  }

  /**
   * Creates sort order for adoption orders
   */
  createSortOrder(
    sortBy: 'adoptionDate' | 'registrationDate' | 'createdAt' = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Prisma.AdoptionOrderOrderByWithRelationInput {
    return { [sortBy]: order };
  }

  /**
   * Helper to extract adoption statistics from persistence data
   */
  extractStatistics(rawList: PrismaAdoptionOrder[]): {
    total: number;
    finalized: number;
    byType: Record<string, number>;
    byYear: Record<number, number>;
  } {
    const stats = {
      total: rawList.length,
      finalized: 0,
      byType: {} as Record<string, number>,
      byYear: {} as Record<number, number>,
    };

    rawList.forEach((raw) => {
      // Count finalized
      if (raw.registrationDate) {
        stats.finalized++;
      }

      // Count by type
      stats.byType[raw.adoptionType] = (stats.byType[raw.adoptionType] || 0) + 1;

      // Count by year
      const year = raw.adoptionDate.getFullYear();
      stats.byYear[year] = (stats.byYear[year] || 0) + 1;
    });

    return stats;
  }
}

/**
 * Factory for creating AdoptionOrderMapper with dependency injection support
 */
export class AdoptionOrderMapperFactory {
  static create(): AdoptionOrderMapper {
    return new AdoptionOrderMapper();
  }
}

/**
 * Type guard for Prisma AdoptionOrder with relationships
 */
export function isPrismaAdoptionOrderWithRelationships(
  adoption: any,
): adoption is PrismaAdoptionOrder & {
  family?: { id: string };
  adoptee?: { id: string };
  adopter?: { id: string };
} {
  return adoption && typeof adoption === 'object' && 'id' in adoption && 'familyId' in adoption;
}
