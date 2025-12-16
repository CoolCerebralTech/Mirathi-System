import { Injectable, Logger } from '@nestjs/common';
import { Prisma, LegalDependant as PrismaLegalDependant } from '@prisma/client';

import {
  LegalDependant,
  LegalDependantProps,
} from '../../../domain/entities/legal-dependant.entity';

@Injectable()
export class LegalDependantMapper {
  private readonly logger = new Logger(LegalDependantMapper.name);

  /**
   * Converts Prisma LegalDependant to Domain LegalDependant entity
   */
  toDomain(raw: PrismaLegalDependant | null): LegalDependant | null {
    if (!raw) return null;

    try {
      // 1. Safe JSON Parsing for Evidence Documents
      let dependencyProofDocuments: any[] = [];
      if (Array.isArray(raw.dependencyProofDocuments)) {
        dependencyProofDocuments = raw.dependencyProofDocuments;
      }

      const props: LegalDependantProps = {
        id: raw.id,
        deceasedId: raw.deceasedId,
        dependantId: raw.dependantId,
        basisSection: raw.basisSection ?? undefined,
        dependencyBasis: raw.dependencyBasis,
        dependencyLevel: raw.dependencyLevel,
        isMinor: raw.isMinor,
        isClaimant: raw.isClaimant,
        claimAmount: raw.claimAmount ?? undefined,
        provisionAmount: raw.provisionAmount ?? undefined,
        currency: raw.currency,
        courtOrderReference: raw.courtOrderReference ?? undefined,
        courtOrderDate: raw.courtOrderDate ?? undefined,
        monthlySupport: raw.monthlySupport ?? undefined,
        supportStartDate: raw.supportStartDate ?? undefined,
        supportEndDate: raw.supportEndDate ?? undefined,
        assessmentDate: raw.assessmentDate,
        assessmentMethod: raw.assessmentMethod ?? undefined,
        dependencyPercentage: raw.dependencyPercentage,
        ageLimit: raw.ageLimit ?? undefined,
        isStudent: raw.isStudent,
        studentUntil: raw.studentUntil ?? undefined,
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
        verifiedByCourtAt: raw.verifiedByCourtAt ?? undefined,
        version: raw.version,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };

      return LegalDependant.createFromProps(props);
    } catch (error) {
      this.logger.error(`Failed to reconstitute LegalDependant ${raw?.id}`, error.stack);
      throw new Error(`Data integrity error for LegalDependant ${raw?.id}: ${error.message}`);
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
      basisSection: props.basisSection ?? null,
      dependencyBasis: props.dependencyBasis,
      dependencyLevel: props.dependencyLevel,
      isMinor: props.isMinor,
      isClaimant: props.isClaimant,
      claimAmount: props.claimAmount ?? null,
      provisionAmount: props.provisionAmount ?? null,
      currency: props.currency,
      courtOrderReference: props.courtOrderReference ?? null,
      courtOrderDate: props.courtOrderDate ?? null,
      monthlySupport: props.monthlySupport ?? null,
      supportStartDate: props.supportStartDate ?? null,
      supportEndDate: props.supportEndDate ?? null,
      assessmentDate: props.assessmentDate,
      assessmentMethod: props.assessmentMethod ?? null,
      dependencyPercentage: props.dependencyPercentage,
      ageLimit: props.ageLimit ?? null,
      isStudent: props.isStudent,
      studentUntil: props.studentUntil ?? null,
      custodialParentId: props.custodialParentId ?? null,
      provisionOrderIssued: props.provisionOrderIssued,
      provisionOrderNumber: props.provisionOrderNumber ?? null,
      courtApprovedAmount: props.courtApprovedAmount ?? null,
      monthlySupportEvidence: props.monthlySupportEvidence ?? null,
      dependencyRatio: props.dependencyRatio ?? null,
      hasPhysicalDisability: props.hasPhysicalDisability,
      hasMentalDisability: props.hasMentalDisability,
      requiresOngoingCare: props.requiresOngoingCare,
      disabilityDetails: props.disabilityDetails ?? null,
      // Cast Array to InputJsonValue
      dependencyProofDocuments: props.dependencyProofDocuments
        ? (props.dependencyProofDocuments as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      verifiedByCourtAt: props.verifiedByCourtAt ?? null,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts domain entity to Prisma create input (Optimized)
   */
  toPrismaCreate(entity: LegalDependant): Prisma.LegalDependantCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      // Use connect via ID for performance
      deceased: { connect: { id: props.deceasedId } },
      dependant: { connect: { id: props.dependantId } },
      // Optional custodial parent connection
      custodialParent: props.custodialParentId
        ? { connect: { id: props.custodialParentId } }
        : undefined,

      basisSection: props.basisSection ?? null,
      dependencyBasis: props.dependencyBasis,
      dependencyLevel: props.dependencyLevel,
      isMinor: props.isMinor,
      isClaimant: props.isClaimant,
      claimAmount: props.claimAmount ?? null,
      provisionAmount: props.provisionAmount ?? null,
      currency: props.currency,
      courtOrderReference: props.courtOrderReference ?? null,
      courtOrderDate: props.courtOrderDate ?? null,
      monthlySupport: props.monthlySupport ?? null,
      supportStartDate: props.supportStartDate ?? null,
      supportEndDate: props.supportEndDate ?? null,
      assessmentDate: props.assessmentDate,
      assessmentMethod: props.assessmentMethod ?? null,
      dependencyPercentage: props.dependencyPercentage,
      ageLimit: props.ageLimit ?? null,
      isStudent: props.isStudent,
      studentUntil: props.studentUntil ?? null,
      provisionOrderIssued: props.provisionOrderIssued,
      provisionOrderNumber: props.provisionOrderNumber ?? null,
      courtApprovedAmount: props.courtApprovedAmount ?? null,
      monthlySupportEvidence: props.monthlySupportEvidence ?? null,
      dependencyRatio: props.dependencyRatio ?? null,
      hasPhysicalDisability: props.hasPhysicalDisability,
      hasMentalDisability: props.hasMentalDisability,
      requiresOngoingCare: props.requiresOngoingCare,
      disabilityDetails: props.disabilityDetails ?? null,
      dependencyProofDocuments: props.dependencyProofDocuments
        ? (props.dependencyProofDocuments as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      verifiedByCourtAt: props.verifiedByCourtAt ?? null,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates a partial update DTO
   */
  toPrismaUpdate(entity: LegalDependant): Prisma.LegalDependantUncheckedUpdateInput {
    const props = entity.toJSON();

    return {
      basisSection: props.basisSection ?? null,
      dependencyBasis: props.dependencyBasis,
      dependencyLevel: props.dependencyLevel,
      isMinor: props.isMinor,
      isClaimant: props.isClaimant,
      claimAmount: props.claimAmount ?? null,
      provisionAmount: props.provisionAmount ?? null,
      currency: props.currency,
      courtOrderReference: props.courtOrderReference ?? null,
      courtOrderDate: props.courtOrderDate ?? null,
      monthlySupport: props.monthlySupport ?? null,
      supportStartDate: props.supportStartDate ?? null,
      supportEndDate: props.supportEndDate ?? null,
      assessmentDate: props.assessmentDate,
      assessmentMethod: props.assessmentMethod ?? null,
      dependencyPercentage: props.dependencyPercentage,
      ageLimit: props.ageLimit ?? null,
      isStudent: props.isStudent,
      studentUntil: props.studentUntil ?? null,
      custodialParentId: props.custodialParentId ?? null,
      provisionOrderIssued: props.provisionOrderIssued,
      provisionOrderNumber: props.provisionOrderNumber ?? null,
      courtApprovedAmount: props.courtApprovedAmount ?? null,
      monthlySupportEvidence: props.monthlySupportEvidence ?? null,
      dependencyRatio: props.dependencyRatio ?? null,
      hasPhysicalDisability: props.hasPhysicalDisability,
      hasMentalDisability: props.hasMentalDisability,
      requiresOngoingCare: props.requiresOngoingCare,
      disabilityDetails: props.disabilityDetails ?? null,
      dependencyProofDocuments: props.dependencyProofDocuments
        ? (props.dependencyProofDocuments as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      verifiedByCourtAt: props.verifiedByCourtAt ?? null,
      version: props.version,
      updatedAt: props.updatedAt,
    };
  }

  // --- QUERY HELPERS ---

  createWhereById(id: string): Prisma.LegalDependantWhereUniqueInput {
    return { id };
  }

  createWhereByDeceased(deceasedId: string): Prisma.LegalDependantWhereInput {
    return { deceasedId };
  }
}
