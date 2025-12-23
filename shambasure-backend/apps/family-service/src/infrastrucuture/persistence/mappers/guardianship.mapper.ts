// infrastructure/mappers/guardianship.mapper.ts
import { GuardianType } from '@prisma/client';

import { GuardianshipAggregate } from '../../../domain/aggregates/guardianship.aggregate';
import { CustomaryLawDetails, WardInfo } from '../../../domain/aggregates/guardianship.aggregate';
import { DomainEvent } from '../../../domain/base/domain-event';
import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { Guardian } from '../../../domain/entities/guardian.entity';
import { GuardianReportStatus } from '../../../domain/entities/guardian.entity';
import { AnnualReportFiledEvent } from '../../../domain/events/guardianship-events/annual-report-filed.event';
import { GuardianAllowanceUpdatedEvent } from '../../../domain/events/guardianship-events/guardian-allowance-updated.event';
import { GuardianAppointedEvent } from '../../../domain/events/guardianship-events/guardian-appointed.event';
import { GuardianBondExpiredEvent } from '../../../domain/events/guardianship-events/guardian-bond-expired.event';
import { GuardianBondPostedEvent } from '../../../domain/events/guardianship-events/guardian-bond-posted.event';
import { GuardianPowersGrantedEvent } from '../../../domain/events/guardianship-events/guardian-powers-granted.event';
import { GuardianReplacedEvent } from '../../../domain/events/guardianship-events/guardian-replaced.event';
// Import specific domain events
import { GuardianshipCreatedEvent } from '../../../domain/events/guardianship-events/guardianship-created.event';
import { GuardianshipDissolvedEvent } from '../../../domain/events/guardianship-events/guardianship-dissolved.event';
import { MultipleGuardiansAssignedEvent } from '../../../domain/events/guardianship-events/multiple-guardians-assigned.event';
import { WardMajorityReachedEvent } from '../../../domain/events/guardianship-events/ward-majority-reached.event';
import { KenyanMoney } from '../../../domain/value-objects/financial/kenyan-money.vo';
import { CourtOrder } from '../../../domain/value-objects/legal/court-order.vo';
import { GuardianBond } from '../../../domain/value-objects/legal/guardian-bond.vo';
import { GuardianPowers } from '../../../domain/value-objects/legal/guardian-powers.vo';
import { ReportingSchedule } from '../../../domain/value-objects/legal/reporting-schedule.vo';

/**
 * Database Schema Representation (Prisma-based)
 */
export interface GuardianshipPersistenceModel {
  id: string;
  // Ward Information
  wardId: string;
  wardDateOfBirth: Date;
  wardIsDeceased: boolean;
  wardIsIncapacitated: boolean;
  wardCurrentAge: number;
  wardInfoUpdatedAt: Date;

  // Customary Law
  customaryLawApplies: boolean;
  customaryDetails: Record<string, any> | null; // Fixed: Removed 'any | null' redundant union

  // Court Context
  courtOrderNumber: string | null;
  courtStation: string | null;
  courtOrderDate: Date | null;
  courtOrderType: string | null;

  // Guardianship Metadata
  establishedDate: Date;
  isActive: boolean;
  dissolvedDate: Date | null;
  dissolutionReason: string | null;

  // S.73 Compliance
  lastComplianceCheck: Date | null;
  complianceWarnings: string[];

  // Primary Guardian Reference
  primaryGuardianId: string | null;

  // Metadata
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  // Relations
  guardians: GuardianPersistenceModel[];
}

export interface GuardianPersistenceModel {
  id: string;
  guardianshipId: string;

  // Core Identity
  wardId: string;
  guardianId: string;

  // Legal Classification
  type: GuardianType;

  // Court Appointment
  courtOrderNumber: string | null;
  courtStation: string | null;
  appointmentDate: Date;
  validUntil: Date | null;

  // S.70 & S.71 Powers (stored as JSON)
  powers: {
    hasPropertyManagementPowers: boolean;
    canConsentToMedical: boolean;
    canConsentToMarriage: boolean;
    restrictions: string[];
    specialInstructions: string | null;
  };

  // S.72 Bond Information
  bondRequired: boolean;
  bondProvider: string | null;
  bondPolicyNumber: string | null;
  bondAmountKES: number | null;
  bondIssuedDate: Date | null;
  bondExpiryDate: Date | null;

