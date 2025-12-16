// guardian.mapper.ts
import { Injectable } from '@nestjs/common';
import {
  GuardianReportStatus,
  GuardianType,
  Prisma,
  Guardian as PrismaGuardian,
} from '@prisma/client';

import { Guardian, GuardianProps } from '../../../domain/entities/guardian.entity';

@Injectable()
export class GuardianMapper {
  /**
   * Converts Prisma Guardian record to Domain Guardian entity
   * Handles complex JSON fields and S.70-73 LSA compliance
   */
  toDomain(raw: PrismaGuardian | null): Guardian | null {
    if (!raw) return null;

    try {
      // Parse JSON fields safely
      let restrictions: any = raw.restrictions;
      if (restrictions && typeof restrictions === 'string') {
        try {
          restrictions = JSON.parse(restrictions);
        } catch {
          restrictions = null;
        }
      }

      const props: GuardianProps = {
        id: raw.id,
        wardId: raw.wardId,
        guardianId: raw.guardianId,
        type: raw.type,
        courtOrderNumber: raw.courtOrderNumber ?? undefined,
        courtStation: raw.courtStation ?? undefined,
        appointmentDate: new Date(raw.appointmentDate),
        validUntil: raw.validUntil ? new Date(raw.validUntil) : undefined,
        hasPropertyManagementPowers: raw.hasPropertyManagementPowers,
        canConsentToMedical: raw.canConsentToMedical,
        canConsentToMarriage: raw.canConsentToMarriage,
        restrictions,
        specialInstructions: raw.specialInstructions ?? undefined,
        guardianIdNumber: raw.guardianIdNumber ?? undefined,
        courtCaseNumber: raw.courtCaseNumber ?? undefined,
        interimOrderId: raw.interimOrderId ?? undefined,
        bondRequired: raw.bondRequired,
        bondAmountKES: raw.bondAmountKES ?? undefined,
        bondProvider: raw.bondProvider ?? undefined,
        bondPolicyNumber: raw.bondPolicyNumber ?? undefined,
        bondExpiry: raw.bondExpiry ? new Date(raw.bondExpiry) : undefined,
        lastReportDate: raw.lastReportDate ? new Date(raw.lastReportDate) : undefined,
        nextReportDue: raw.nextReportDue ? new Date(raw.nextReportDue) : undefined,
        reportStatus: raw.reportStatus,
        annualAllowanceKES: raw.annualAllowanceKES ?? undefined,
        allowanceApprovedBy: raw.allowanceApprovedBy ?? undefined,
        isActive: raw.isActive,
        terminationDate: raw.terminationDate ? new Date(raw.terminationDate) : undefined,
        terminationReason: raw.terminationReason ?? undefined,
        version: raw.version,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
      };

      return Guardian.createFromProps(props);
    } catch (error) {
      console.error('Error reconstituting Guardian from persistence:', error);
      throw new Error(`Failed to reconstitute Guardian ${raw.id}: ${error.message}`);
    }
  }

