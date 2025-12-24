// src/domain/aggregates/guardianship.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  ComplianceCheckEntity,
  CompliancePeriod,
  ComplianceStatus,
  ReportType,
  WardStatusReport,
} from '../entities/compliance-check.entity';
import {
  GuardianAppointmentSource,
  GuardianAssignmentEntity,
  GuardianAssignmentStatus,
  GuardianRole,
} from '../entities/guardian-assignment.entity';
import {
  ComplianceCheckDueEvent,
  GuardianAppointedEvent,
  GuardianConflictDetectedEvent,
  GuardianshipCreatedEvent,
  GuardianshipTerminatedEvent,
  RiskFlagRaisedEvent,
} from '../events/guardianship-events';
import { ComplianceScheduleVO } from '../value-objects/compliance-schedule.vo';
import { FamilyMemberReferenceVO } from '../value-objects/family-member-reference.vo';
import { GuardianshipPeriodVO } from '../value-objects/guardianship-period.vo';
import { GuardianshipTypeVO } from '../value-objects/guardianship-type.vo';
import { KenyanCourtOrderVO } from '../value-objects/kenyan-court-order.vo';

// -----------------------------------------------------------------------------
// ENUMS & INTERFACES - Strictly Family Service Domain
// -----------------------------------------------------------------------------

export enum GuardianshipStatus {
  PENDING_ACTIVATION = 'PENDING_ACTIVATION', // Appointed but not yet effective
  ACTIVE = 'ACTIVE', // Currently caring for ward
  SUSPENDED = 'SUSPENDED', // Temporarily inactive (court order)
  TERMINATED = 'TERMINATED', // Ended (ward reached 18, death, court)
  REVOKED = 'REVOKED', // Removed by court for cause
  EMERGENCY = 'EMERGENCY', // Temporary emergency appointment
}

export enum GuardianshipJurisdiction {
  STATUTORY = 'STATUTORY', // Children Act Cap 141
  ISLAMIC = 'ISLAMIC', // Kadhi's Court jurisdiction
  CUSTOMARY = 'CUSTOMARY', // African customary law
  INTERNATIONAL = 'INTERNATIONAL', // Cross-border cases
}

export enum GuardianshipPriority {
  NORMAL = 'NORMAL', // Standard guardianship
  HIGH = 'HIGH', // Ward with special needs
  CRITICAL = 'CRITICAL', // Emergency/abuse situation
}

export interface GuardianshipProps {
  // ============================================
  // CORE IDENTITY & KINSHIP DATA (Family Service)
  // ============================================

  // Ward Identity (Who is being protected)
  wardReference: FamilyMemberReferenceVO; // Links to FamilyMember
  wardFullName: string;
  wardDateOfBirth: Date;
  wardIsMinor: boolean; // Calculated: < 18 years

  // Guardianship Legal Framework
  guardianshipType: GuardianshipTypeVO;
  period: GuardianshipPeriodVO;
  jurisdiction: GuardianshipJurisdiction;

  // Court Authority (If applicable)
  courtOrder?: KenyanCourtOrderVO;
  courtCaseNumber?: string;

  // ============================================
  // LEGAL AUTHORITY MANAGEMENT
  // ============================================

  // Status & Timeline
  status: GuardianshipStatus;
  establishedDate: Date;
  effectiveDate?: Date; // When guardianship actually starts
  terminationDate?: Date;
  terminationReason?: string;

  // Emergency/Temporary Status
  isEmergency: boolean;
  isTemporary: boolean;
  priorityLevel: GuardianshipPriority;

  // ============================================
  // GUARDIAN ASSIGNMENTS (Who has authority)
  // ============================================

  guardianAssignments: GuardianAssignmentEntity[];

  // ============================================
  // COMPLIANCE & WELFARE REPORTING
  // ============================================

  complianceSchedule: ComplianceScheduleVO;
  complianceChecks: ComplianceCheckEntity[];
  nextComplianceDue: Date;

  // ============================================
  // RISK MANAGEMENT (Care-related only - NO FINANCIAL)
  // ============================================

  riskFactors: CareRiskFactor[];
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // ============================================
  // FAMILY NOTIFICATION & COORDINATION
  // ============================================

  familyContacts: FamilyContact[];
  notificationPreferences: NotificationPreferences;

  // ============================================
  // METADATA & AUDIT
  // ============================================

  legalNotes?: string;
  specialCircumstances?: string;
  history: GuardianshipHistoryEntry[];
  version: number;
}

// -----------------------------------------------------------------------------
// VALUE OBJECTS & INTERFACES
// -----------------------------------------------------------------------------

export interface CareRiskFactor {
  category: 'GUARDIAN_CONFLICT' | 'WARD_SAFETY' | 'CARE_QUALITY' | 'COMPLIANCE' | 'LEGAL';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigationPlan?: string;
  detectedAt: Date;
  resolvedAt?: Date;
  detectedBy?: string;
}