  // S.73 Reporting
  reportingSchedule: {
    frequency: string;
    firstReportDue: Date;
    nextReportDue?: Date;
    lastReportDate?: Date;
    status: GuardianReportStatus;
    lastReportApprovedBy?: string;
  } | null;

  // Financial Allowance
  annualAllowanceKES: number | null;
  allowanceApprovedBy: string | null;

  // Status
  isActive: boolean;
  terminationDate: Date | null;
  terminationReason: string | null;

  // Customary Law
  customaryLawApplies: boolean;
  customaryDetails: Record<string, any> | null; // Fixed: Removed 'any | null' redundant union

  // Metadata
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Domain Events Persistence Model
 */
export interface DomainEventPersistenceModel {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: Record<string, any>;
  version: number;
  occurredAt: Date;
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
  };
}

/**
 * Guardianship Mapper
 *
 * Responsible for mapping between:
 * 1. Domain Model (GuardianshipAggregate, Guardian) <-> Persistence Model
 * 2. Domain Events <-> Event Store
 */
export class GuardianshipMapper {
  // ============================================================================
  // DOMAIN -> PERSISTENCE
  // ============================================================================

  /**
   * Map Guardianship Aggregate to Persistence Model
   */
  public static toPersistence(aggregate: GuardianshipAggregate): {
    guardianship: GuardianshipPersistenceModel;
    guardians: GuardianPersistenceModel[];
  } {
    const guardianship = aggregate as any;

    // Map Court Order
    const courtOrder = guardianship.props.courtOrder;

    // Map guardians
    const guardianModels: GuardianPersistenceModel[] = [];
    guardianship.props.guardians.forEach((guardian: Guardian) => {
      guardianModels.push(this.guardianToPersistence(guardian));
    });

    // Build persistence model
    const persistenceModel: GuardianshipPersistenceModel = {
      id: guardianship._id.toString(),

      // Ward Information
      wardId: guardianship.props.wardInfo.wardId,
      wardDateOfBirth: guardianship.props.wardInfo.dateOfBirth,
      wardIsDeceased: guardianship.props.wardInfo.isDeceased,
      wardIsIncapacitated: guardianship.props.wardInfo.isIncapacitated,
      wardCurrentAge: guardianship.props.wardInfo.currentAge,
      wardInfoUpdatedAt: guardianship.props.wardInfo.updatedAt,

      // Customary Law
      customaryLawApplies: guardianship.props.customaryLawApplies,
      customaryDetails: guardianship.props.customaryDetails
        ? JSON.parse(JSON.stringify(guardianship.props.customaryDetails))
        : null,

      // Court Context
      courtOrderNumber: courtOrder?.orderNumber || null,
      courtStation: courtOrder?.courtStation || null,
      courtOrderDate: courtOrder?.orderDate || null,
      courtOrderType: courtOrder?.orderType || null,

      // Guardianship Metadata
      establishedDate: guardianship.props.establishedDate,
      isActive: guardianship.props.isActive,
      dissolvedDate: guardianship.props.dissolvedDate || null,
      dissolutionReason: guardianship.props.dissolutionReason || null,

      // S.73 Compliance
      lastComplianceCheck: guardianship.props.lastComplianceCheck || null,
      complianceWarnings: [...guardianship.props.complianceWarnings],

      // Primary Guardian
      primaryGuardianId: guardianship.props.primaryGuardianId || null,

      // Metadata
      version: guardianship._version,
      createdAt: guardianship._createdAt,
      updatedAt: guardianship._updatedAt,
      deletedAt: guardianship._deletedAt || null,

      // Relations (will be populated separately in Prisma)
      guardians: guardianModels,
    };

    return {
      guardianship: persistenceModel,
      guardians: guardianModels,
    };
  }

