// adoption-order.mapper.ts
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, AdoptionOrder as PrismaAdoptionOrder } from '@prisma/client';

import { AdoptionOrder, AdoptionOrderProps } from '../../../domain/entities/adoption-order.entity';

@Injectable()
export class AdoptionOrderMapper {
  private readonly logger = new Logger(AdoptionOrderMapper.name);

  /**
   * Converts Prisma AdoptionOrder record to Domain AdoptionOrder entity
   */
  toDomain(raw: PrismaAdoptionOrder | null): AdoptionOrder | null {
    if (!raw) return null;

    try {
      // 1. Safe JSON handling
      const hasConsents =
        raw.hasConsents && typeof raw.hasConsents === 'object'
          ? raw.hasConsents
          : { biologicalParents: false, spouse: false };

      // 2. Safe Array handling
      const consentDocuments: string[] = Array.isArray(raw.consentDocuments)
        ? raw.consentDocuments
        : [];

      // 3. String to Domain Logic
      // The entity expects 'string' for adoptionType in props, even though we have an Enum
      const props: AdoptionOrderProps = {
        id: raw.id,
        familyId: raw.familyId,
        adopteeId: raw.adopteeId,
        adopterId: raw.adopterId,
        adoptionType: raw.adoptionType,
        courtOrderNumber: raw.courtOrderNumber ?? undefined,
        adoptionDate: raw.adoptionDate,
        registrationDate: raw.registrationDate ?? undefined,
        hasConsents,
        consentDocuments,
        childWelfareReport: raw.childWelfareReport ?? undefined,
        suitabilityReport: raw.suitabilityReport ?? undefined,
        version: raw.version,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };

      return AdoptionOrder.createFromProps(props);
    } catch (error) {
      this.logger.error(`Failed to reconstitute AdoptionOrder ${raw?.id}`, error.stack);
      throw new Error(`Data integrity error for AdoptionOrder ${raw?.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain Entity to Persistence Input
   */
  toPersistence(entity: AdoptionOrder): Prisma.AdoptionOrderUncheckedCreateInput {
    const props = entity.toJSON(); // <--- Correct way to access properties

    return {
      id: props.id,
      familyId: props.familyId,
      adopteeId: props.adopteeId,
      adopterId: props.adopterId,
      adoptionType: props.adoptionType,
      courtOrderNumber: props.courtOrderNumber ?? null,
      adoptionDate: props.adoptionDate,
      registrationDate: props.registrationDate ?? null,
      hasConsents: props.hasConsents as Prisma.InputJsonValue,
      consentDocuments: props.consentDocuments,
      childWelfareReport: props.childWelfareReport ?? null,
      suitabilityReport: props.suitabilityReport ?? null,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts to Prisma Create Input (Optimized)
   */
  toPrismaCreate(entity: AdoptionOrder): Prisma.AdoptionOrderCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      // Use connect with IDs (Scalar) is faster than object connect
      family: { connect: { id: props.familyId } },
      adoptee: { connect: { id: props.adopteeId } },
      adopter: { connect: { id: props.adopterId } },

      adoptionType: props.adoptionType,
      courtOrderNumber: props.courtOrderNumber ?? null,
      adoptionDate: props.adoptionDate,
      registrationDate: props.registrationDate ?? null,
      hasConsents: props.hasConsents as Prisma.InputJsonValue,
      consentDocuments: props.consentDocuments,
      childWelfareReport: props.childWelfareReport ?? null,
      suitabilityReport: props.suitabilityReport ?? null,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts to Prisma Update Input
   */
  toPrismaUpdate(entity: AdoptionOrder): Prisma.AdoptionOrderUncheckedUpdateInput {
    const props = entity.toJSON();

    return {
      adoptionType: props.adoptionType,
      courtOrderNumber: props.courtOrderNumber ?? null,
      adoptionDate: props.adoptionDate,
      registrationDate: props.registrationDate ?? null,
      hasConsents: props.hasConsents as Prisma.InputJsonValue,
      consentDocuments: props.consentDocuments,
      childWelfareReport: props.childWelfareReport ?? null,
      suitabilityReport: props.suitabilityReport ?? null,
      version: props.version,
      updatedAt: props.updatedAt,
    };
  }

  // --- QUERY HELPERS ---

  createWhereById(id: string): Prisma.AdoptionOrderWhereUniqueInput {
    return { id };
  }

  createWhereByFamily(familyId: string): Prisma.AdoptionOrderWhereInput {
    return { familyId };
  }

  createIncludeClause(): Prisma.AdoptionOrderInclude {
    return {
      family: { select: { id: true, name: true } },
    };
  }

  /**
   * Validate Mapping Consistency
   * FIX: Uses toJSON() to access version, createdAt, etc. since no getters exist.
   */
  validateMapping(entity: AdoptionOrder, raw: PrismaAdoptionOrder): boolean {
    const props = entity.toJSON(); // <--- FIXED: Get all props here
    const errors: string[] = [];

    if (props.id !== raw.id) errors.push(`ID mismatch`);
    if (props.version !== raw.version) errors.push(`Version mismatch`);
    if (props.adoptionType !== raw.adoptionType) errors.push(`Type mismatch`);

    // Robust Date Comparison
    if (new Date(props.adoptionDate).getTime() !== new Date(raw.adoptionDate).getTime()) {
      errors.push(`Adoption Date mismatch`);
    }

    // Check optional dates
    if (props.registrationDate && raw.registrationDate) {
      if (new Date(props.registrationDate).getTime() !== new Date(raw.registrationDate).getTime()) {
        errors.push(`Registration Date mismatch`);
      }
    }

    if (errors.length > 0) {
      this.logger.warn(`Mapping validation failed for ${props.id}: ${errors.join(', ')}`);
      return false;
    }
    return true;
  }

  toDomainBatch(rawList: PrismaAdoptionOrder[]): AdoptionOrder[] {
    return rawList
      .map((raw) => this.toDomain(raw))
      .filter((item): item is AdoptionOrder => item !== null);
  }
}

export class AdoptionOrderMapperFactory {
  static create(): AdoptionOrderMapper {
    return new AdoptionOrderMapper();
  }
}