export interface FamilyContact {
  familyMemberId: string;
  relationshipToWard: string; // "Mother", "Aunt", "Grandparent"
  contactPriority: 'PRIMARY' | 'SECONDARY' | 'EMERGENCY';
  notificationChannels: ('EMAIL' | 'SMS' | 'WHATSAPP')[];
  canMakeDecisions: boolean;
}

export interface NotificationPreferences {
  guardianUpdates: boolean;
  complianceReminders: boolean;
  riskAlerts: boolean;
  courtHearings: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface GuardianshipHistoryEntry {
  timestamp: Date;
  eventType: string;
  description: string;
  actorId?: string;
  actorType: 'SYSTEM' | 'COURT' | 'GUARDIAN' | 'FAMILY';
  metadata?: Record<string, any>;
}

// -----------------------------------------------------------------------------
// AGGREGATE ROOT - GUARDIANSHIP
// -----------------------------------------------------------------------------

export class GuardianshipAggregate extends AggregateRoot<GuardianshipProps> {
  // Kenyan Legal Constants (Children Act)
  private static readonly KENYAN_MAJORITY_AGE = 18;
  private static readonly EMERGENCY_GUARDIANSHIP_MAX_DAYS = 30;
  private static readonly COMPLIANCE_EXTENSION_DAYS = 14;

  // Business Rules
  private static readonly MAX_PRIMARY_GUARDIANS = 1;
  private static readonly MAX_ALTERNATE_GUARDIANS = 2;

  private constructor(id: UniqueEntityID, props: GuardianshipProps) {
    super(id, props);
  }

  // ---------------------------------------------------------------------------
  // 🏭 FACTORY METHODS
  // ---------------------------------------------------------------------------

  public static createTestamentaryGuardianship(params: {
    wardReference: FamilyMemberReferenceVO;
    guardianReference: FamilyMemberReferenceVO;
    appointingParentId: string; // Deceased parent who appointed in will
    willReference?: string;
    effectiveDate?: Date;
  }): GuardianshipAggregate {
    // Children Act Section 24: Testamentary Guardianship
    const props: GuardianshipProps = {
      wardReference: params.wardReference,
      wardFullName: params.wardReference.fullName,
      wardDateOfBirth: params.wardReference.dateOfBirth,
      wardIsMinor: this.isMinor(params.wardReference.dateOfBirth),

      guardianshipType: GuardianshipTypeVO.create('TESTAMENTARY'),
      period: GuardianshipPeriodVO.createUntilMajority(params.wardReference.dateOfBirth),
      jurisdiction: GuardianshipJurisdiction.STATUTORY,

      status: GuardianshipStatus.PENDING_ACTIVATION,
      establishedDate: new Date(),
      effectiveDate: params.effectiveDate,

      isEmergency: false,
      isTemporary: false,
      priorityLevel: GuardianshipPriority.NORMAL,

      guardianAssignments: [],
      complianceSchedule: ComplianceScheduleVO.createAnnual(),
      complianceChecks: [],
      nextComplianceDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year

      riskFactors: [],
      overallRiskLevel: 'LOW',

      familyContacts: [],
      notificationPreferences: {
        guardianUpdates: true,
        complianceReminders: true,
        riskAlerts: true,
        courtHearings: true,
        channels: { email: true, sms: true, push: false },
      },

      history: [],
      version: 1,
    };

    const aggregate = new GuardianshipAggregate(new UniqueEntityID(), props);

    // Create guardian assignment
    const guardianAssignment = GuardianAssignmentEntity.create({
      guardianId: params.guardianReference.memberId,
      guardianUserId: params.guardianReference.userId,
      guardianName: params.guardianReference.fullName,
      role: GuardianRole.CARETAKER,
      isPrimary: true,
      isAlternate: false,
      appointmentDate: new Date(),
      appointmentSource: GuardianAppointmentSource.WILL,
      contactInfo: params.guardianReference.contactInfo,
      courtOrderReference: params.willReference,
    });

    aggregate.appointGuardian(guardianAssignment);

    aggregate.addHistoryEntry(
      'TESTAMENTARY_GUARDIANSHIP_CREATED',
      `Testamentary guardianship created via will of parent ${params.appointingParentId}`,
      'SYSTEM',
      { willReference: params.willReference },
    );

    aggregate.addDomainEvent(
      new GuardianshipCreatedEvent(aggregate.id.toString(), {
        wardId: params.wardReference.memberId,
        guardianshipType: 'TESTAMENTARY',
        establishedDate: props.establishedDate,
        appointingParentId: params.appointingParentId,
      }),
    );

    return aggregate;
  }

