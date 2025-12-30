// src/guardianship-service/src/infrastructure/mappers/guardianship.mapper.ts
import {
  Prisma,
  BondStatus as PrismaBondStatus,
  ComplianceCheck as PrismaComplianceCheck,
  ComplianceCheckStatus as PrismaComplianceCheckStatus,
  CompliancePeriod as PrismaCompliancePeriod,
  GuardianAssignment as PrismaGuardianAssignment,
  GuardianAssignmentStatus as PrismaGuardianAssignmentStatus,
  GuardianRole as PrismaGuardianRole,
  GuardianshipJurisdiction as PrismaGuardianshipJurisdiction,
  GuardianshipStatus as PrismaGuardianshipStatus,
  ReportType as PrismaReportType,
  ValidationStatus as PrismaValidationStatus,
} from '@prisma/client';

import {
  BondOverallStatus,
  GuardianshipAggregate,
  GuardianshipProps,
  GuardianshipStatus,
} from '../../../domain/aggregates/guardianship.aggregate';
import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import {
  ComplianceCheckEntity,
  CompliancePeriod,
  ComplianceStatus,
  ReportType,
  ValidationStatus,
} from '../../../domain/entities/compliance-check.entity';
import {
  GuardianAppointmentSource,
  GuardianAssignmentEntity,
  GuardianAssignmentStatus,
  GuardianRole,
} from '../../../domain/entities/guardian-assignment.entity';
import { ComplianceScheduleVO } from '../../../domain/value-objects/compliance-schedule.vo';
import { FamilyMemberReferenceVO } from '../../../domain/value-objects/family-member-reference.vo';
import { GuardianContactVO } from '../../../domain/value-objects/guardian-contact.vo';
import { GuardianshipBondVO } from '../../../domain/value-objects/guardianship-bond.vo';
import { GuardianshipPeriodVO } from '../../../domain/value-objects/guardianship-period.vo';
import { GuardianshipPowersVO } from '../../../domain/value-objects/guardianship-powers.vo';
import {
  GuardianshipTypeVO,
  LegalGuardianshipType,
} from '../../../domain/value-objects/guardianship-type.vo';
import { KenyanCourtOrderVO } from '../../../domain/value-objects/kenyan-court-order.vo';

// -----------------------------------------------------------------------------
// Type Definitions for Prisma Includes
// -----------------------------------------------------------------------------

type GuardianshipWithRelations = Prisma.GuardianshipGetPayload<{
  include: {
    guardianAssignments: true;
    complianceChecks: true;
  };
}>;

// -----------------------------------------------------------------------------
// Enum Mappings
// -----------------------------------------------------------------------------

const GuardianshipStatusMap: Record<PrismaGuardianshipStatus, GuardianshipStatus> = {
  [PrismaGuardianshipStatus.PENDING_ACTIVATION]: GuardianshipStatus.PENDING_ACTIVATION,
  [PrismaGuardianshipStatus.ACTIVE]: GuardianshipStatus.ACTIVE,
  [PrismaGuardianshipStatus.SUSPENDED]: GuardianshipStatus.SUSPENDED,
  [PrismaGuardianshipStatus.TERMINATED]: GuardianshipStatus.TERMINATED,
  [PrismaGuardianshipStatus.REVOKED]: GuardianshipStatus.REVOKED,
  [PrismaGuardianshipStatus.EXPIRED]: GuardianshipStatus.EXPIRED,
  [PrismaGuardianshipStatus.EMERGENCY]: GuardianshipStatus.EMERGENCY,
};

const ReverseGuardianshipStatusMap: Record<GuardianshipStatus, PrismaGuardianshipStatus> = {
  [GuardianshipStatus.PENDING_ACTIVATION]: PrismaGuardianshipStatus.PENDING_ACTIVATION,
  [GuardianshipStatus.ACTIVE]: PrismaGuardianshipStatus.ACTIVE,
  [GuardianshipStatus.SUSPENDED]: PrismaGuardianshipStatus.SUSPENDED,
  [GuardianshipStatus.TERMINATED]: PrismaGuardianshipStatus.TERMINATED,
  [GuardianshipStatus.REVOKED]: PrismaGuardianshipStatus.REVOKED,
  [GuardianshipStatus.EXPIRED]: PrismaGuardianshipStatus.EXPIRED,
  [GuardianshipStatus.EMERGENCY]: PrismaGuardianshipStatus.EMERGENCY,
};

