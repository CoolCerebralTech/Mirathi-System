import { Prisma, Guardian as PrismaGuardian } from '@prisma/client';

import {
  Guardianship,
  GuardianshipReconstitutionProps,
} from '../../../domain/entities/guardianship.entity';

export class GuardianshipMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaGuardian): Guardianship {
    const reconstitutionProps: GuardianshipReconstitutionProps = {
      id: raw.id,

      // Core relationships
      guardianId: raw.guardianId,
      wardId: raw.wardId,
      type: raw.type,

      // Legal appointment
      appointedBy: raw.appointedBy,
      appointmentDate: raw.appointmentDate,
      validUntil: raw.validUntil,

      // Kenyan Court Order Fields
      courtOrderNumber: raw.courtOrderNumber,
      courtName: raw.courtName,
      caseNumber: raw.caseNumber,
      issuingJudge: raw.issuingJudge,
      courtStation: raw.courtStation,

      // Guardianship Conditions (Prisma Json Types)
      conditions: raw.conditions,
      reportingRequirements: raw.reportingRequirements,
      restrictedPowers: raw.restrictedPowers,
      specialInstructions: raw.specialInstructions,

      // Status & Review
      isTemporary: raw.isTemporary,
      reviewDate: raw.reviewDate,

      // Status
      isActive: raw.isActive,
      notes: raw.notes,

      // Timestamps
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return Guardianship.reconstitute(reconstitutionProps);
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(entity: Guardianship): PrismaGuardian {
    return {
      id: entity.getId(),

      // Core relationships
      guardianId: entity.getGuardianId(),
      wardId: entity.getWardId(),
      type: entity.getType(),

      // Legal appointment
      appointedBy: entity.getAppointedBy(),
      appointmentDate: entity.getAppointmentDate(),
      validUntil: entity.getValidUntil(),

      // Kenyan Court Order Fields
      courtOrderNumber: entity.getCourtOrderNumber(),
      courtName: entity.getCourtName(),
      caseNumber: entity.getCaseNumber(),
      issuingJudge: entity.getIssuingJudge(),
      courtStation: entity.getCourtStation(),

      // Guardianship Conditions - Use the arrays directly
      conditions: entity.getConditions(),
      reportingRequirements: entity.getReportingRequirements(),
      restrictedPowers: entity.getRestrictedPowers(),
      specialInstructions: entity.getSpecialInstructions(),

      // Status & Review
      isTemporary: entity.getIsTemporary(),
      reviewDate: entity.getReviewDate(),

      // Status
      isActive: entity.getIsActive(),
      notes: entity.getNotes(),

      // Timestamps
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    } as PrismaGuardian;
  }

  /**
   * Converts Domain Entity to Prisma Create input
   */
  static toPrismaCreate(entity: Guardianship): Prisma.GuardianCreateInput {
    return {
      id: entity.getId(),

      // Core relationships
      guardian: {
        connect: { id: entity.getGuardianId() },
      },
      ward: {
        connect: { id: entity.getWardId() },
      },
      type: entity.getType(),

      // Legal appointment
      appointedBy: entity.getAppointedBy(),
      appointmentDate: entity.getAppointmentDate(),
      validUntil: entity.getValidUntil(),

      // Kenyan Court Order Fields
      courtOrderNumber: entity.getCourtOrderNumber(),
      courtName: entity.getCourtName(),
      caseNumber: entity.getCaseNumber(),
      issuingJudge: entity.getIssuingJudge(),
      courtStation: entity.getCourtStation(),

      // Guardianship Conditions - Use the arrays directly (they are valid InputJsonValue)
      conditions: entity.getConditions(),
      reportingRequirements: entity.getReportingRequirements(),
      restrictedPowers: entity.getRestrictedPowers(),
      specialInstructions: entity.getSpecialInstructions(),

      // Status & Review
      isTemporary: entity.getIsTemporary(),
      reviewDate: entity.getReviewDate(),

      // Status
      isActive: entity.getIsActive(),
      notes: entity.getNotes(),

      // Timestamps - Prisma will handle createdAt/updatedAt
    };
  }

  /**
   * Converts Domain Entity to Prisma Update input
   */
  static toPrismaUpdate(entity: Guardianship): Prisma.GuardianUpdateInput {
    return {
      // Legal appointment
      appointedBy: entity.getAppointedBy(),
      validUntil: entity.getValidUntil(),

      // Kenyan Court Order Fields
      courtOrderNumber: entity.getCourtOrderNumber(),
      courtName: entity.getCourtName(),
      caseNumber: entity.getCaseNumber(),
      issuingJudge: entity.getIssuingJudge(),
      courtStation: entity.getCourtStation(),

      // Guardianship Conditions - Use the arrays directly (they are valid InputJsonValue)
      conditions: entity.getConditions(),
      reportingRequirements: entity.getReportingRequirements(),
      restrictedPowers: entity.getRestrictedPowers(),
      specialInstructions: entity.getSpecialInstructions(),

      // Status & Review
      isTemporary: entity.getIsTemporary(),
      reviewDate: entity.getReviewDate(),

      // Status
      isActive: entity.getIsActive(),
      notes: entity.getNotes(),

      // Timestamps
      updatedAt: entity.getUpdatedAt(),
    };
  }
}