  public static createCourtAppointedGuardianship(params: {
    wardReference: FamilyMemberReferenceVO;
    courtOrder: KenyanCourtOrderVO;
    guardianReferences: FamilyMemberReferenceVO[];
    caseNumber: string;
    isEmergency?: boolean;
    effectiveImmediately?: boolean;
  }): GuardianshipAggregate {
    // Children Act Section 25: Court-Appointed Guardianship
    const props: GuardianshipProps = {
      wardReference: params.wardReference,
      wardFullName: params.wardReference.fullName,
      wardDateOfBirth: params.wardReference.dateOfBirth,
      wardIsMinor: this.isMinor(params.wardReference.dateOfBirth),

      guardianshipType: GuardianshipTypeVO.create('COURT_APPOINTED'),
      period: GuardianshipPeriodVO.createFromCourtOrder(params.courtOrder),
      jurisdiction:
        params.courtOrder.jurisdiction === 'KADHI'
          ? GuardianshipJurisdiction.ISLAMIC
          : GuardianshipJurisdiction.STATUTORY,

      courtOrder: params.courtOrder,
      courtCaseNumber: params.caseNumber,

      status: params.isEmergency
        ? GuardianshipStatus.EMERGENCY
        : params.effectiveImmediately
          ? GuardianshipStatus.ACTIVE
          : GuardianshipStatus.PENDING_ACTIVATION,
      establishedDate: new Date(),
      effectiveDate: params.effectiveImmediately ? new Date() : undefined,

      isEmergency: params.isEmergency || false,
      isTemporary: params.courtOrder.isTemporaryOrder || false,
      priorityLevel: params.isEmergency
        ? GuardianshipPriority.CRITICAL
        : GuardianshipPriority.NORMAL,

      guardianAssignments: [],
      complianceSchedule: ComplianceScheduleVO.createFromCourtOrder(params.courtOrder),
      complianceChecks: [],
      nextComplianceDue:
        params.courtOrder.firstReportingDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days

      riskFactors: [],
      overallRiskLevel: params.isEmergency ? 'HIGH' : 'LOW',

      familyContacts: [],
      notificationPreferences: {
        guardianUpdates: true,
        complianceReminders: true,
        riskAlerts: true,
        courtHearings: true,
        channels: { email: true, sms: true, push: true },
      },

      legalNotes: params.courtOrder.notes,
      history: [],
      version: 1,
    };

    const aggregate = new GuardianshipAggregate(new UniqueEntityID(), props);

    // Appoint guardians in order (first is primary)
    params.guardianReferences.forEach((ref, index) => {
      const guardianAssignment = GuardianAssignmentEntity.create({
        guardianId: ref.memberId,
        guardianUserId: ref.userId,
        guardianName: ref.fullName,
        role: GuardianRole.CARETAKER,
        isPrimary: index === 0,
        isAlternate: index > 0,
        appointmentDate: new Date(),
        appointmentSource: GuardianAppointmentSource.COURT,
        contactInfo: ref.contactInfo,
        courtOrderReference: params.caseNumber,
      });

      aggregate.appointGuardian(guardianAssignment);
    });

    const eventType = params.isEmergency
      ? 'EMERGENCY_GUARDIANSHIP_CREATED'
      : 'COURT_GUARDIANSHIP_CREATED';
    aggregate.addHistoryEntry(
      eventType,
      `${params.isEmergency ? 'Emergency' : 'Court'} guardianship created via ${params.courtOrder.courtName}`,
      'COURT',
      { caseNumber: params.caseNumber, judge: params.courtOrder.judgeName },
    );

    aggregate.addDomainEvent(
      new GuardianshipCreatedEvent(aggregate.id.toString(), {
        wardId: params.wardReference.memberId,
        guardianshipType: 'COURT_APPOINTED',
        establishedDate: props.establishedDate,
        courtCaseNumber: params.caseNumber,
        isEmergency: params.isEmergency,
      }),
    );

    return aggregate;
  }

  public static createCustomaryGuardianship(params: {
    wardReference: FamilyMemberReferenceVO;
    guardianReference: FamilyMemberReferenceVO;
    clanEldersCouncil: string;
    customaryLaw: string;
    effectiveDate?: Date;
  }): GuardianshipAggregate {
    // Customary Law Guardianship
    const props: GuardianshipProps = {
      wardReference: params.wardReference,
      wardFullName: params.wardReference.fullName,
      wardDateOfBirth: params.wardReference.dateOfBirth,
      wardIsMinor: this.isMinor(params.wardReference.dateOfBirth),

      guardianshipType: GuardianshipTypeVO.create('CUSTOMARY'),
      period: GuardianshipPeriodVO.createUntilMajority(params.wardReference.dateOfBirth),
      jurisdiction: GuardianshipJurisdiction.CUSTOMARY,

      status: GuardianshipStatus.PENDING_ACTIVATION,
      establishedDate: new Date(),
      effectiveDate: params.effectiveDate,

      isEmergency: false,
      isTemporary: false,
      priorityLevel: GuardianshipPriority.NORMAL,

      guardianAssignments: [],
      complianceSchedule: ComplianceScheduleVO.createAnnual(),
      complianceChecks: [],
      nextComplianceDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),

      riskFactors: [],
      overallRiskLevel: 'LOW',

      familyContacts: [],
      notificationPreferences: {
        guardianUpdates: true,
        complianceReminders: true,
        riskAlerts: true,
        courtHearings: false,
        channels: { email: false, sms: true, push: false },
      },

      specialCircumstances: `Appointed by ${params.clanEldersCouncil} under ${params.customaryLaw}`,
      history: [],
      version: 1,
    };