const BondStatusMap: Record<PrismaBondStatus, BondOverallStatus> = {
  [PrismaBondStatus.NOT_REQUIRED]: BondOverallStatus.NOT_REQUIRED,
  [PrismaBondStatus.REQUIRED_PENDING]: BondOverallStatus.REQUIRED_PENDING,
  [PrismaBondStatus.POSTED]: BondOverallStatus.POSTED,
  [PrismaBondStatus.FORFEITED]: BondOverallStatus.FORFEITED,
};

const ReverseBondStatusMap: Record<BondOverallStatus, PrismaBondStatus> = {
  [BondOverallStatus.NOT_REQUIRED]: PrismaBondStatus.NOT_REQUIRED,
  [BondOverallStatus.REQUIRED_PENDING]: PrismaBondStatus.REQUIRED_PENDING,
  [BondOverallStatus.POSTED]: PrismaBondStatus.POSTED,
  [BondOverallStatus.FORFEITED]: PrismaBondStatus.FORFEITED,
};

const GuardianRoleMap: Record<PrismaGuardianRole, GuardianRole> = {
  [PrismaGuardianRole.CARETAKER]: GuardianRole.CARETAKER,
  [PrismaGuardianRole.PROPERTY_MANAGER]: GuardianRole.PROPERTY_MANAGER,
  [PrismaGuardianRole.EDUCATIONAL_GUARDIAN]: GuardianRole.EDUCATIONAL_GUARDIAN,
  [PrismaGuardianRole.MEDICAL_CONSENT]: GuardianRole.MEDICAL_CONSENT,
  [PrismaGuardianRole.LEGAL_REPRESENTATIVE]: GuardianRole.LEGAL_REPRESENTATIVE,
  [PrismaGuardianRole.EMERGENCY]: GuardianRole.EMERGENCY,
  [PrismaGuardianRole.CUSTOMARY]: GuardianRole.CUSTOMARY,
};

const ReverseGuardianRoleMap: Record<GuardianRole, PrismaGuardianRole> = {
  [GuardianRole.CARETAKER]: PrismaGuardianRole.CARETAKER,
  [GuardianRole.PROPERTY_MANAGER]: PrismaGuardianRole.PROPERTY_MANAGER,
  [GuardianRole.EDUCATIONAL_GUARDIAN]: PrismaGuardianRole.EDUCATIONAL_GUARDIAN,
  [GuardianRole.MEDICAL_CONSENT]: PrismaGuardianRole.MEDICAL_CONSENT,
  [GuardianRole.LEGAL_REPRESENTATIVE]: PrismaGuardianRole.LEGAL_REPRESENTATIVE,
  [GuardianRole.EMERGENCY]: PrismaGuardianRole.EMERGENCY,
  [GuardianRole.CUSTOMARY]: PrismaGuardianRole.CUSTOMARY,
};

const GuardianAssignmentStatusMap: Record<
  PrismaGuardianAssignmentStatus,
  GuardianAssignmentStatus
> = {
  [PrismaGuardianAssignmentStatus.PENDING]: GuardianAssignmentStatus.PENDING,
  [PrismaGuardianAssignmentStatus.ACTIVE]: GuardianAssignmentStatus.ACTIVE,
  [PrismaGuardianAssignmentStatus.SUSPENDED]: GuardianAssignmentStatus.SUSPENDED,
  [PrismaGuardianAssignmentStatus.TERMINATED]: GuardianAssignmentStatus.TERMINATED,
  [PrismaGuardianAssignmentStatus.REVOKED]: GuardianAssignmentStatus.REVOKED,
  [PrismaGuardianAssignmentStatus.DECEASED]: GuardianAssignmentStatus.DECEASED,
  [PrismaGuardianAssignmentStatus.RESIGNED]: GuardianAssignmentStatus.RESIGNED,
};

const ReverseGuardianAssignmentStatusMap: Record<
  GuardianAssignmentStatus,
  PrismaGuardianAssignmentStatus
> = {
  [GuardianAssignmentStatus.PENDING]: PrismaGuardianAssignmentStatus.PENDING,
  [GuardianAssignmentStatus.ACTIVE]: PrismaGuardianAssignmentStatus.ACTIVE,
  [GuardianAssignmentStatus.SUSPENDED]: PrismaGuardianAssignmentStatus.SUSPENDED,
  [GuardianAssignmentStatus.TERMINATED]: PrismaGuardianAssignmentStatus.TERMINATED,
  [GuardianAssignmentStatus.REVOKED]: PrismaGuardianAssignmentStatus.REVOKED,
  [GuardianAssignmentStatus.DECEASED]: PrismaGuardianAssignmentStatus.DECEASED,
  [GuardianAssignmentStatus.RESIGNED]: PrismaGuardianAssignmentStatus.RESIGNED,
};