  /**
   * Map Guardian Entity to Persistence Model
   */
  private static guardianToPersistence(guardian: Guardian): GuardianPersistenceModel {
    const guardianProps = (guardian as any).props;

    // Map Court Order
    const courtOrder = guardianProps.courtOrder;

    // Map Bond
    const bond = guardianProps.bond;

    // Map Reporting Schedule
    const reportingSchedule = guardianProps.reportingSchedule;

    // Map Powers
    const powers = guardianProps.powers;

    // Build reporting schedule data
    let reportingScheduleData: GuardianPersistenceModel['reportingSchedule'] = null;
    if (reportingSchedule) {
      reportingScheduleData = {
        frequency: reportingSchedule.frequency,
        firstReportDue: reportingSchedule.firstReportDue,
        status: reportingSchedule.status,
      };

      // Only add optional properties if they exist
      if (reportingSchedule.nextReportDue) {
        reportingScheduleData.nextReportDue = reportingSchedule.nextReportDue;
      }
      if (reportingSchedule.lastReportDate) {
        reportingScheduleData.lastReportDate = reportingSchedule.lastReportDate;
      }
      if (reportingSchedule.lastReportApprovedBy) {
        reportingScheduleData.lastReportApprovedBy = reportingSchedule.lastReportApprovedBy;
      }
    }

    return {
      id: guardian.id.toString(),
      guardianshipId: guardianProps.guardianshipId.toString(),

      // Core Identity
      wardId: guardianProps.wardId.toString(),
      guardianId: guardianProps.guardianId.toString(),

      // Legal Classification
      type: guardianProps.type,

      // Court Appointment
      courtOrderNumber: courtOrder?.orderNumber || null,
      courtStation: courtOrder?.courtStation || null,
      appointmentDate: guardianProps.appointmentDate,
      validUntil: guardianProps.validUntil || null,

      // Powers
      powers: {
        hasPropertyManagementPowers: powers.hasPropertyManagementPowers,
        canConsentToMedical: powers.canConsentToMedical,
        canConsentToMarriage: powers.canConsentToMarriage,
        restrictions: [...powers.restrictions],
        specialInstructions: powers.specialInstructions || null,
      },

      // S.72 Bond
      bondRequired: guardianProps.bondRequired,
      bondProvider: bond?.provider || null,
      bondPolicyNumber: bond?.policyNumber || null,
      bondAmountKES: bond?.amount?.getAmount() || null,
      bondIssuedDate: bond?.issuedDate || null,
      bondExpiryDate: bond?.expiryDate || null,

      // S.73 Reporting
      reportingSchedule: reportingScheduleData,

      // Financial Allowance
      annualAllowanceKES: guardianProps.annualAllowance?.getAmount() || null,
      allowanceApprovedBy: guardianProps.allowanceApprovedBy?.toString() || null,

      // Status
      isActive: guardianProps.isActive,
      terminationDate: guardianProps.terminationDate || null,
      terminationReason: guardianProps.terminationReason || null,

      // Customary Law
      customaryLawApplies: guardianProps.customaryLawApplies,
      customaryDetails: guardianProps.customaryDetails
        ? JSON.parse(JSON.stringify(guardianProps.customaryDetails))
        : null,

      // Metadata
      version: (guardian as any)._version,
      createdAt: (guardian as any)._createdAt,
      updatedAt: (guardian as any)._updatedAt,
      deletedAt: (guardian as any)._deletedAt || null,
    };
  }

  /**
   * Map Domain Event to Persistence Model
   */
  public static eventToPersistence(
    event: DomainEvent,
    metadata?: { userId?: string; correlationId?: string; causationId?: string },
  ): DomainEventPersistenceModel {
    // Fixed: Use eventId and toJSON() to get payload
    const eventJson = event.toJSON();

    return {
      id: eventJson.eventId, // Use eventId from JSON
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventType: event.getEventType(),
      eventData: eventJson.payload, // Get payload from JSON
      version: event.version,
      occurredAt: event.occurredAt,
      metadata,
    };
  }

  // ============================================================================
  // PERSISTENCE -> DOMAIN
  // ============================================================================

