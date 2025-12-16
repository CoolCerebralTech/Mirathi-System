// legal-dependant.mapper.ts
import { Injectable } from '@nestjs/common';
import {
  DependencyLevel,
  KenyanLawSection,
  Prisma,
  LegalDependant as PrismaLegalDependant,
} from '@prisma/client';

import {
  LegalDependant,
  LegalDependantProps,
} from '../../../domain/entities/legal-dependant.entity';

@Injectable()
export class LegalDependantMapper {
  /**
   * Converts Prisma LegalDependant to Domain LegalDependant entity
   * Handles JSON fields and complex enum mappings
   */
  toDomain(raw: PrismaLegalDependant | null): LegalDependant | null {
    if (!raw) return null;

    try {
      // Parse JSON fields safely
      let dependencyProofDocuments: any[] = [];
      if (raw.dependencyProofDocuments && raw.dependencyProofDocuments !== Prisma.JsonNull) {
        if (typeof raw.dependencyProofDocuments === 'string') {
          try {
            const parsed = JSON.parse(raw.dependencyProofDocuments);
            if (Array.isArray(parsed)) {
              dependencyProofDocuments = parsed;
            }
          } catch {
            console.warn('Failed to parse dependencyProofDocuments JSON');
          }
        } else if (Array.isArray(raw.dependencyProofDocuments)) {
          dependencyProofDocuments = raw.dependencyProofDocuments;
        }
      }

      const props: LegalDependantProps = {
        id: raw.id,
        deceasedId: raw.deceasedId,
        dependantId: raw.dependantId,
        basisSection: raw.basisSection as KenyanLawSection | undefined,
        dependencyBasis: raw.dependencyBasis,
        dependencyLevel: raw.dependencyLevel,
        isMinor: raw.isMinor,
        isClaimant: raw.isClaimant,
        claimAmount: raw.claimAmount ?? undefined,
        provisionAmount: raw.provisionAmount ?? undefined,
        currency: raw.currency,
        courtOrderReference: raw.courtOrderReference ?? undefined,
        courtOrderDate: raw.courtOrderDate ? new Date(raw.courtOrderDate) : undefined,
        monthlySupport: raw.monthlySupport ?? undefined,
        supportStartDate: raw.supportStartDate ? new Date(raw.supportStartDate) : undefined,
        supportEndDate: raw.supportEndDate ? new Date(raw.supportEndDate) : undefined,
        assessmentDate: new Date(raw.assessmentDate),
        assessmentMethod: raw.assessmentMethod ?? undefined,
        dependencyPercentage: raw.dependencyPercentage,
        ageLimit: raw.ageLimit ?? undefined,
        isStudent: raw.isStudent,
        studentUntil: raw.studentUntil ? new Date(raw.studentUntil) : undefined,
        custodialParentId: raw.custodialParentId ?? undefined,
        provisionOrderIssued: raw.provisionOrderIssued,
        provisionOrderNumber: raw.provisionOrderNumber ?? undefined,
        courtApprovedAmount: raw.courtApprovedAmount ?? undefined,
        monthlySupportEvidence: raw.monthlySupportEvidence ?? undefined,
        dependencyRatio: raw.dependencyRatio ?? undefined,
        hasPhysicalDisability: raw.hasPhysicalDisability,
        hasMentalDisability: raw.hasMentalDisability,
        requiresOngoingCare: raw.requiresOngoingCare,
        disabilityDetails: raw.disabilityDetails ?? undefined,
        dependencyProofDocuments:
          dependencyProofDocuments.length > 0 ? dependencyProofDocuments : undefined,
        verifiedByCourtAt: raw.verifiedByCourtAt ? new Date(raw.verifiedByCourtAt) : undefined,
        version: raw.version,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
      };

      return LegalDependant.createFromProps(props);
    } catch (error) {
      console.error('Error reconstituting LegalDependant from persistence:', error);
      throw new Error(`Failed to reconstitute LegalDependant ${raw.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain LegalDependant entity to Prisma create/update input
   */
  toPersistence(entity: LegalDependant): Prisma.LegalDependantUncheckedCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      deceasedId: props.deceasedId,
      dependantId: props.dependantId,
      basisSection: props.basisSection,
      dependencyBasis: props.dependencyBasis,
      dependencyLevel: props.dependencyLevel,
      isMinor: props.isMinor,
      isClaimant: props.isClaimant,
      claimAmount: props.claimAmount,
      provisionAmount: props.provisionAmount,
      currency: props.currency,
      courtOrderReference: props.courtOrderReference,
      courtOrderDate: props.courtOrderDate,
      monthlySupport: props.monthlySupport,
      supportStartDate: props.supportStartDate,
      supportEndDate: props.supportEndDate,
      assessmentDate: props.assessmentDate,
      assessmentMethod: props.assessmentMethod,
      dependencyPercentage: props.dependencyPercentage,
      ageLimit: props.ageLimit,
      isStudent: props.isStudent,
      studentUntil: props.studentUntil,
      custodialParentId: props.custodialParentId,
      provisionOrderIssued: props.provisionOrderIssued,
      provisionOrderNumber: props.provisionOrderNumber,
      courtApprovedAmount: props.courtApprovedAmount,
      monthlySupportEvidence: props.monthlySupportEvidence,
      dependencyRatio: props.dependencyRatio,
      hasPhysicalDisability: props.hasPhysicalDisability,
      hasMentalDisability: props.hasMentalDisability,
      requiresOngoingCare: props.requiresOngoingCare,
      disabilityDetails: props.disabilityDetails,
      dependencyProofDocuments: props.dependencyProofDocuments
        ? (props.dependencyProofDocuments as Prisma.JsonValue)
        : Prisma.JsonNull,
      verifiedByCourtAt: props.verifiedByCourtAt,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates a partial update DTO from domain changes
   */
  toPrismaUpdate(entity: LegalDependant): Prisma.LegalDependantUncheckedUpdateInput {
    const props = entity.toJSON();

    return {
      basisSection: props.basisSection,
      dependencyBasis: props.dependencyBasis,
      dependencyLevel: props.dependencyLevel,
      isMinor: props.isMinor,
      isClaimant: props.isClaimant,
      claimAmount: props.claimAmount,
      provisionAmount: props.provisionAmount,
      currency: props.currency,
      courtOrderReference: props.courtOrderReference,
      courtOrderDate: props.courtOrderDate,
      monthlySupport: props.monthlySupport,
      supportStartDate: props.supportStartDate,
      supportEndDate: props.supportEndDate,
      assessmentDate: props.assessmentDate,
      assessmentMethod: props.assessmentMethod,
      dependencyPercentage: props.dependencyPercentage,
      ageLimit: props.ageLimit,
      isStudent: props.isStudent,
      studentUntil: props.studentUntil,
      custodialParentId: props.custodialParentId,
      provisionOrderIssued: props.provisionOrderIssued,
      provisionOrderNumber: props.provisionOrderNumber,
      courtApprovedAmount: props.courtApprovedAmount,
      monthlySupportEvidence: props.monthlySupportEvidence,
      dependencyRatio: props.dependencyRatio,
      hasPhysicalDisability: props.hasPhysicalDisability,
      hasMentalDisability: props.hasMentalDisability,
      requiresOngoingCare: props.requiresOngoingCare,
      disabilityDetails: props.disabilityDetails,
      dependencyProofDocuments: props.dependencyProofDocuments
        ? (props.dependencyProofDocuments as Prisma.JsonValue)
        : Prisma.JsonNull,
      verifiedByCourtAt: props.verifiedByCourtAt,
      version: props.version,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts domain entity to Prisma create input with relationships
   */
  toPrismaCreate(entity: LegalDependant): Prisma.LegalDependantCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      deceased: { connect: { id: props.deceasedId } },
      dependant: { connect: { id: props.dependantId } },
      basisSection: props.basisSection,
      dependencyBasis: props.dependencyBasis,
      dependencyLevel: props.dependencyLevel,
      isMinor: props.isMinor,
      isClaimant: props.isClaimant,
      claimAmount: props.claimAmount,
      provisionAmount: props.provisionAmount,
      currency: props.currency,
      courtOrderReference: props.courtOrderReference,
      courtOrderDate: props.courtOrderDate,
      monthlySupport: props.monthlySupport,
      supportStartDate: props.supportStartDate,
      supportEndDate: props.supportEndDate,
      assessmentDate: props.assessmentDate,
      assessmentMethod: props.assessmentMethod,
      dependencyPercentage: props.dependencyPercentage,
      ageLimit: props.ageLimit,
      isStudent: props.isStudent,
      studentUntil: props.studentUntil,
      custodialParentId: props.custodialParentId,
      provisionOrderIssued: props.provisionOrderIssued,
      provisionOrderNumber: props.provisionOrderNumber,
      courtApprovedAmount: props.courtApprovedAmount,
      monthlySupportEvidence: props.monthlySupportEvidence,
      dependencyRatio: props.dependencyRatio,
      hasPhysicalDisability: props.hasPhysicalDisability,
      hasMentalDisability: props.hasMentalDisability,
      requiresOngoingCare: props.requiresOngoingCare,
      disabilityDetails: props.disabilityDetails,
      dependencyProofDocuments: props.dependencyProofDocuments
        ? (props.dependencyProofDocuments as Prisma.JsonValue)
        : Prisma.JsonNull,
      verifiedByCourtAt: props.verifiedByCourtAt,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates Prisma where clause for finding by ID
   */
  createWhereById(id: string): Prisma.LegalDependantWhereUniqueInput {
    return { id };
  }

  /**
   * Creates Prisma where clause for finding by deceased person
   */
  createWhereByDeceased(deceasedId: string): Prisma.LegalDependantWhereInput {
    return { deceasedId };
  }

  /**
   * Creates Prisma where clause for finding by dependant
   */
  createWhereByDependant(dependantId: string): Prisma.LegalDependantWhereInput {
    return { dependantId };
  }

  /**
   * Creates Prisma where clause for S.26 claimants
   */
  createWhereSection26Claimants(): Prisma.LegalDependantWhereInput {
    return {
      basisSection: KenyanLawSection.S26_DEPENDANT_PROVISION,
      isClaimant: true,
    };
  }

  /**
   * Creates Prisma where clause for S.29 dependants
   */
  createWhereSection29Dependants(): Prisma.LegalDependantWhereInput {
    return {
      basisSection: KenyanLawSection.S29_DEPENDANTS,
    };
  }

  /**
   * Creates Prisma where clause for minor dependants
   */
  createWhereMinorDependants(): Prisma.LegalDependantWhereInput {
    return { isMinor: true };
  }

  /**
   * Creates Prisma where clause for dependants with disabilities
   */
  createWhereDisabledDependants(): Prisma.LegalDependantWhereInput {
    return {
      OR: [{ hasPhysicalDisability: true }, { hasMentalDisability: true }],
    };
  }

  /**
   * Creates Prisma where clause for dependants with court orders
   */
  createWhereWithCourtOrders(): Prisma.LegalDependantWhereInput {
    return {
      provisionOrderIssued: true,
      courtOrderReference: { not: null },
    };
  }

  /**
   * Creates Prisma where clause for qualifying S.29 dependants
   */
  createWhereQualifyingS29(): Prisma.LegalDependantWhereInput {
    return {
      basisSection: KenyanLawSection.S29_DEPENDANTS,
      dependencyPercentage: { gt: 0 },
      OR: [{ dependencyLevel: DependencyLevel.FULL }, { dependencyLevel: DependencyLevel.PARTIAL }],
    };
  }

  /**
   * Creates Prisma include clause for eager loading relationships
   */
  createIncludeClause(): Prisma.LegalDependantInclude {
    return {
      deceased: true,
      dependant: true,
      dependantEvidences: true,
      custodialParent: true,
    };
  }

  /**
   * Validates mapping consistency between domain and persistence
   */
  validateMapping(entity: LegalDependant, raw: PrismaLegalDependant): boolean {
    const errors: string[] = [];

    // Basic ID validation
    if (entity.id !== raw.id) {
      errors.push(`ID mismatch: Domain=${entity.id}, Persistence=${raw.id}`);
    }

    // Version validation for optimistic concurrency
    if (entity.version !== raw.version) {
      errors.push(`Version mismatch: Domain=${entity.version}, Persistence=${raw.version}`);
    }

    // Validate relationship IDs
    if (entity.deceasedId !== raw.deceasedId) {
      errors.push(
        `Deceased ID mismatch: Domain=${entity.deceasedId}, Persistence=${raw.deceasedId}`,
      );
    }

    if (entity.dependantId !== raw.dependantId) {
      errors.push(
        `Dependant ID mismatch: Domain=${entity.dependantId}, Persistence=${raw.dependantId}`,
      );
    }

    // Validate S.29 qualification
    const domainQualifies = entity.qualifiesForS29;
    const persistenceQualifies = this.determineS29QualificationFromPersistence(raw);

    if (domainQualifies !== persistenceQualifies) {
      errors.push(
        `S.29 qualification mismatch: Domain=${domainQualifies}, Persistence=${persistenceQualifies}`,
      );
    }

    // Validate S.26 claim status
    const domainClaimStatus = entity.s26ClaimStatus;
    const persistenceClaimStatus = this.determineS26ClaimStatusFromPersistence(raw);

    if (domainClaimStatus !== persistenceClaimStatus) {
      errors.push(
        `S.26 claim status mismatch: Domain=${domainClaimStatus}, Persistence=${persistenceClaimStatus}`,
      );
    }

    // Validate dependency percentage
    if (entity.dependencyPercentage !== raw.dependencyPercentage) {
      errors.push(
        `Dependency percentage mismatch: Domain=${entity.dependencyPercentage}, Persistence=${raw.dependencyPercentage}`,
      );
    }

    if (errors.length > 0) {
      console.warn('LegalDependant mapping validation errors:', errors);
      return false;
    }

    return true;
  }

  /**
   * Determines S.29 qualification from persistence data
   */
  private determineS29QualificationFromPersistence(raw: PrismaLegalDependant): boolean {
    const isPriorityDependant = ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(raw.dependencyBasis);

    if (isPriorityDependant) return true;
    if (raw.dependencyPercentage > 0) return true;
    if ((raw.hasPhysicalDisability || raw.hasMentalDisability) && raw.requiresOngoingCare)
      return true;
    if (raw.isMinor || raw.isStudent) return true;

    return false;
  }

  /**
   * Determines S.26 claim status from persistence data
   */
  private determineS26ClaimStatusFromPersistence(
    raw: PrismaLegalDependant,
  ): 'NO_CLAIM' | 'PENDING' | 'APPROVED' | 'DENIED' {
    if (!raw.isClaimant) return 'NO_CLAIM';
    if (raw.provisionOrderIssued && raw.courtApprovedAmount) return 'APPROVED';
    if (raw.provisionOrderIssued && !raw.courtApprovedAmount) return 'DENIED';
    return 'PENDING';
  }

  /**
   * Extracts relationship IDs from Prisma result with includes
   */
  extractRelationships(
    prismaDependant: PrismaLegalDependant & {
      deceased?: { id: string };
      dependant?: { id: string };
      custodialParent?: { id: string };
    },
  ) {
    return {
      deceasedId: prismaDependant.deceased?.id || prismaDependant.deceasedId,
      dependantId: prismaDependant.dependant?.id || prismaDependant.dependantId,
      custodialParentId: prismaDependant.custodialParent?.id || prismaDependant.custodialParentId,
    };
  }

  /**
   * Creates a batch mapper for multiple legal dependants
   */
  toDomainBatch(rawList: PrismaLegalDependant[]): LegalDependant[] {
    return rawList.map((raw) => this.toDomain(raw)).filter(Boolean) as LegalDependant[];
  }

  /**
   * Creates batch persistence data
   */
  toPersistenceBatch(entityList: LegalDependant[]): Prisma.LegalDependantUncheckedCreateInput[] {
    return entityList.map((entity) => this.toPersistence(entity));
  }

  /**
   * Calculates dependency ratio from persistence data
   */
  calculateDependencyRatio(monthlySupport?: number, monthlyIncome?: number): number | undefined {
    if (!monthlySupport || !monthlyIncome || monthlyIncome === 0) {
      return undefined;
    }

    return (monthlySupport / monthlyIncome) * 100;
  }

  /**
   * Creates filter for dependants by dependency level
   */
  createDependencyLevelFilter(level: DependencyLevel): Prisma.LegalDependantWhereInput {
    return { dependencyLevel: level };
  }

  /**
   * Creates filter for dependants by assessment date range
   */
  createAssessmentDateFilter(startDate?: Date, endDate?: Date): Prisma.LegalDependantWhereInput {
    const filter: any = {};

    if (startDate) {
      filter.assessmentDate = { gte: startDate };
    }

    if (endDate) {
      filter.assessmentDate = { ...filter.assessmentDate, lte: endDate };
    }

    return filter;
  }

  /**
   * Creates sort order for legal dependants
   */
  createSortOrder(
    sortBy: 'dependencyPercentage' | 'assessmentDate' | 'createdAt' = 'dependencyPercentage',
    order: 'asc' | 'desc' = 'desc',
  ): Prisma.LegalDependantOrderByWithRelationInput {
    return { [sortBy]: order };
  }

  /**
   * Helper to extract dependant statistics from persistence data
   */
  extractStatistics(rawList: PrismaLegalDependant[]): {
    total: number;
    section26: number;
    section29: number;
    minors: number;
    students: number;
    disabled: number;
    withCourtOrders: number;
    byDependencyLevel: Record<string, number>;
  } {
    const stats = {
      total: rawList.length,
      section26: 0,
      section29: 0,
      minors: 0,
      students: 0,
      disabled: 0,
      withCourtOrders: 0,
      byDependencyLevel: {} as Record<string, number>,
    };

    rawList.forEach((raw) => {
      // Count by law section
      if (raw.basisSection === KenyanLawSection.S26_DEPENDANT_PROVISION) {
        stats.section26++;
      } else if (raw.basisSection === KenyanLawSection.S29_DEPENDANTS) {
        stats.section29++;
      }

      // Count minors
      if (raw.isMinor) {
        stats.minors++;
      }

      // Count students
      if (raw.isStudent) {
        stats.students++;
      }

      // Count disabled
      if (raw.hasPhysicalDisability || raw.hasMentalDisability) {
        stats.disabled++;
      }

      // Count with court orders
      if (raw.provisionOrderIssued) {
        stats.withCourtOrders++;
      }

      // Group by dependency level
      const level = raw.dependencyLevel;
      stats.byDependencyLevel[level] = (stats.byDependencyLevel[level] || 0) + 1;
    });

    return stats;
  }

  /**
   * Creates filter for dependants that require immediate attention
   */
  createUrgentAttentionFilter(): Prisma.LegalDependantWhereInput {
    return {
      OR: [
        {
          // Minor dependants without custodial parent
          isMinor: true,
          custodialParentId: null,
        },
        {
          // Dependants with disabilities requiring care
          OR: [{ hasPhysicalDisability: true }, { hasMentalDisability: true }],
          requiresOngoingCare: true,
        },
        {
          // S.26 claimants with pending court orders
          isClaimant: true,
          provisionOrderIssued: false,
        },
      ],
    };
  }

  /**
   * Creates filter for dependants eligible for estate distribution
   */
  createEstateDistributionFilter(): Prisma.LegalDependantWhereInput {
    return {
      OR: [
        {
          // Priority dependants under S.29
          dependencyBasis: { in: ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'] },
          dependencyPercentage: { gt: 0 },
        },
        {
          // Dependants with court orders
          provisionOrderIssued: true,
          courtApprovedAmount: { gt: 0 },
        },
      ],
    };
  }
}

/**
 * Factory for creating LegalDependantMapper with dependency injection support
 */
export class LegalDependantMapperFactory {
  static create(): LegalDependantMapper {
    return new LegalDependantMapper();
  }
}

/**
 * Type guard for Prisma LegalDependant with relationships
 */
export function isPrismaLegalDependantWithRelationships(
  dependant: any,
): dependant is PrismaLegalDependant & {
  deceased?: { id: string };
  dependant?: { id: string };
  custodialParent?: { id: string };
  dependantEvidences?: any[];
} {
  return (
    dependant && typeof dependant === 'object' && 'id' in dependant && 'deceasedId' in dependant
  );
}

/**
 * Helper to validate S.29 dependency basis
 */
export function isValidS29Basis(basis: string): boolean {
  const validBases = [
    'SPOUSE',
    'CHILD',
    'ADOPTED_CHILD',
    'STEPCHILD',
    'PARENT',
    'SIBLING',
    'GRANDCHILD',
    'GRANDPARENT',
    'NIECE_NEPHEW',
    'AUNT_UNCLE',
    'COUSIN',
    'OTHER',
  ];

  return validBases.includes(basis);
}

/**
 * Helper to validate dependency percentage for legal requirements
 */
export function validateDependencyPercentage(percentage: number): boolean {
  return percentage >= 0 && percentage <= 100;
}

/**
 * Helper to calculate dependency level from percentage
 */
export function calculateDependencyLevelFromPercentage(percentage: number): DependencyLevel {
  if (percentage >= 75) {
    return DependencyLevel.FULL;
  } else if (percentage >= 25) {
    return DependencyLevel.PARTIAL;
  } else {
    return DependencyLevel.NONE;
  }
}