const JurisdictionMap: Record<
  PrismaGuardianshipJurisdiction,
  'STATUTORY' | 'ISLAMIC' | 'CUSTOMARY' | 'INTERNATIONAL'
> = {
  [PrismaGuardianshipJurisdiction.STATUTORY]: 'STATUTORY',
  [PrismaGuardianshipJurisdiction.ISLAMIC]: 'ISLAMIC',
  [PrismaGuardianshipJurisdiction.CUSTOMARY]: 'CUSTOMARY',
  [PrismaGuardianshipJurisdiction.INTERNATIONAL]: 'INTERNATIONAL',
};

const ReverseJurisdictionMap: Record<
  'STATUTORY' | 'ISLAMIC' | 'CUSTOMARY' | 'INTERNATIONAL',
  PrismaGuardianshipJurisdiction
> = {
  STATUTORY: PrismaGuardianshipJurisdiction.STATUTORY,
  ISLAMIC: PrismaGuardianshipJurisdiction.ISLAMIC,
  CUSTOMARY: PrismaGuardianshipJurisdiction.CUSTOMARY,
  INTERNATIONAL: PrismaGuardianshipJurisdiction.INTERNATIONAL,
};

const CompliancePeriodMap: Record<PrismaCompliancePeriod, CompliancePeriod> = {
  [PrismaCompliancePeriod.QUARTER_1]: CompliancePeriod.QUARTER_1,
  [PrismaCompliancePeriod.QUARTER_2]: CompliancePeriod.QUARTER_2,
  [PrismaCompliancePeriod.QUARTER_3]: CompliancePeriod.QUARTER_3,
  [PrismaCompliancePeriod.QUARTER_4]: CompliancePeriod.QUARTER_4,
  [PrismaCompliancePeriod.ANNUAL]: CompliancePeriod.ANNUAL,
  [PrismaCompliancePeriod.BIANNUAL]: CompliancePeriod.BIANNUAL,
  [PrismaCompliancePeriod.SPECIAL]: CompliancePeriod.SPECIAL,
};

const ReverseCompliancePeriodMap: Record<CompliancePeriod, PrismaCompliancePeriod> = {
  [CompliancePeriod.QUARTER_1]: PrismaCompliancePeriod.QUARTER_1,
  [CompliancePeriod.QUARTER_2]: PrismaCompliancePeriod.QUARTER_2,
  [CompliancePeriod.QUARTER_3]: PrismaCompliancePeriod.QUARTER_3,
  [CompliancePeriod.QUARTER_4]: PrismaCompliancePeriod.QUARTER_4,
  [CompliancePeriod.ANNUAL]: PrismaCompliancePeriod.ANNUAL,
  [CompliancePeriod.BIANNUAL]: PrismaCompliancePeriod.BIANNUAL,
  [CompliancePeriod.SPECIAL]: PrismaCompliancePeriod.SPECIAL,
};

const ComplianceCheckStatusMap: Record<PrismaComplianceCheckStatus, ComplianceStatus> = {
  [PrismaComplianceCheckStatus.DRAFT]: ComplianceStatus.DRAFT,
  [PrismaComplianceCheckStatus.PENDING_SUBMISSION]: ComplianceStatus.PENDING_SUBMISSION,
  [PrismaComplianceCheckStatus.SUBMITTED]: ComplianceStatus.SUBMITTED,
  [PrismaComplianceCheckStatus.UNDER_REVIEW]: ComplianceStatus.UNDER_REVIEW,
  [PrismaComplianceCheckStatus.ACCEPTED]: ComplianceStatus.ACCEPTED,
  [PrismaComplianceCheckStatus.REJECTED]: ComplianceStatus.REJECTED,
  [PrismaComplianceCheckStatus.AMENDMENT_REQUESTED]: ComplianceStatus.AMENDMENT_REQUESTED,
  [PrismaComplianceCheckStatus.OVERDUE]: ComplianceStatus.OVERDUE,
  [PrismaComplianceCheckStatus.EXTENSION_GRANTED]: ComplianceStatus.EXTENSION_GRANTED,
  [PrismaComplianceCheckStatus.WAIVED]: ComplianceStatus.WAIVED,
};