    const aggregate = new GuardianshipAggregate(new UniqueEntityID(), props);

    const guardianAssignment = GuardianAssignmentEntity.create({
      guardianId: params.guardianReference.memberId,
      guardianUserId: params.guardianReference.userId,
      guardianName: params.guardianReference.fullName,
      role: GuardianRole.CARETAKER,
      isPrimary: true,
      isAlternate: false,
      appointmentDate: new Date(),
      appointmentSource: GuardianAppointmentSource.CUSTOMARY_COUNCIL,
      contactInfo: params.guardianReference.contactInfo,
      specialInstructions: `Appointed by ${params.clanEldersCouncil}`,
    });

    aggregate.appointGuardian(guardianAssignment);

    aggregate.addHistoryEntry(
      'CUSTOMARY_GUARDIANSHIP_CREATED',
      `Customary guardianship created by ${params.clanEldersCouncil}`,
      'CUSTOMARY_COUNCIL',
      { clan: params.clanEldersCouncil, customaryLaw: params.customaryLaw },
    );

    return aggregate;
  }

  // ---------------------------------------------------------------------------
  // 👨‍⚖️ CORE BUSINESS LOGIC - GUARDIAN MANAGEMENT
  // ---------------------------------------------------------------------------

  public appointGuardian(assignment: GuardianAssignmentEntity): void {
    this.validateGuardianshipIsApprovable();

    // CHILDREN ACT INVARIANT: No conflicting active guardianships
    const existingActive = this.props.guardianAssignments.find(
      (ga) => ga.status === GuardianAssignmentStatus.ACTIVE,
    );

    if (existingActive && assignment.isPrimary) {
      throw new Error('Cannot appoint primary guardian when another active guardianship exists');
    }

    // Validate primary guardian count
    if (assignment.isPrimary) {
      const existingPrimary = this.props.guardianAssignments.find(
        (ga) => ga.isPrimary && ga.status !== GuardianAssignmentStatus.TERMINATED,
      );
      if (existingPrimary) {
        throw new Error('Cannot appoint multiple primary guardians');
      }
    }

    // Validate alternate guardian count
    if (assignment.isAlternate) {
      const existingAlternates = this.props.guardianAssignments.filter(
        (ga) => ga.isAlternate && ga.status !== GuardianAssignmentStatus.TERMINATED,
      ).length;
      if (existingAlternates >= GuardianshipAggregate.MAX_ALTERNATE_GUARDIANS) {
        throw new Error(
          `Maximum ${GuardianshipAggregate.MAX_ALTERNATE_GUARDIANS} alternate guardians allowed`,
        );
      }
    }

    // Check for family conflicts
    this.checkForFamilyConflicts(assignment);

    this.props.guardianAssignments.push(assignment);

    this.addHistoryEntry(
      'GUARDIAN_APPOINTED',
      `Appointed ${assignment.isPrimary ? 'Primary' : 'Alternate'} Guardian: ${assignment.props.guardianName}`,
      'SYSTEM',
      {
        guardianId: assignment.guardianId,
        role: assignment.props.role,
        appointmentSource: assignment.props.appointmentSource,
      },
    );

    this.addDomainEvent(
      new GuardianAppointedEvent(this.id.toString(), this.getVersion(), {
        guardianId: assignment.guardianId,
        role: assignment.props.role,
        isPrimary: assignment.isPrimary,
        guardianshipId: this.id.toString(),
      }),
    );

    this.incrementVersion();
  }

  private checkForFamilyConflicts(assignment: GuardianAssignmentEntity): void {
    // Check if guardian is a parent (normal) vs other relative (potential conflict)
    // This would integrate with Family Service to check relationships
    const isParent = false; // Would query Family Service
    const isCloseRelative = false; // Would query Family Service

    if (!isParent && !isCloseRelative) {
      this.addRiskFactor(
        'GUARDIAN_CONFLICT',
        `Guardian ${assignment.props.guardianName} is not a parent or close relative`,
        'MEDIUM',
        'Monitor for family acceptance and cooperation',
      );

      this.addDomainEvent(
        new GuardianConflictDetectedEvent(this.id.toString(), this.getVersion(), {
          guardianId: assignment.guardianId,
          conflictType: 'NON_FAMILY_GUARDIAN',
          severity: 'MEDIUM',
        }),
      );
    }
  }