  /**
   * Map Persistence Model to Guardianship Aggregate
   */
  public static toDomain(
    guardianshipData: GuardianshipPersistenceModel,
    guardiansData: GuardianPersistenceModel[],
  ): GuardianshipAggregate {
    // Reconstruct Ward Info
    const wardInfo: WardInfo = {
      wardId: guardianshipData.wardId,
      dateOfBirth: guardianshipData.wardDateOfBirth,
      isDeceased: guardianshipData.wardIsDeceased,
      isIncapacitated: guardianshipData.wardIsIncapacitated,
      currentAge: guardianshipData.wardCurrentAge,
      updatedAt: guardianshipData.wardInfoUpdatedAt,
    };

    // Reconstruct Court Order
    let courtOrder: CourtOrder | undefined;
    if (guardianshipData.courtOrderNumber && guardianshipData.courtStation) {
      courtOrder = CourtOrder.create({
        orderNumber: guardianshipData.courtOrderNumber,
        courtStation: guardianshipData.courtStation,
        orderDate: guardianshipData.courtOrderDate || guardianshipData.establishedDate,
        orderType: guardianshipData.courtOrderType as any,
      });
    }

    // Reconstruct Customary Law Details
    let customaryDetails: CustomaryLawDetails | undefined;
    if (guardianshipData.customaryDetails) {
      const details = JSON.parse(JSON.stringify(guardianshipData.customaryDetails));
      customaryDetails = {
        ethnicGroup: details.ethnicGroup,
        customaryAuthority: details.customaryAuthority,
        ceremonyDate: details.ceremonyDate ? new Date(details.ceremonyDate) : undefined,
        witnessNames: details.witnessNames || [],
        elderApprovalRecords: (details.elderApprovalRecords || []).map((record: any) => ({
          elderName: record.elderName,
          approvalDate: new Date(record.approvalDate),
          role: record.role,
        })),
        specialConditions: details.specialConditions,
      };
    }

    // Reconstruct Guardians Map
    const guardiansMap = new Map<string, Guardian>();
    guardiansData.forEach((guardianData) => {
      const guardian = this.guardianFromPersistence(guardianData);
      guardiansMap.set(guardianData.guardianId, guardian);
    });

    // Reconstruct Aggregate Props
    const aggregateProps = {
      wardInfo,
      guardians: guardiansMap,
      primaryGuardianId: guardianshipData.primaryGuardianId || undefined,
      establishedDate: guardianshipData.establishedDate,
      customaryLawApplies: guardianshipData.customaryLawApplies,
      customaryDetails,
      courtOrder,
      isActive: guardianshipData.isActive,
      dissolvedDate: guardianshipData.dissolvedDate || undefined,
      dissolutionReason: guardianshipData.dissolutionReason || undefined,
      lastComplianceCheck: guardianshipData.lastComplianceCheck || undefined,
      complianceWarnings: [...guardianshipData.complianceWarnings],
    };

    // Reconstruct Aggregate
    return GuardianshipAggregate.fromPersistence(
      guardianshipData.id,
      aggregateProps,
      guardianshipData.createdAt,
    );
  }