const ReverseComplianceCheckStatusMap: Record<ComplianceStatus, PrismaComplianceCheckStatus> = {
  [ComplianceStatus.DRAFT]: PrismaComplianceCheckStatus.DRAFT,
  [ComplianceStatus.PENDING_SUBMISSION]: PrismaComplianceCheckStatus.PENDING_SUBMISSION,
  [ComplianceStatus.SUBMITTED]: PrismaComplianceCheckStatus.SUBMITTED,
  [ComplianceStatus.UNDER_REVIEW]: PrismaComplianceCheckStatus.UNDER_REVIEW,
  [ComplianceStatus.ACCEPTED]: PrismaComplianceCheckStatus.ACCEPTED,
  [ComplianceStatus.REJECTED]: PrismaComplianceCheckStatus.REJECTED,
  [ComplianceStatus.AMENDMENT_REQUESTED]: PrismaComplianceCheckStatus.AMENDMENT_REQUESTED,
  [ComplianceStatus.OVERDUE]: PrismaComplianceCheckStatus.OVERDUE,
  [ComplianceStatus.EXTENSION_GRANTED]: PrismaComplianceCheckStatus.EXTENSION_GRANTED,
  [ComplianceStatus.WAIVED]: PrismaComplianceCheckStatus.WAIVED,
};

const ValidationStatusMap: Record<PrismaValidationStatus, ValidationStatus> = {
  [PrismaValidationStatus.PENDING]: ValidationStatus.PENDING,
  [PrismaValidationStatus.IN_PROGRESS]: ValidationStatus.IN_PROGRESS,
  [PrismaValidationStatus.PASSED]: ValidationStatus.PASSED,
  [PrismaValidationStatus.FAILED]: ValidationStatus.FAILED,
  [PrismaValidationStatus.EXCEPTION]: ValidationStatus.EXCEPTION,
};

const ReverseValidationStatusMap: Record<ValidationStatus, PrismaValidationStatus> = {
  [ValidationStatus.PENDING]: PrismaValidationStatus.PENDING,
  [ValidationStatus.IN_PROGRESS]: PrismaValidationStatus.IN_PROGRESS,
  [ValidationStatus.PASSED]: ValidationStatus.PASSED,
  [ValidationStatus.FAILED]: ValidationStatus.FAILED,
  [ValidationStatus.EXCEPTION]: ValidationStatus.EXCEPTION,
};

const ReportTypeMap: Record<PrismaReportType, ReportType> = {
  [PrismaReportType.ANNUAL_WELFARE]: ReportType.ANNUAL_WELFARE,
  [PrismaReportType.QUARTERLY_FINANCIAL]: ReportType.QUARTERLY_FINANCIAL,
  [PrismaReportType.MEDICAL_UPDATE]: ReportType.MEDICAL_UPDATE,
  [PrismaReportType.EDUCATIONAL_PROGRESS]: ReportType.EDUCATIONAL_PROGRESS,
  [PrismaReportType.PROPERTY_MANAGEMENT]: ReportType.PROPERTY_MANAGEMENT,
  [PrismaReportType.COURT_MANDATED]: ReportType.COURT_MANDATED,
  [PrismaReportType.EMERGENCY_REPORT]: ReportType.EMERGENCY_REPORT,
  [PrismaReportType.CLOSING_REPORT]: ReportType.CLOSING_REPORT,
};

const ReverseReportTypeMap: Record<ReportType, PrismaReportType> = {
  [ReportType.ANNUAL_WELFARE]: PrismaReportType.ANNUAL_WELFARE,
  [ReportType.QUARTERLY_FINANCIAL]: PrismaReportType.QUARTERLY_FINANCIAL,
  [ReportType.MEDICAL_UPDATE]: PrismaReportType.MEDICAL_UPDATE,
  [ReportType.EDUCATIONAL_PROGRESS]: PrismaReportType.EDUCATIONAL_PROGRESS,
  [ReportType.PROPERTY_MANAGEMENT]: PrismaReportType.PROPERTY_MANAGEMENT,
  [ReportType.COURT_MANDATED]: PrismaReportType.COURT_MANDATED,
  [ReportType.EMERGENCY_REPORT]: PrismaReportType.EMERGENCY_REPORT,
  [ReportType.CLOSING_REPORT]: PrismaReportType.CLOSING_REPORT,
};

