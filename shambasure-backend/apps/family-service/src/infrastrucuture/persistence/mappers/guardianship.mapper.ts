import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Guardian as PrismaGuardian } from '@prisma/client';

import { Guardian, GuardianProps } from '../../../domain/entities/guardian.entity';

@Injectable()
export class GuardianMapper {
  private readonly logger = new Logger(GuardianMapper.name);

  /**
   * Converts Prisma Guardian record to Domain Guardian entity
   */
  toDomain(raw: PrismaGuardian | null): Guardian | null {
    if (!raw) return null;

    try {
      // Prisma handles JSON parsing automatically.
      // We just need to ensure it's treated as an object or unknown for the domain.
      const restrictions = raw.restrictions as unknown;

      const props: GuardianProps = {
        id: raw.id,
        wardId: raw.wardId,
        guardianId: raw.guardianId,
        type: raw.type,

        // Legal & Court Details
        courtOrderNumber: raw.courtOrderNumber ?? undefined,
        courtStation: raw.courtStation ?? undefined,
        appointmentDate: raw.appointmentDate,
        validUntil: raw.validUntil ?? undefined,

        // Powers
        hasPropertyManagementPowers: raw.hasPropertyManagementPowers,
        canConsentToMedical: raw.canConsentToMedical,
        canConsentToMarriage: raw.canConsentToMarriage,
        restrictions,
        specialInstructions: raw.specialInstructions ?? undefined,

        // Identity
        guardianIdNumber: raw.guardianIdNumber ?? undefined,
        courtCaseNumber: raw.courtCaseNumber ?? undefined,
        interimOrderId: raw.interimOrderId ?? undefined,

        // Bond (S.72 LSA)
        bondRequired: raw.bondRequired,
        bondAmountKES: raw.bondAmountKES ?? undefined,
        bondProvider: raw.bondProvider ?? undefined,
        bondPolicyNumber: raw.bondPolicyNumber ?? undefined,
        bondExpiry: raw.bondExpiry ?? undefined,

        // Reporting (S.73 LSA)
        lastReportDate: raw.lastReportDate ?? undefined,
        nextReportDue: raw.nextReportDue ?? undefined,
        reportStatus: raw.reportStatus ?? 'PENDING',

        // Allowances
        annualAllowanceKES: raw.annualAllowanceKES ?? undefined,
        allowanceApprovedBy: raw.allowanceApprovedBy ?? undefined,

        // Status
        isActive: raw.isActive,
        terminationDate: raw.terminationDate ?? undefined,
        terminationReason: raw.terminationReason ?? undefined,

        version: raw.version,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      };

      return Guardian.createFromProps(props);
    } catch (error) {
      this.logger.error(`Failed to reconstitute Guardian ${raw?.id}`, error.stack);
      throw new Error(`Data integrity error for Guardian ${raw?.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain Guardian entity to Prisma Persistence Input
   */
  toPersistence(entity: Guardian): Prisma.GuardianUncheckedCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      wardId: props.wardId,
      guardianId: props.guardianId,
      type: props.type,

      courtOrderNumber: props.courtOrderNumber ?? null,
      courtStation: props.courtStation ?? null,
      appointmentDate: props.appointmentDate,
      validUntil: props.validUntil ?? null,

      hasPropertyManagementPowers: props.hasPropertyManagementPowers,
      canConsentToMedical: props.canConsentToMedical,
      canConsentToMarriage: props.canConsentToMarriage,
      restrictions: (props.restrictions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      specialInstructions: props.specialInstructions ?? null,

      guardianIdNumber: props.guardianIdNumber ?? null,
      courtCaseNumber: props.courtCaseNumber ?? null,
      interimOrderId: props.interimOrderId ?? null,

      bondRequired: props.bondRequired,
      bondAmountKES: props.bondAmountKES ?? null,
      bondProvider: props.bondProvider ?? null,
      bondPolicyNumber: props.bondPolicyNumber ?? null,
      bondExpiry: props.bondExpiry ?? null,

      lastReportDate: props.lastReportDate ?? null,
      nextReportDue: props.nextReportDue ?? null,
      reportStatus: props.reportStatus,

      annualAllowanceKES: props.annualAllowanceKES ?? null,
      allowanceApprovedBy: props.allowanceApprovedBy ?? null,

      isActive: props.isActive,
      terminationDate: props.terminationDate ?? null,
      terminationReason: props.terminationReason ?? null,

      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts domain entity to Prisma create input (Optimized for performance)
   */
  toPrismaCreate(entity: Guardian): Prisma.GuardianCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      // Connect via ID directly
      ward: { connect: { id: props.wardId } },
      guardian: { connect: { id: props.guardianId } },

      type: props.type,
      courtOrderNumber: props.courtOrderNumber ?? null,
      courtStation: props.courtStation ?? null,
      appointmentDate: props.appointmentDate,
      validUntil: props.validUntil ?? null,

      hasPropertyManagementPowers: props.hasPropertyManagementPowers,
      canConsentToMedical: props.canConsentToMedical,
      canConsentToMarriage: props.canConsentToMarriage,
      restrictions: (props.restrictions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      specialInstructions: props.specialInstructions ?? null,

      guardianIdNumber: props.guardianIdNumber ?? null,
      courtCaseNumber: props.courtCaseNumber ?? null,
      interimOrderId: props.interimOrderId ?? null,

      bondRequired: props.bondRequired,
      bondAmountKES: props.bondAmountKES ?? null,
      bondProvider: props.bondProvider ?? null,
      bondPolicyNumber: props.bondPolicyNumber ?? null,
      bondExpiry: props.bondExpiry ?? null,

      lastReportDate: props.lastReportDate ?? null,
      nextReportDue: props.nextReportDue ?? null,
      reportStatus: props.reportStatus,

      annualAllowanceKES: props.annualAllowanceKES ?? null,
      allowanceApprovedBy: props.allowanceApprovedBy ?? null,

      isActive: props.isActive,
      terminationDate: props.terminationDate ?? null,
      terminationReason: props.terminationReason ?? null,

      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates a partial update DTO
   */
  toPrismaUpdate(entity: Guardian): Prisma.GuardianUncheckedUpdateInput {
    const props = entity.toJSON();

    return {
      type: props.type,
      courtOrderNumber: props.courtOrderNumber ?? null,
      courtStation: props.courtStation ?? null,
      appointmentDate: props.appointmentDate,
      validUntil: props.validUntil ?? null,

      hasPropertyManagementPowers: props.hasPropertyManagementPowers,
      canConsentToMedical: props.canConsentToMedical,
      canConsentToMarriage: props.canConsentToMarriage,
      restrictions: (props.restrictions as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      specialInstructions: props.specialInstructions ?? null,

      guardianIdNumber: props.guardianIdNumber ?? null,
      courtCaseNumber: props.courtCaseNumber ?? null,
      interimOrderId: props.interimOrderId ?? null,

      bondRequired: props.bondRequired,
      bondAmountKES: props.bondAmountKES ?? null,
      bondProvider: props.bondProvider ?? null,
      bondPolicyNumber: props.bondPolicyNumber ?? null,
      bondExpiry: props.bondExpiry ?? null,

      lastReportDate: props.lastReportDate ?? null,
      nextReportDue: props.nextReportDue ?? null,
      reportStatus: props.reportStatus,

      annualAllowanceKES: props.annualAllowanceKES ?? null,
      allowanceApprovedBy: props.allowanceApprovedBy ?? null,

      isActive: props.isActive,
      terminationDate: props.terminationDate ?? null,
      terminationReason: props.terminationReason ?? null,

      version: props.version,
      updatedAt: props.updatedAt,
    };
  }

  // --- QUERY HELPERS ---

  createWhereById(id: string): Prisma.GuardianWhereUniqueInput {
    return { id };
  }

  createWhereByWard(wardId: string): Prisma.GuardianWhereInput {
    return { wardId, isActive: true };
  }
}