  /**
   * Map Persistence Model to Guardian Entity
   */
  private static guardianFromPersistence(data: GuardianPersistenceModel): Guardian {
    // Reconstruct Court Order
    let courtOrder: CourtOrder | undefined;
    if (data.courtOrderNumber && data.courtStation) {
      courtOrder = CourtOrder.create({
        orderNumber: data.courtOrderNumber,
        courtStation: data.courtStation,
        orderDate: data.appointmentDate,
      });
    }

    // Reconstruct Powers
    const powers = GuardianPowers.create({
      hasPropertyManagementPowers: data.powers.hasPropertyManagementPowers,
      canConsentToMedical: data.powers.canConsentToMedical,
      canConsentToMarriage: data.powers.canConsentToMarriage,
      restrictions: data.powers.restrictions,
      specialInstructions: data.powers.specialInstructions || undefined,
    });

    // Reconstruct Bond
    let bond: GuardianBond | undefined;
    if (
      data.bondProvider &&
      data.bondPolicyNumber &&
      data.bondAmountKES &&
      data.bondIssuedDate &&
      data.bondExpiryDate
    ) {
      bond = GuardianBond.create({
        provider: data.bondProvider,
        policyNumber: data.bondPolicyNumber,
        amount: KenyanMoney.create(data.bondAmountKES),
        issuedDate: data.bondIssuedDate,
        expiryDate: data.bondExpiryDate,
      });
    }

    // Reconstruct Reporting Schedule - Fixed: Only pass required properties
    let reportingSchedule: ReportingSchedule | undefined;
    if (data.reportingSchedule) {
      const reportingProps: any = {
        frequency: data.reportingSchedule.frequency,
        firstReportDue: data.reportingSchedule.firstReportDue,
        status: data.reportingSchedule.status,
      };

      // Only add optional properties if they exist
      if (data.reportingSchedule.nextReportDue) {
        reportingProps.nextReportDue = data.reportingSchedule.nextReportDue;
      }
      if (data.reportingSchedule.lastReportDate) {
        reportingProps.lastReportDate = data.reportingSchedule.lastReportDate;
      }
      if (data.reportingSchedule.lastReportApprovedBy) {
        reportingProps.lastReportApprovedBy = data.reportingSchedule.lastReportApprovedBy;
      }

      reportingSchedule = ReportingSchedule.create(reportingProps);
    }

    // Reconstruct Allowance
    let annualAllowance: KenyanMoney | undefined;
    if (data.annualAllowanceKES) {
      annualAllowance = KenyanMoney.create(data.annualAllowanceKES);
    }

    // Reconstruct Allowance Approved By
    let allowanceApprovedBy: UniqueEntityID | undefined;
    if (data.allowanceApprovedBy) {
      allowanceApprovedBy = new UniqueEntityID(data.allowanceApprovedBy);
    }

    // Reconstruct Customary Details
    let customaryDetails: any;
    if (data.customaryDetails) {
      customaryDetails = JSON.parse(JSON.stringify(data.customaryDetails));
    }

    // Reconstruct Guardian Props
    const guardianProps = {
      wardId: new UniqueEntityID(data.wardId),
      guardianId: new UniqueEntityID(data.guardianId),
      guardianshipId: new UniqueEntityID(data.guardianshipId),
      type: data.type,
      courtOrder,
      appointmentDate: data.appointmentDate,
      validUntil: data.validUntil || undefined,
      powers,
      bond,
      bondRequired: data.bondRequired,
      reportingSchedule,
      annualAllowance,
      allowanceApprovedBy,
      isActive: data.isActive,
      terminationDate: data.terminationDate || undefined,
      terminationReason: (data.terminationReason as any) || undefined,
      customaryLawApplies: data.customaryLawApplies,
      customaryDetails,
    };

    // Reconstruct Guardian Entity
    return Guardian.fromPersistence(data.id, guardianProps, data.createdAt);
  }

  /**
   * Map Persistence Model to Domain Event
   * Using static imports to avoid dynamic import issues
   */
  public static eventFromPersistence(eventData: DomainEventPersistenceModel): DomainEvent {
    // Map event type to class
    const eventClassMap: Record<string, any> = {
      GuardianshipCreatedEvent: GuardianshipCreatedEvent,
      GuardianAppointedEvent: GuardianAppointedEvent,
      GuardianBondPostedEvent: GuardianBondPostedEvent,
      AnnualReportFiledEvent: AnnualReportFiledEvent,
      GuardianReplacedEvent: GuardianReplacedEvent,
      GuardianshipDissolvedEvent: GuardianshipDissolvedEvent,
      MultipleGuardiansAssignedEvent: MultipleGuardiansAssignedEvent,
      WardMajorityReachedEvent: WardMajorityReachedEvent,
      GuardianAllowanceUpdatedEvent: GuardianAllowanceUpdatedEvent,
      GuardianPowersGrantedEvent: GuardianPowersGrantedEvent,
      GuardianBondExpiredEvent: GuardianBondExpiredEvent,
    };

    const EventClass = eventClassMap[eventData.eventType];
    if (!EventClass) {
      throw new Error(`Unknown event type: ${eventData.eventType}`);
    }

    // Create event instance with proper parameters
    return new EventClass(
      eventData.aggregateId,
      eventData.aggregateType,
      eventData.version,
      eventData.eventData,
      new UniqueEntityID(eventData.id),
      eventData.occurredAt,
    );
  }

  // ============================================================================
  // QUERY PROJECTIONS
  // ============================================================================

  /**
   * Map to DTO for API responses
   */
  public static toDTO(aggregate: GuardianshipAggregate): any {
    return aggregate.toJSON();
  }