export class GuardianshipMapper {
  // ===========================================================================
  // 🔄 PERSISTENCE (DB) -> DOMAIN
  // ===========================================================================

  static toDomain(raw: GuardianshipWithRelations): GuardianshipAggregate {
    const id = new UniqueEntityID(raw.id);

    const guardianAssignments = (
      (raw as any).guardianAssignments ||
      (raw as any).assignments ||
      []
    ).map((ga: any) => GuardianshipMapper.toDomainGuardianAssignment(ga));

    const complianceChecks = (raw.complianceChecks || []).map((cc) =>
      GuardianshipMapper.toDomainComplianceCheck(cc, raw.complianceSchedule as any),
    );

    // Reconstruct FamilyMemberReferenceVO
    const wardReference = FamilyMemberReferenceVO.create({
      memberId: raw.wardId,
      fullName: {
        firstName: raw.wardFullName.split(' ')[0] || '',
        lastName: raw.wardFullName.split(' ').slice(1).join(' ') || '',
      } as any,
      dateOfBirth: raw.wardDateOfBirth,
      gender: 'MALE' as any, // Placeholder
      isAlive: true,
      verificationStatus: 'VERIFIED',
    });

    // Reconstruct GuardianshipTypeVO
    const guardianshipType = GuardianshipTypeVO.create(raw.type as LegalGuardianshipType);

    // Reconstruct GuardianshipPeriodVO
    const period = GuardianshipPeriodVO.create({
      startDate: raw.establishedDate,
      wardDateOfBirth: raw.wardDateOfBirth,
      endDate: raw.terminatedDate || undefined,
    });

    // Reconstruct ComplianceScheduleVO
    const complianceSchedule = ComplianceScheduleVO.create(raw.complianceSchedule as any);

    // Reconstruct KenyanCourtOrderVO
    let courtOrder: KenyanCourtOrderVO | undefined;
    if (raw.courtOrder) {
      const orderData = raw.courtOrder as any;
      courtOrder = KenyanCourtOrderVO.create({
        orderDate: new Date(orderData.orderDate),
        judgeName: orderData.judgeName,
        caseNumber: orderData.caseNumber || raw.caseNumber,
        courtStation: orderData.courtStation,
        orderType: orderData.orderType || 'GUARDIANSHIP',
      });
    }

    const props: GuardianshipProps = {
      wardReference,
      wardFullName: raw.wardFullName,
      wardDateOfBirth: raw.wardDateOfBirth,

      guardianshipType,
      period,
      courtOrder,

      status: GuardianshipStatusMap[raw.status],
      establishedDate: raw.establishedDate,
      terminatedDate: raw.terminatedDate || undefined,
      terminationReason: raw.terminationReason || undefined,

      guardianAssignments,
      complianceSchedule,
      complianceChecks,

      requiresPropertyManagement: raw.requiresPropertyManagement,
      bondStatus: BondStatusMap[raw.bondStatus],

      jurisdiction: JurisdictionMap[raw.jurisdiction],
      governingLaw: raw.governingLaw,

      history: (raw.history as any[]).map((h) => ({
        timestamp: new Date(h.timestamp),
        eventType: h.eventType,
        description: h.description,
        actorType: h.actorType,
        metadata: h.metadata,
      })),

      caseNumber: raw.caseNumber || undefined,
      legalNotes: raw.legalNotes || undefined,
      specialCircumstances: undefined,
    };

    return (GuardianshipAggregate as any).restore(props, id, (raw as any).version || 1);
  }

  // ===========================================================================
  // 🔄 DOMAIN -> PERSISTENCE (DB)
  // ===========================================================================