  public activateGuardianship(effectiveDate: Date = new Date()): void {
    if (this.props.status !== GuardianshipStatus.PENDING_ACTIVATION) {
      throw new Error('Guardianship must be in PENDING_ACTIVATION state');
    }

    if (!this.props.guardianAssignments.some((ga) => ga.isPrimary)) {
      throw new Error('Cannot activate without a primary guardian');
    }

    // Activate all guardian assignments
    this.props.guardianAssignments.forEach((assignment) => {
      if (assignment.status === GuardianAssignmentStatus.PENDING) {
        assignment.activate(effectiveDate);
      }
    });

    this.props.status = GuardianshipStatus.ACTIVE;
    this.props.effectiveDate = effectiveDate;

    // Schedule first compliance check
    this.scheduleNextComplianceCheck();

    this.addHistoryEntry(
      'GUARDIANSHIP_ACTIVATED',
      `Guardianship activated effective ${effectiveDate.toLocaleDateString()}`,
      'SYSTEM',
      { effectiveDate, guardiansCount: this.props.guardianAssignments.length },
    );

    this.incrementVersion();
  }

  public terminateGuardianship(
    reason: GuardianshipTerminationReason,
    terminationDate: Date = new Date(),
    terminatedBy?: { id: string; type: 'COURT' | 'GUARDIAN' | 'FAMILY' },
  ): void {
    this.validateGuardianshipIsTerminable(reason);

    this.props.status = GuardianshipStatus.TERMINATED;
    this.props.terminationDate = terminationDate;
    this.props.terminationReason = reason;

    // Terminate all active guardian assignments
    this.props.guardianAssignments.forEach((assignment) => {
      if (assignment.status === GuardianAssignmentStatus.ACTIVE) {
        assignment.deactivate(`Guardianship terminated: ${reason}`, terminationDate);
      }
    });

    // Create final compliance report
    this.createFinalComplianceReport(reason, terminationDate);

    this.addHistoryEntry(
      'GUARDIANSHIP_TERMINATED',
      `Guardianship terminated: ${reason}`,
      terminatedBy?.type || 'SYSTEM',
      {
        reason,
        terminationDate,
        terminatedById: terminatedBy?.id,
        wardAgeAtTermination: this.calculateWardAge(terminationDate),
      },
    );

    this.addDomainEvent(
      new GuardianshipTerminatedEvent(this.id.toString(), this.getVersion(), {
        reason,
        terminationDate,
        wardId: this.props.wardReference.memberId,
      }),
    );

    this.incrementVersion();
  }

  // ---------------------------------------------------------------------------
  // 📋 COMPLIANCE MANAGEMENT
  // ---------------------------------------------------------------------------

  private scheduleNextComplianceCheck(): void {
    const nextDue = this.props.complianceSchedule.getNextDueDate(
      this.props.complianceChecks[this.props.complianceChecks.length - 1]?.props.dueDate,
    );

    this.props.nextComplianceDue = nextDue;

    const complianceCheck = ComplianceCheckEntity.create({
      guardianshipId: this.id.toString(),
      year: nextDue.getFullYear(),
      reportingPeriod: this.determineReportingPeriod(nextDue),
      schedule: this.props.complianceSchedule,
      dueDate: nextDue,
      submissionDeadline: new Date(nextDue.getTime() + 30 * 24 * 60 * 60 * 1000),
      reportTitle: `${this.props.wardFullName} - ${this.getReportingPeriodName(nextDue)} Welfare Report`,
      reportType: ReportType.ANNUAL_WELFARE,
      autoGenerated: false,
      sections: this.generateDefaultWelfareSections(),
      attachments: [],
      wardStatus: this.generateInitialWardStatus(),
    });

    this.props.complianceChecks.push(complianceCheck);

    this.addDomainEvent(
      new ComplianceCheckDueEvent(this.id.toString(), this.getVersion(), {
        dueDate: nextDue,
        guardianshipId: this.id.toString(),
        wardName: this.props.wardFullName,
      }),
    );

    this.addHistoryEntry(
      'COMPLIANCE_CHECK_SCHEDULED',
      `Next welfare report due: ${nextDue.toLocaleDateString()}`,
      'SYSTEM',
      { dueDate: nextDue, reportType: 'ANNUAL_WELFARE' },
    );

    this.incrementVersion();
  }

  public submitWelfareReport(
    complianceCheckId: string,
    reportData: {
      wardStatus: WardStatusReport;
      educationalProgress?: any;
      healthUpdates?: any;
      guardianNotes?: string;
      submittedBy: string;
    },
  ): void {
    const check = this.props.complianceChecks.find((cc) => cc.id.toString() === complianceCheckId);
    if (!check) {
      throw new Error('Compliance check not found');
    }

    // Update report with submitted data
    check.props.wardStatus = reportData.wardStatus;
    if (reportData.educationalProgress) {
      check.props.educationalProgress = reportData.educationalProgress;
    }
    if (reportData.healthUpdates) {
      check.props.healthUpdates = reportData.healthUpdates;
    }
    if (reportData.guardianNotes) {
      check.props.notes = reportData.guardianNotes;
    }

    // Submit the check
    check.submit({
      method: 'E_FILING',
      details: `Submitted by ${reportData.submittedBy}`,
      timestamp: new Date(),
    });

    // Update risk assessment based on report
    this.assessWelfareRisks(check);

    this.addHistoryEntry(
      'WELFARE_REPORT_SUBMITTED',
      `Welfare report submitted for ${check.props.year} ${check.props.reportingPeriod}`,
      'GUARDIAN',
      {
        submittedBy: reportData.submittedBy,
        qualityScore: check.props.qualityScore,
        riskFlags: check.props.validationErrors.length,
      },
    );

    this.incrementVersion();
  }