  /**
   * Converts Domain Guardian entity to Prisma create/update input
   * Handles all S.70-73 LSA requirements and JSON serialization
   */
  toPersistence(entity: Guardian): Prisma.GuardianUncheckedCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      wardId: props.wardId,
      guardianId: props.guardianId,
      type: props.type,
      courtOrderNumber: props.courtOrderNumber,
      courtStation: props.courtStation,
      appointmentDate: props.appointmentDate,
      validUntil: props.validUntil,
      hasPropertyManagementPowers: props.hasPropertyManagementPowers,
      canConsentToMedical: props.canConsentToMedical,
      canConsentToMarriage: props.canConsentToMarriage,
      restrictions: props.restrictions as Prisma.JsonValue,
      specialInstructions: props.specialInstructions,
      guardianIdNumber: props.guardianIdNumber,
      courtCaseNumber: props.courtCaseNumber,
      interimOrderId: props.interimOrderId,
      bondRequired: props.bondRequired,
      bondAmountKES: props.bondAmountKES,
      bondProvider: props.bondProvider,
      bondPolicyNumber: props.bondPolicyNumber,
      bondExpiry: props.bondExpiry,
      lastReportDate: props.lastReportDate,
      nextReportDue: props.nextReportDue,
      reportStatus: props.reportStatus,
      annualAllowanceKES: props.annualAllowanceKES,
      allowanceApprovedBy: props.allowanceApprovedBy,
      isActive: props.isActive,
      terminationDate: props.terminationDate,
      terminationReason: props.terminationReason,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates a partial update DTO from domain changes
   * Optimized for updating only changed fields
   */
  toPrismaUpdate(entity: Guardian): Prisma.GuardianUncheckedUpdateInput {
    const props = entity.toJSON();

    return {
      type: props.type,
      courtOrderNumber: props.courtOrderNumber,
      courtStation: props.courtStation,
      appointmentDate: props.appointmentDate,
      validUntil: props.validUntil,
      hasPropertyManagementPowers: props.hasPropertyManagementPowers,
      canConsentToMedical: props.canConsentToMedical,
      canConsentToMarriage: props.canConsentToMarriage,
      restrictions: props.restrictions as Prisma.JsonValue,
      specialInstructions: props.specialInstructions,
      guardianIdNumber: props.guardianIdNumber,
      courtCaseNumber: props.courtCaseNumber,
      interimOrderId: props.interimOrderId,
      bondRequired: props.bondRequired,
      bondAmountKES: props.bondAmountKES,
      bondProvider: props.bondProvider,
      bondPolicyNumber: props.bondPolicyNumber,
      bondExpiry: props.bondExpiry,
      lastReportDate: props.lastReportDate,
      nextReportDue: props.nextReportDue,
      reportStatus: props.reportStatus,
      annualAllowanceKES: props.annualAllowanceKES,
      allowanceApprovedBy: props.allowanceApprovedBy,
      isActive: props.isActive,
      terminationDate: props.terminationDate,
      terminationReason: props.terminationReason,
      version: props.version,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Converts domain entity to Prisma create input with relationships
   */
  toPrismaCreate(entity: Guardian): Prisma.GuardianCreateInput {
    const props = entity.toJSON();

    return {
      id: props.id,
      ward: { connect: { id: props.wardId } },
      guardian: { connect: { id: props.guardianId } },
      type: props.type,
      courtOrderNumber: props.courtOrderNumber,
      courtStation: props.courtStation,
      appointmentDate: props.appointmentDate,
      validUntil: props.validUntil,
      hasPropertyManagementPowers: props.hasPropertyManagementPowers,
      canConsentToMedical: props.canConsentToMedical,
      canConsentToMarriage: props.canConsentToMarriage,
      restrictions: props.restrictions as Prisma.JsonValue,
      specialInstructions: props.specialInstructions,
      guardianIdNumber: props.guardianIdNumber,
      courtCaseNumber: props.courtCaseNumber,
      interimOrderId: props.interimOrderId,
      bondRequired: props.bondRequired,
      bondAmountKES: props.bondAmountKES,
      bondProvider: props.bondProvider,
      bondPolicyNumber: props.bondPolicyNumber,
      bondExpiry: props.bondExpiry,
      lastReportDate: props.lastReportDate,
      nextReportDue: props.nextReportDue,
      reportStatus: props.reportStatus,
      annualAllowanceKES: props.annualAllowanceKES,
      allowanceApprovedBy: props.allowanceApprovedBy,
      isActive: props.isActive,
      terminationDate: props.terminationDate,
      terminationReason: props.terminationReason,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Creates Prisma where clause for finding by ID
   */
  createWhereById(id: string): Prisma.GuardianWhereUniqueInput {
    return { id };
  }

  /**
   * Creates Prisma where clause for finding by ward
   */
  createWhereByWard(wardId: string): Prisma.GuardianWhereInput {
    return { wardId, isActive: true };
  }

  /**
   * Creates Prisma where clause for finding by guardian
   */
  createWhereByGuardian(guardianId: string): Prisma.GuardianWhereInput {
    return { guardianId, isActive: true };
  }

  /**
   * Creates Prisma where clause for active guardianships
   */
  createWhereActive(): Prisma.GuardianWhereInput {
    return { isActive: true };
  }

  /**
   * Creates Prisma where clause for S.70-73 LSA compliance checks
   */
  createWhereS73ComplianceIssues(): Prisma.GuardianWhereInput {
    const today = new Date();

    return {
      isActive: true,
      hasPropertyManagementPowers: true,
      OR: [
        {
          nextReportDue: { lte: today },
          reportStatus: { not: { in: ['SUBMITTED', 'APPROVED'] } },
        },
        {
          bondRequired: true,
          bondProvider: null,
        },
        {
          bondRequired: true,
          bondExpiry: { lte: today },
        },
      ],
    };
  }

  /**
   * Creates Prisma where clause for guardians requiring S.72 bond
   */
  createWhereRequiresBond(): Prisma.GuardianWhereInput {
    return {
      isActive: true,
      bondRequired: true,
      OR: [{ bondProvider: null }, { bondPolicyNumber: null }],
    };
  }

  /**
   * Creates Prisma where clause for overdue annual reports (S.73)
   */
  createWhereOverdueReports(): Prisma.GuardianWhereInput {
    const today = new Date();

    return {
      isActive: true,
      hasPropertyManagementPowers: true,
      nextReportDue: { lte: today },
      reportStatus: { not: { in: ['SUBMITTED', 'APPROVED'] } },
    };
  }

  /**
   * Creates Prisma include clause for eager loading relationships
   */
  createIncludeClause(): Prisma.GuardianInclude {
    return {
      ward: true,
      guardian: true,
    };
  }

  /**
   * Validates mapping consistency between domain and persistence
   */
  validateMapping(entity: Guardian, raw: PrismaGuardian): boolean {
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
    if (entity.wardId !== raw.wardId) {
      errors.push(`Ward ID mismatch: Domain=${entity.wardId}, Persistence=${raw.wardId}`);
    }

    if (entity.guardianId !== raw.guardianId) {
      errors.push(
        `Guardian ID mismatch: Domain=${entity.guardianId}, Persistence=${raw.guardianId}`,
      );
    }

    // Validate guardian type
    if (entity.type !== raw.type) {
      errors.push(`Type mismatch: Domain=${entity.type}, Persistence=${raw.type}`);
    }

    // Validate S.73 compliance status
    const domainCompliance = entity.s73ComplianceStatus;
    const persistenceCompliance = this.determineS73ComplianceFromPersistence(raw);

    if (domainCompliance !== persistenceCompliance) {
      errors.push(
        `S.73 compliance mismatch: Domain=${domainCompliance}, Persistence=${persistenceCompliance}`,
      );
    }

    // Validate bond compliance
    if (entity.bondRequired !== raw.bondRequired) {
      errors.push(
        `Bond requirement mismatch: Domain=${entity.bondRequired}, Persistence=${raw.bondRequired}`,
      );
    }

    if (entity.isBondPosted !== (!!raw.bondProvider && !!raw.bondPolicyNumber)) {
      errors.push(`Bond posted status mismatch`);
    }

    // Validate appointment date
    const rawAppointmentDate = new Date(raw.appointmentDate);
    if (entity.appointmentDate.getTime() !== rawAppointmentDate.getTime()) {
      errors.push(
        `Appointment date mismatch: Domain=${entity.appointmentDate}, Persistence=${rawAppointmentDate}`,
      );
    }

    if (errors.length > 0) {
      console.warn('Guardian mapping validation errors:', errors);
      return false;
    }

    return true;
  }

  /**
   * Determines S.73 compliance from persistence data
   */
  private determineS73ComplianceFromPersistence(
    raw: PrismaGuardian,
  ): 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_REQUIRED' {
    const isActive = raw.isActive;
    const hasPropertyManagementPowers = raw.hasPropertyManagementPowers;
    const today = new Date();

    if (!isActive || !hasPropertyManagementPowers) {
      return 'NOT_REQUIRED';
    }

    // Check for overdue reports
    if (raw.nextReportDue && raw.nextReportDue <= today) {
      if (raw.reportStatus !== 'SUBMITTED' && raw.reportStatus !== 'APPROVED') {
        return 'NON_COMPLIANT';
      }
    }

    return 'COMPLIANT';
  }

  /**
   * Extracts relationship IDs from Prisma result with includes
   */
  extractRelationships(
    prismaGuardian: PrismaGuardian & {
      ward?: { id: string };
      guardian?: { id: string };
    },
  ) {
    return {
      wardId: prismaGuardian.ward?.id || prismaGuardian.wardId,
      guardianId: prismaGuardian.guardian?.id || prismaGuardian.guardianId,
    };
  }

  /**
   * Creates a batch mapper for multiple guardians
   */
  toDomainBatch(rawList: PrismaGuardian[]): Guardian[] {
    return rawList.map((raw) => this.toDomain(raw)).filter(Boolean) as Guardian[];
  }

  /**
   * Creates batch persistence data
   */
  toPersistenceBatch(entityList: Guardian[]): Prisma.GuardianUncheckedCreateInput[] {
    return entityList.map((entity) => this.toPersistence(entity));
  }

  /**
   * Checks if guardianship is active based on persistence data
   */
  isActiveInPersistence(raw: PrismaGuardian): boolean {
    return raw.isActive;
  }

  /**
   * Checks if bond is required and posted
   */
  isBondCompliantInPersistence(raw: PrismaGuardian): boolean {
    if (!raw.bondRequired) return true;

    const hasBond = raw.bondProvider && raw.bondPolicyNumber;
    if (!hasBond) return false;

    // Check if bond is expired
    if (raw.bondExpiry && raw.bondExpiry < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Calculates next annual report due date
   */
  calculateNextReportDueDate(appointmentDate: Date, lastReportDate?: Date): Date {
    const baseDate = lastReportDate || appointmentDate;
    const nextDue = new Date(baseDate);
    nextDue.setFullYear(nextDue.getFullYear() + 1);
    return nextDue;
  }

  /**
   * Creates filter for guardians by type
   */
  createTypeFilter(type: GuardianType): Prisma.GuardianWhereInput {
    return { type };
  }

  /**
   * Creates filter for guardians with property management powers
   */
  createWhereHasPropertyPowers(): Prisma.GuardianWhereInput {
    return { hasPropertyManagementPowers: true };
  }

  /**
   * Creates filter for guardians requiring medical consent powers
   */
  createWhereRequiresMedicalConsent(): Prisma.GuardianWhereInput {
    return { canConsentToMedical: true };
  }

  /**
   * Creates filter for terminated guardianships
   */
  createWhereTerminated(): Prisma.GuardianWhereInput {
    return { isActive: false };
  }

  /**
   * Creates sort order for guardians
   */
  createSortOrder(
    sortBy: 'appointmentDate' | 'nextReportDue' | 'createdAt' = 'appointmentDate',
    order: 'asc' | 'desc' = 'desc',
  ): Prisma.GuardianOrderByWithRelationInput {
    return { [sortBy]: order };
  }

  /**
   * Helper to extract guardian statistics from persistence data
   */
  extractStatistics(rawList: PrismaGuardian[]): {
    total: number;
    active: number;
    byType: Record<string, number>;
    s73Compliant: number;
    bondCompliant: number;
    withPropertyPowers: number;
  } {
    const stats = {
      total: rawList.length,
      active: 0,
      byType: {} as Record<string, number>,
      s73Compliant: 0,
      bondCompliant: 0,
      withPropertyPowers: 0,
    };

    rawList.forEach((raw) => {
      // Count active
      if (raw.isActive) {
        stats.active++;
      }

      // Count by type
      stats.byType[raw.type] = (stats.byType[raw.type] || 0) + 1;

      // Count S.73 compliant
      if (this.determineS73ComplianceFromPersistence(raw) === 'COMPLIANT') {
        stats.s73Compliant++;
      }

      // Count bond compliant
      if (this.isBondCompliantInPersistence(raw)) {
        stats.bondCompliant++;
      }

      // Count with property powers
      if (raw.hasPropertyManagementPowers) {
        stats.withPropertyPowers++;
      }
    });

    return stats;
  }

  /**
   * Creates where clause for guardians expiring soon
   */
  createWhereExpiringSoon(days: number = 30): Prisma.GuardianWhereInput {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return {
      isActive: true,
      validUntil: {
        gte: today,
        lte: futureDate,
      },
    };
  }

  /**
   * Helper to format restrictions JSON for display
   */
  formatRestrictions(restrictions: any): string {
    if (!restrictions) return 'No restrictions';

    if (typeof restrictions === 'string') {
      try {
        restrictions = JSON.parse(restrictions);
      } catch {
        return restrictions;
      }
    }

    if (typeof restrictions === 'object') {
      return JSON.stringify(restrictions, null, 2);
    }

    return String(restrictions);
  }
}

/**
 * Factory for creating GuardianMapper with dependency injection support
 */
export class GuardianMapperFactory {
  static create(): GuardianMapper {
    return new GuardianMapper();
  }
}

/**
 * Type guard for Prisma Guardian with relationships
 */
export function isPrismaGuardianWithRelationships(guardian: any): guardian is PrismaGuardian & {
  ward?: { id: string };
  guardian?: { id: string };
} {
  return guardian && typeof guardian === 'object' && 'id' in guardian && 'wardId' in guardian;
}

/**
 * Helper to validate guardian appointment under Kenyan law
 */
export function validateGuardianAppointment(
  type: GuardianType,
  courtOrderNumber?: string,
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (type === GuardianType.COURT_APPOINTED && !courtOrderNumber) {
    issues.push('Court-appointed guardians require a court order number');
  }

  if (type === GuardianType.TESTAMENTARY && courtOrderNumber) {
    issues.push('Testamentary guardians should not have court order numbers');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Helper to calculate bond requirements under S.72 LSA
 */
export function calculateBondAmount(estateValueKES: number): number {
  // S.72 allows court to determine bond amount
  // Common practice: 10% of estate value or KES 100,000 minimum
  const percentage = 0.1; // 10%
  const minimum = 100000; // KES 100,000

  const calculated = estateValueKES * percentage;
  return Math.max(calculated, minimum);
}