  static toPersistence(aggregate: GuardianshipAggregate): {
    guardianship: Prisma.GuardianshipUncheckedCreateInput;
    guardianAssignments: Prisma.GuardianAssignmentUncheckedCreateInput[];
    complianceChecks: Prisma.ComplianceCheckUncheckedCreateInput[];
  } {
    const guardianshipId = aggregate.id.toString();
    const props = (aggregate as any).props as GuardianshipProps;
    return {
      guardianship: {
        id: guardianshipId,
        wardId: props.wardReference.memberId,
        wardFullName: props.wardFullName,
        wardDateOfBirth: props.wardDateOfBirth,

        // FIX: Access .value because type is SimpleValueObject, not string
        type: (props.guardianshipType as any).value || props.guardianshipType.getValue(),

        jurisdiction: ReverseJurisdictionMap[props.jurisdiction],
        governingLaw: props.governingLaw,
        caseNumber: props.caseNumber,

        courtOrder: props.courtOrder ? props.courtOrder.toJSON() : Prisma.DbNull,

        status: ReverseGuardianshipStatusMap[props.status],
        establishedDate: props.establishedDate,
        terminatedDate: props.terminatedDate,
        terminationReason: props.terminationReason,

        requiresPropertyManagement: props.requiresPropertyManagement,
        bondStatus: ReverseBondStatusMap[props.bondStatus],

        complianceSchedule: props.complianceSchedule.toJSON(),

        // FIX: Convert dates to strings/ISO for Prisma JSON and cast entire array
        history: props.history.map((h) => ({
          ...h,
          timestamp: h.timestamp.toISOString(),
          metadata: (h.metadata || Prisma.DbNull) as any,
        })) as any,

        legalNotes: props.legalNotes,
      },
      guardianAssignments: props.guardianAssignments.map((ga) =>
        this.toPersistenceGuardianAssignment(ga, guardianshipId),
      ),
      complianceChecks: props.complianceChecks.map((cc) =>
        this.toPersistenceComplianceCheck(cc, guardianshipId),
      ),
    };
  }

  // ===========================================================================
  // 👥 GUARDIAN ASSIGNMENT MAPPERS
  // ===========================================================================

  static toDomainGuardianAssignment(raw: PrismaGuardianAssignment): GuardianAssignmentEntity {
    const powers = GuardianshipPowersVO.create(raw.powers as any);
    const bond = raw.bond ? GuardianshipBondVO.create(raw.bond as any) : undefined;
    const contactInfo = GuardianContactVO.create(raw.contactInfo as any);

    const assignmentProps = {
      guardianId: raw.guardianId,
      guardianUserId: raw.guardianUserId || undefined,
      guardianName: 'Unknown',

      role: GuardianRoleMap[raw.role],
      isPrimary: raw.isPrimary,
      isAlternate: raw.isAlternate,
      appointmentSource: raw.appointmentSource as GuardianAppointmentSource,

      status: GuardianAssignmentStatusMap[raw.status],
      appointmentDate: raw.appointmentDate,
      activationDate: raw.activationDate || undefined,
      deactivationDate: raw.deactivationDate || undefined,
      deactivationReason: raw.deactivationReason || undefined,

      powers,
      bond,
      contactInfo,

      tasksCompleted: raw.tasksCompleted,
      complianceScore: raw.complianceScore,
      lastActivityDate: raw.lastActivityDate || undefined,

      conflictOfInterestFlags: (raw.conflicts as any[]) || [],

      digitalSignatureUrl: raw.digitalSignatureUrl || undefined,
      verificationMethod: (raw.verificationMethod as any) || undefined,
    };

    return (GuardianAssignmentEntity as any).restore(assignmentProps, new UniqueEntityID(raw.id));
  }

  static toPersistenceGuardianAssignment(
    assignment: GuardianAssignmentEntity,
    guardianshipId: string,
  ): Prisma.GuardianAssignmentUncheckedCreateInput {
    const props = (assignment as any).props;

    return {
      id: assignment.id.toString(),
      guardianshipId,
      guardianId: props.guardianId,
      guardianUserId: props.guardianUserId,

      role: ReverseGuardianRoleMap[props.role],
      isPrimary: props.isPrimary,
      isAlternate: props.isAlternate,
      appointmentSource: props.appointmentSource,

      status: ReverseGuardianAssignmentStatusMap[props.status],
      appointmentDate: props.appointmentDate,
      activationDate: props.activationDate,
      deactivationDate: props.deactivationDate,
      deactivationReason: props.deactivationReason,

      powers: props.powers.toJSON(),
      bond: props.bond ? props.bond.toJSON() : Prisma.DbNull,
      contactInfo: props.contactInfo.toJSON(),

      tasksCompleted: props.tasksCompleted,
      complianceScore: props.complianceScore,
      lastActivityDate: props.lastActivityDate,

      conflicts: props.conflictOfInterestFlags,

      digitalSignatureUrl: props.digitalSignatureUrl,
      verificationMethod: props.verificationMethod,
    };
  }

  // ===========================================================================
  // 📋 COMPLIANCE CHECK MAPPERS
  // ===========================================================================