  private assessWelfareRisks(check: ComplianceCheckEntity): void {
    const status = check.props.wardStatus;

    if (status.generalHealth === 'POOR') {
      this.addRiskFactor(
        'WARD_SAFETY',
        'Ward reported in poor health',
        'HIGH',
        'Schedule medical checkup and monitor closely',
      );
    }

    if (status.emotionalWellbeing === 'DISTRESSED') {
      this.addRiskFactor(
        'CARE_QUALITY',
        'Ward reported emotionally distressed',
        'MEDIUM',
        'Consider counseling or family therapy',
      );
    }

    if (status.livingConditions === 'INADEQUATE') {
      this.addRiskFactor(
        'CARE_QUALITY',
        'Ward living conditions reported inadequate',
        'CRITICAL',
        'Immediate home visit and assessment required',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 🚨 RISK MANAGEMENT (Care-focused only)
  // ---------------------------------------------------------------------------

  public addRiskFactor(
    category: CareRiskFactor['category'],
    description: string,
    severity: CareRiskFactor['severity'],
    mitigationPlan?: string,
    detectedBy?: string,
  ): void {
    const riskFactor: CareRiskFactor = {
      category,
      description,
      severity,
      mitigationPlan,
      detectedAt: new Date(),
      detectedBy,
    };

    this.props.riskFactors.push(riskFactor);
    this.recalculateOverallRiskLevel();

    this.addDomainEvent(
      new RiskFlagRaisedEvent(this.id.toString(), this.getVersion(), {
        riskCategory: category,
        severity,
        description,
        guardianshipId: this.id.toString(),
      }),
    );

    this.addHistoryEntry(
      'RISK_FACTOR_ADDED',
      `Risk factor added: ${description}`,
      detectedBy ? 'GUARDIAN' : 'SYSTEM',
      { category, severity, detectedBy },
    );

    this.incrementVersion();
  }

  private recalculateOverallRiskLevel(): void {
    const activeRisks = this.props.riskFactors.filter((rf) => !rf.resolvedAt);

    if (activeRisks.some((rf) => rf.severity === 'CRITICAL')) {
      this.props.overallRiskLevel = 'CRITICAL';
    } else if (activeRisks.some((rf) => rf.severity === 'HIGH')) {
      this.props.overallRiskLevel = 'HIGH';
    } else if (activeRisks.some((rf) => rf.severity === 'MEDIUM')) {
      this.props.overallRiskLevel = 'MEDIUM';
    } else {
      this.props.overallRiskLevel = 'LOW';
    }
  }

  // ---------------------------------------------------------------------------
  // 👪 FAMILY COORDINATION
  // ---------------------------------------------------------------------------

  public addFamilyContact(contact: FamilyContact): void {
    // Validate unique family member
    const existingContact = this.props.familyContacts.find(
      (fc) => fc.familyMemberId === contact.familyMemberId,
    );

    if (existingContact) {
      throw new Error('Family member already in contacts list');
    }

    // Validate primary contact count
    if (contact.contactPriority === 'PRIMARY') {
      const primaryContacts = this.props.familyContacts.filter(
        (fc) => fc.contactPriority === 'PRIMARY',
      ).length;
      if (primaryContacts >= 2) {
        throw new Error('Maximum 2 primary family contacts allowed');
      }
    }

    this.props.familyContacts.push(contact);

    this.addHistoryEntry(
      'FAMILY_CONTACT_ADDED',
      `Added family contact: ${contact.relationshipToWard}`,
      'SYSTEM',
      {
        familyMemberId: contact.familyMemberId,
        relationship: contact.relationshipToWard,
        priority: contact.contactPriority,
      },
    );

    this.incrementVersion();
  }

  // ---------------------------------------------------------------------------
  // 📊 REPORTING & ANALYTICS (Family Service boundaries)
  // ---------------------------------------------------------------------------

  public generateGuardianshipSummary(): {
    wardInfo: {
      fullName: string;
      dateOfBirth: Date;
      age: number;
      isMinor: boolean;
    };
    guardianshipInfo: {
      type: string;
      status: string;
      establishedDate: Date;
      jurisdiction: string;
      riskLevel: string;
    };
    guardians: Array<{
      name: string;
      role: string;
      status: string;
      appointmentSource: string;
      isPrimary: boolean;
    }>;
    compliance: {
      nextDue: Date;
      recentReports: number;
      overallStatus: string;
    };
    activeRisks: CareRiskFactor[];
  } {
    const wardAge = this.calculateWardAge();

    return {
      wardInfo: {
        fullName: this.props.wardFullName,
        dateOfBirth: this.props.wardDateOfBirth,
        age: wardAge,
        isMinor: this.props.wardIsMinor,
      },
      guardianshipInfo: {
        type: this.props.guardianshipType.getValue().value,
        status: this.props.status,
        establishedDate: this.props.establishedDate,
        jurisdiction: this.props.jurisdiction,
        riskLevel: this.props.overallRiskLevel,
      },
      guardians: this.props.guardianAssignments
        .filter((ga) => ga.status !== GuardianAssignmentStatus.TERMINATED)
        .map((ga) => ({
          name: ga.props.guardianName,
          role: ga.props.role,
          status: ga.status,
          appointmentSource: ga.props.appointmentSource,
          isPrimary: ga.isPrimary,
        })),
      compliance: {
        nextDue: this.props.nextComplianceDue,
        recentReports: this.props.complianceChecks.filter(
          (cc) => cc.status === ComplianceStatus.ACCEPTED,
        ).length,
        overallStatus: this.calculateComplianceStatus(),
      },
      activeRisks: this.props.riskFactors.filter((rf) => !rf.resolvedAt),
    };
  }

  // ---------------------------------------------------------------------------
  // 🔒 VALIDATION & HELPER METHODS
  // ---------------------------------------------------------------------------

  private validateGuardianshipIsApprovable(): void {
    if (
      this.props.status !== GuardianshipStatus.PENDING_ACTIVATION &&
      this.props.status !== GuardianshipStatus.ACTIVE &&
      this.props.status !== GuardianshipStatus.EMERGENCY
    ) {
      throw new Error('Guardianship is not in an approvable state');
    }
  }

  private validateGuardianshipIsTerminable(reason: GuardianshipTerminationReason): void {
    if (this.props.status === GuardianshipStatus.TERMINATED) {
      throw new Error('Guardianship is already terminated');
    }

    const wardAge = this.calculateWardAge();

    // Age-based termination validation
    if (reason === 'WARD_REACHED_MAJORITY' && wardAge < GuardianshipAggregate.KENYAN_MAJORITY_AGE) {
      throw new Error('Ward has not reached majority (18 years)');
    }

    // Court order required for some terminations
    if (['GUARDIAN_MISCONDUCT', 'FAMILY_OBJECTION'].includes(reason) && !this.props.courtOrder) {
      throw new Error('Court order required for this termination reason');
    }
  }

  private calculateWardAge(atDate: Date = new Date()): number {
    const birthDate = new Date(this.props.wardDateOfBirth);
    let age = atDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = atDate.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && atDate.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private static isMinor(dateOfBirth: Date): boolean {
    const age = new GuardianshipAggregate(new UniqueEntityID(), {} as any).calculateWardAge();
    return age < GuardianshipAggregate.KENYAN_MAJORITY_AGE;
  }

  private calculateComplianceStatus(): string {
    if (this.props.complianceChecks.length === 0) return 'PENDING';

    const overdueChecks = this.props.complianceChecks.filter((cc) => cc.isOverdue);
    if (overdueChecks.length > 0) return 'OVERDUE';

    const submittedChecks = this.props.complianceChecks.filter(
      (cc) => cc.status === ComplianceStatus.ACCEPTED || cc.status === ComplianceStatus.SUBMITTED,
    );

    return submittedChecks.length === this.props.complianceChecks.length
      ? 'COMPLIANT'
      : 'IN_PROGRESS';
  }

  private determineReportingPeriod(date: Date): CompliancePeriod {
    // Simplified - could be based on schedule type
    return CompliancePeriod.ANNUAL;
  }

  private getReportingPeriodName(date: Date): string {
    return `Year Ending ${date.getFullYear()}`;
  }

  private generateDefaultWelfareSections(): any[] {
    return [
      {
        id: 'ward-status',
        title: 'Ward Status & Wellbeing',
        type: 'TEXT',
        content: '',
        isRequired: true,
        isComplete: false,
        validationRules: [
          {
            field: 'generalHealth',
            rule: 'REQUIRED',
            errorMessage: 'General health status is required',
          },
        ],
      },
      {
        id: 'education',
        title: 'Educational Progress',
        type: 'EDUCATION',
        content: '',
        isRequired: true,
        isComplete: false,
      },
      {
        id: 'health',
        title: 'Health & Medical Updates',
        type: 'HEALTH',
        content: '',
        isRequired: true,
        isComplete: false,
      },
      {
        id: 'guardian-notes',
        title: 'Guardian Notes & Concerns',
        type: 'TEXT',
        content: '',
        isRequired: false,
        isComplete: false,
      },
    ];
  }

  private generateInitialWardStatus(): WardStatusReport {
    return {
      generalHealth: 'GOOD',
      emotionalWellbeing: 'CONTENT',
      livingConditions: 'ADEQUATE',
      notableEvents: [],
    };
  }

  private createFinalComplianceReport(
    reason: GuardianshipTerminationReason,
    terminationDate: Date,
  ): void {
    const check = ComplianceCheckEntity.create({
      guardianshipId: this.id.toString(),
      year: terminationDate.getFullYear(),
      reportingPeriod: CompliancePeriod.SPECIAL,
      schedule: this.props.complianceSchedule,
      dueDate: terminationDate,
      submissionDeadline: terminationDate,
      reportTitle: `Final Report: Guardianship of ${this.props.wardFullName}`,
      reportType: ReportType.CLOSING_REPORT,
      autoGenerated: true,
      sections: [
        {
          id: 'final-summary',
          title: 'Guardianship Closing Summary',
          type: 'TEXT',
          content: `Guardianship terminated on ${terminationDate.toLocaleDateString()}. Reason: ${reason}`,
          isRequired: true,
          isComplete: true,
        },
      ],
      attachments: [],
      wardStatus: this.generateInitialWardStatus(),
    });

    this.props.complianceChecks.push(check);
  }

  private addHistoryEntry(
    eventType: string,
    description: string,
    actorType: 'SYSTEM' | 'COURT' | 'GUARDIAN' | 'FAMILY' | 'CUSTOMARY_COUNCIL',
    metadata?: Record<string, any>,
    actorId?: string,
  ): void {
    this.props.history.push({
      timestamp: new Date(),
      eventType,
      description,
      actorType,
      actorId,
      metadata,
    });
  }

  // ---------------------------------------------------------------------------
  // GETTERS & PUBLIC API
  // ---------------------------------------------------------------------------

  public getActiveGuardians(): GuardianAssignmentEntity[] {
    return this.props.guardianAssignments.filter(
      (ga) => ga.status === GuardianAssignmentStatus.ACTIVE,
    );
  }

  public getPrimaryGuardian(): GuardianAssignmentEntity | undefined {
    return this.props.guardianAssignments.find(
      (ga) => ga.isPrimary && ga.status === GuardianAssignmentStatus.ACTIVE,
    );
  }

  public getUpcomingDeadlines(): Array<{ type: string; date: Date; description: string }> {
    const deadlines: Array<{ type: string; date: Date; description: string }> = [];

    // Compliance deadline
    deadlines.push({
      type: 'COMPLIANCE_REPORT',
      date: this.props.nextComplianceDue,
      description: `Next welfare report due for ${this.props.wardFullName}`,
    });

    // Age-based deadlines
    const wardAge = this.calculateWardAge();
    if (this.props.wardIsMinor) {
      const majorityDate = new Date(this.props.wardDateOfBirth);
      majorityDate.setFullYear(
        majorityDate.getFullYear() + GuardianshipAggregate.KENYAN_MAJORITY_AGE,
      );

      if (majorityDate > new Date()) {
        deadlines.push({
          type: 'MAJORITY_REACHED',
          date: majorityDate,
          description: `${this.props.wardFullName} reaches majority (18 years)`,
        });
      }
    }

    return deadlines;
  }

  // ---------------------------------------------------------------------------
  // OVERRIDES
  // ---------------------------------------------------------------------------

  public validate(): void {
    // Ensure ward is a minor for active guardianship
    if (this.props.status === GuardianshipStatus.ACTIVE && !this.props.wardIsMinor) {
      throw new Error('Cannot have active guardianship for adult ward');
    }

    // Ensure at least one active guardian for active guardianship
    if (this.props.status === GuardianshipStatus.ACTIVE) {
      const activeGuardians = this.getActiveGuardians();
      if (activeGuardians.length === 0) {
        throw new Error('Active guardianship must have at least one active guardian');
      }
    }

    // Validate emergency guardianship duration
    if (this.props.isEmergency && this.props.effectiveDate) {
      const emergencyDuration = new Date().getTime() - this.props.effectiveDate.getTime();
      const maxEmergencyMs =
        GuardianshipAggregate.EMERGENCY_GUARDIANSHIP_MAX_DAYS * 24 * 60 * 60 * 1000;

      if (emergencyDuration > maxEmergencyMs) {
        throw new Error(
          `Emergency guardianship exceeds ${GuardianshipAggregate.EMERGENCY_GUARDIANSHIP_MAX_DAYS} day limit`,
        );
      }
    }
  }

  protected applyEvent(event: DomainEvent): void {
    // Event sourcing implementation
    // (Implementation depends on your event sourcing setup)
  }

  public getVersion(): number {
    return this.props.version;
  }

  private incrementVersion(): void {
    this.props.version++;
  }
}

// -----------------------------------------------------------------------------
// SUPPORTING TYPES
// -----------------------------------------------------------------------------

type GuardianshipTerminationReason =
  | 'WARD_REACHED_MAJORITY' // Age 18
  | 'WARD_DECEASED' // Ward passed away
  | 'GUARDIAN_RESIGNATION' // Guardian voluntarily resigns
  | 'COURT_ORDER' // Court terminates
  | 'GUARDIAN_MISCONDUCT' // Guardian removed for cause
  | 'FAMILY_OBJECTION' // Family successfully objects
  | 'EMERGENCY_EXPIRED' // Emergency guardianship expired
  | 'MUTUAL_AGREEMENT' // Family and guardian agree
  | 'WARD_EMANCIPATION' // Ward legally emancipated
  | 'CUSTOMARY_RESOLUTION'; // Resolved through customary means