  /**
   * Map to List DTO (lightweight version)
   */
  public static toListDTO(aggregate: GuardianshipAggregate): any {
    const compliance = aggregate.getComplianceStatus();

    return {
      id: aggregate.id.toString(),
      wardId: aggregate.wardId,
      establishedDate: aggregate.establishedDate,
      isActive: aggregate.isActive,
      activeGuardiansCount: aggregate.getActiveGuardians().length,
      primaryGuardianId: (aggregate as any).props.primaryGuardianId,
      wardAge: (aggregate as any).props.wardInfo.currentAge,
      complianceStatus: compliance.isFullyCompliant ? 'COMPLIANT' : 'NON_COMPLIANT',
      complianceWarnings: compliance.warnings,
      isCustomaryLaw: aggregate.isCustomaryLawGuardianship(),
      dissolvedDate: aggregate.dissolvedDate,
      version: (aggregate as any)._version,
      updatedAt: (aggregate as any)._updatedAt,
    };
  }

  /**
   * Map to Compliance Report DTO
   */
  public static toComplianceReportDTO(aggregate: GuardianshipAggregate): any {
    const compliance = aggregate.getComplianceStatus();
    const activeGuardians = aggregate.getActiveGuardians();

    return {
      guardianshipId: aggregate.id.toString(),
      wardId: aggregate.wardId,
      isActive: aggregate.isActive,
      overallCompliance: compliance.isFullyCompliant,
      s72Compliant: compliance.s72Compliant,
      s73Compliant: compliance.s73Compliant,
      complianceWarnings: compliance.warnings,
      lastComplianceCheck: (aggregate as any).props.lastComplianceCheck,

      guardiansCompliance: activeGuardians.map((guardian) => ({
        guardianId: guardian.guardianId.toString(),
        name: `Guardian ${guardian.guardianId.toString().slice(0, 8)}`,
        requiresBond: guardian.requiresBond(),
        isBondPosted: guardian.isBondPosted(),
        isBondExpired: guardian.isBondExpired(),
        requiresAnnualReport: guardian.requiresAnnualReport(),
        isReportOverdue: guardian.isReportOverdue(),
        s73ComplianceStatus: guardian.getS73ComplianceStatus(),
      })),

      recommendedActions: this.generateRecommendedActions(aggregate),
    };
  }

  /**
   * Generate recommended compliance actions
   */
  private static generateRecommendedActions(aggregate: GuardianshipAggregate): string[] {
    const actions: string[] = [];
    const compliance = aggregate.getComplianceStatus();

    if (!compliance.s72Compliant) {
      actions.push('POST_BOND: One or more guardians need to post S.72 bond');
    }

    if (!compliance.s73Compliant) {
      actions.push('FILE_REPORTS: One or more guardians have overdue annual reports');
    }

    if (
      aggregate.isActive &&
      !aggregate.isWardMinor() &&
      !(aggregate as any).props.wardInfo.isIncapacitated
    ) {
      actions.push('DISSOLVE: Ward has reached majority and is not incapacitated');
    }

    const activeGuardians = aggregate.getActiveGuardians();
    activeGuardians.forEach((guardian) => {
      if (guardian.isBondPosted()) {
        const bond = guardian.getBond()!;
        const daysUntilExpiry = Math.ceil(
          (bond.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        if (daysUntilExpiry <= 30) {
          actions.push(
            `RENEW_BOND: Guardian ${guardian.guardianId.toString()}'s bond expires in ${daysUntilExpiry} days`,
          );
        }
      }
    });

    return actions;
  }

  // ============================================================================
  // EVENT STORE HELPERS
  // ============================================================================

  /**
   * Extract all domain events from aggregate for persistence
   */
  public static extractEvents(aggregate: GuardianshipAggregate): DomainEventPersistenceModel[] {
    const events = (aggregate as any)._domainEvents || [];
    return events.map((event: DomainEvent) =>
      this.eventToPersistence(event, {
        correlationId: (event as any).metadata?.correlationId,
        causationId: (event as any).metadata?.causationId,
      }),
    );
  }

  /**
   * Clear domain events after persistence
   */
  public static clearEvents(aggregate: GuardianshipAggregate): void {
    (aggregate as any)._domainEvents = [];
  }

  /**
   * Calculate aggregate version from events
   */
  public static calculateVersionFromEvents(events: DomainEventPersistenceModel[]): number {
    if (events.length === 0) return 0;
    return Math.max(...events.map((e) => e.version));
  }
}