  static toDomainComplianceCheck(
    raw: PrismaComplianceCheck,
    scheduleJson?: any,
  ): ComplianceCheckEntity {
    const schedule = scheduleJson
      ? ComplianceScheduleVO.create(scheduleJson)
      : ComplianceScheduleVO.create({
          frequency: 'ANNUAL' as any,
          startDate: new Date(),
          courtMandated: false,
          reminderDaysBefore: [],
          preferredNotificationChannel: 'EMAIL',
          autoGenerateReport: false,
        });

    const checkProps = {
      guardianshipId: raw.guardianshipId,
      year: raw.year,
      reportingPeriod: CompliancePeriodMap[raw.reportingPeriod],

      schedule,

      dueDate: raw.dueDate,
      submissionDeadline: raw.submissionDeadline,
      status: ComplianceCheckStatusMap[raw.status],

      submissionDate: raw.submissionDate || undefined,
      reviewedDate: raw.reviewedDate || undefined,
      acceptedDate: raw.acceptedDate || undefined,

      submissionMethods: (raw.submissionMethods as any) || [],
      submissionReferences: (raw.submissionReferences as any) || [],

      reportType: ReportTypeMap[raw.reportType],
      autoGenerated:
        (raw.generatedSections as any)?.some((s: any) => s.status === 'AUTO_GENERATED') || false,
      generatedSections: (raw.generatedSections as any) || [],

      reportTitle: raw.reportTitle,
      sections: (raw.sections as any) || [],
      attachments: (raw.attachments as any) || [],

      validationStatus: ValidationStatusMap[raw.validationStatus],
      validationErrors: (raw.validationErrors as any) || [],
      qualityScore: raw.qualityScore,

      financialStatement: (raw.financialStatement as any) || undefined,
      bankReconciliation: (raw.bankReconciliation as any) || undefined,

      wardStatus: (raw.wardStatus as any) || {
        generalHealth: 'GOOD',
        emotionalWellbeing: 'CONTENT',
        livingConditions: 'ADEQUATE',
        notableEvents: [],
      },

      courtFeedback: (raw.courtFeedback as any) || undefined,
      recommendations: (raw.recommendations as any) || undefined,

      reminderHistory: (raw.reminderHistory as any) || [],
      followUpActions: (raw.followUpActions as any) || [],

      submittedBy: raw.submittedBy || undefined,
      reviewedBy: raw.reviewedBy || undefined,
    };

    return (ComplianceCheckEntity as any).restore(checkProps, new UniqueEntityID(raw.id));
  }

  static toPersistenceComplianceCheck(
    check: ComplianceCheckEntity,
    guardianshipId: string,
  ): Prisma.ComplianceCheckUncheckedCreateInput {
    const props = (check as any).props;

    return {
      id: check.id.toString(),
      guardianshipId,
      year: props.year,
      reportingPeriod: ReverseCompliancePeriodMap[props.reportingPeriod],
      reportType: ReverseReportTypeMap[props.reportType],
      reportTitle: props.reportTitle,

      dueDate: props.dueDate,
      submissionDeadline: props.submissionDeadline,
      submissionDate: props.submissionDate,
      reviewedDate: props.reviewedDate,
      acceptedDate: props.acceptedDate,

      status: ReverseComplianceCheckStatusMap[props.status],
      validationStatus: ReverseValidationStatusMap[props.validationStatus],
      qualityScore: props.qualityScore,

      validationErrors: props.validationErrors || Prisma.DbNull,
      sections: props.sections || Prisma.DbNull,
      attachments: props.attachments || Prisma.DbNull,
      generatedSections: props.generatedSections || Prisma.DbNull,
      submissionMethods: props.submissionMethods || Prisma.DbNull,
      submissionReferences: props.submissionReferences || Prisma.DbNull,
      financialStatement: props.financialStatement || Prisma.DbNull,
      wardStatus: props.wardStatus || Prisma.DbNull,
      bankReconciliation: props.bankReconciliation || Prisma.DbNull,
      courtFeedback: props.courtFeedback || Prisma.DbNull,
      recommendations: props.recommendations || Prisma.DbNull,
      reminderHistory: props.reminderHistory || Prisma.DbNull,
      followUpActions: props.followUpActions || Prisma.DbNull,

      submittedBy: props.submittedBy,
      reviewedBy: props.reviewedBy,
    };
  }
}
