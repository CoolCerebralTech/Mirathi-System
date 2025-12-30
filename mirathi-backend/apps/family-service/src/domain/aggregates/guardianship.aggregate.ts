// src/domain/aggregates/guardianship.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  ComplianceCheckEntity,
  CompliancePeriod,
  ComplianceStatus,
  ReportType,
} from '../entities/compliance-check.entity';
import {
  GuardianAssignmentEntity,
  GuardianAssignmentStatus,
} from '../entities/guardian-assignment.entity';
import {
  ComplianceCheckDueEvent,
  GuardianAppointedEvent,
  GuardianshipCreatedEvent,
  GuardianshipTerminatedEvent,
} from '../events/guardianship-events';
import { ComplianceScheduleVO } from '../value-objects/compliance-schedule.vo';
import { ReportFrequency } from '../value-objects/compliance-schedule.vo';
import { FamilyMemberReferenceVO } from '../value-objects/family-member-reference.vo';
import { GuardianshipPeriodVO } from '../value-objects/guardianship-period.vo';
import { GuardianshipTypeVO, LegalGuardianshipType } from '../value-objects/guardianship-type.vo';
import { KenyanCourtOrderVO } from '../value-objects/kenyan-court-order.vo';

// -----------------------------------------------------------------------------
// Enums & Interfaces (Stripped down to core)
// -----------------------------------------------------------------------------

export enum GuardianshipStatus {
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
  EMERGENCY = 'EMERGENCY',
}

export enum BondOverallStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  REQUIRED_PENDING = 'REQUIRED_PENDING',
  POSTED = 'POSTED',
  FORFEITED = 'FORFEITED',
}

export interface GuardianshipProps {
  // ============================================
  // CORE IDENTITY (Immutable facts)
  // ============================================
  wardReference: FamilyMemberReferenceVO;
  wardFullName: string;
  wardDateOfBirth: Date;

  // ============================================
  // LEGAL FRAMEWORK (Core business rules)
  // ============================================
  guardianshipType: GuardianshipTypeVO;
  period: GuardianshipPeriodVO;
  courtOrder?: KenyanCourtOrderVO;

  // ============================================
  // STATUS & LIFECYCLE (Core invariants)
  // ============================================
  status: GuardianshipStatus;
  establishedDate: Date;
  terminatedDate?: Date;
  terminationReason?: string;

  // ============================================
  // GUARDIAN MANAGEMENT (Core business rules)
  // ============================================
  guardianAssignments: GuardianAssignmentEntity[];

  // ============================================
  // COMPLIANCE OBLIGATIONS (Legal requirements)
  // ============================================
  complianceSchedule: ComplianceScheduleVO;
  complianceChecks: ComplianceCheckEntity[];

  // ============================================
  // FINANCIAL REQUIREMENTS (Legal mandates)
  // ============================================
  requiresPropertyManagement: boolean;
  bondStatus: BondOverallStatus;

  // ============================================
  // JURISDICTION (Legal context)
  // ============================================
  jurisdiction: 'STATUTORY' | 'ISLAMIC' | 'CUSTOMARY' | 'INTERNATIONAL';
  governingLaw: string;

  // ============================================
  // AUDIT TRAIL (Immutable history)
  // ============================================
  history: GuardianshipHistoryEntry[];

  // ============================================
  // METADATA (Optional context)
  // ============================================
  caseNumber?: string;
  legalNotes?: string;
  specialCircumstances?: string;
}

export interface GuardianshipHistoryEntry {
  timestamp: Date;
  eventType: string;
  description: string;
  actorType: 'SYSTEM' | 'COURT' | 'GUARDIAN' | 'FAMILY';
  metadata?: Record<string, any>;
}

// -----------------------------------------------------------------------------
// AGGREGATE ROOT - GUARDIANSHIP (Lean & Focused)
// -----------------------------------------------------------------------------

export class GuardianshipAggregate extends AggregateRoot<GuardianshipProps> {
  private constructor(id: UniqueEntityID, props: GuardianshipProps) {
    super(id, props);
  }

  // ---------------------------------------------------------------------------
  // 🏭 FACTORY METHODS
  // ---------------------------------------------------------------------------

  public static create(params: {
    wardReference: FamilyMemberReferenceVO;
    guardianshipType: LegalGuardianshipType;
    courtOrder?: KenyanCourtOrderVO;
    requiresPropertyManagement?: boolean;
    jurisdiction?: 'STATUTORY' | 'ISLAMIC' | 'CUSTOMARY' | 'INTERNATIONAL';
    governingLaw?: string;
    caseNumber?: string;
    legalNotes?: string;
  }): GuardianshipAggregate {
    // Children Act Section 23: Validate ward is minor
    if (!params.wardReference.isMinor) {
      throw new Error('Guardianship can only be created for minors under 18 years');
    }

    // Create value objects
    const guardianshipType = GuardianshipTypeVO.create(params.guardianshipType);
    const period = GuardianshipPeriodVO.create({
      startDate: new Date(),
      wardDateOfBirth: params.wardReference.dateOfBirth,
    });

    const complianceSchedule = ComplianceScheduleVO.create({
      frequency: ReportFrequency.ANNUAL,
      startDate: new Date(),
      courtMandated: !!params.courtOrder,
      reminderDaysBefore: [30, 14, 7],
      preferredNotificationChannel: 'EMAIL',
      autoGenerateReport: false,
    });

    const props: GuardianshipProps = {
      wardReference: params.wardReference,
      wardFullName: params.wardReference.fullName.getFullName(),
      wardDateOfBirth: params.wardReference.dateOfBirth,

      guardianshipType,
      period,
      courtOrder: params.courtOrder,

      status: GuardianshipStatus.PENDING_ACTIVATION,
      establishedDate: new Date(),

      guardianAssignments: [],
      complianceSchedule,
      complianceChecks: [],

      requiresPropertyManagement: params.requiresPropertyManagement || false,
      bondStatus: params.requiresPropertyManagement
        ? BondOverallStatus.REQUIRED_PENDING
        : BondOverallStatus.NOT_REQUIRED,

      jurisdiction: params.jurisdiction || 'STATUTORY',
      governingLaw: params.governingLaw || 'Children Act Cap 141',

      history: [],
      caseNumber: params.caseNumber,
      legalNotes: params.legalNotes,
    };

    const aggregate = new GuardianshipAggregate(new UniqueEntityID(), props);
    aggregate.validate();

    aggregate.addHistoryEntry('CREATED', 'Guardianship created', 'SYSTEM', {
      guardianshipType: params.guardianshipType,
      caseNumber: params.caseNumber,
    });

    aggregate.addDomainEvent(
      new GuardianshipCreatedEvent(aggregate.id.toString(), aggregate.getVersion(), {
        wardId: params.wardReference.memberId,
        guardianshipType: params.guardianshipType,
      }),
    );

    return aggregate;
  }

  // ---------------------------------------------------------------------------
  // 👨‍⚖️ CORE BUSINESS METHODS (Invariant Protection Only)
  // ---------------------------------------------------------------------------

  public appointGuardian(assignment: GuardianAssignmentEntity): void {
    this.ensureActiveOrPending();

    // INVARIANT: Only one primary guardian
    if (assignment.props.isPrimary) {
      const existingPrimary = this.props.guardianAssignments.find(
        (ga) => ga.props.isPrimary && ga.isActive(),
      );

      if (existingPrimary) {
        throw new Error('Cannot appoint multiple primary guardians');
      }
    }

    // INVARIANT: Guardian not already appointed
    const existingAppointment = this.props.guardianAssignments.find(
      (ga) => ga.props.guardianId === assignment.props.guardianId && ga.isActive(),
    );

    if (existingAppointment) {
      throw new Error('Guardian already appointed to this ward');
    }

    this.mutableProps.guardianAssignments.push(assignment);

    this.addHistoryEntry(
      'GUARDIAN_APPOINTED',
      `Appointed ${assignment.props.isPrimary ? 'Primary' : 'Alternate'} Guardian: ${assignment.props.guardianName}`,
      'SYSTEM',
      {
        guardianId: assignment.props.guardianId,
        role: assignment.props.role,
        isPrimary: assignment.props.isPrimary,
      },
    );

    this.addDomainEvent(
      new GuardianAppointedEvent(this.id.toString(), this.getVersion(), {
        guardianshipId: this.id.toString(),
        guardianId: assignment.props.guardianId,
        isPrimary: assignment.props.isPrimary,
      }),
    );

    this.incrementVersion();
  }

  public activateGuardianship(): void {
    if (this.props.status !== GuardianshipStatus.PENDING_ACTIVATION) {
      throw new Error('Guardianship must be in PENDING_ACTIVATION state');
    }

    // INVARIANT: Must have at least one primary guardian
    const primaryGuardian = this.props.guardianAssignments.find((ga) => ga.props.isPrimary);

    if (!primaryGuardian) {
      throw new Error('Cannot activate guardianship without a primary guardian');
    }

    this.mutableProps.status = GuardianshipStatus.ACTIVE;

    // Activate all pending guardian assignments
    this.props.guardianAssignments.forEach((assignment) => {
      if (assignment.props.status === GuardianAssignmentStatus.PENDING) {
        assignment.activate();
      }
    });

    // Schedule first compliance check
    this.scheduleComplianceCheck();

    this.addHistoryEntry('ACTIVATED', 'Guardianship activated', 'SYSTEM');

    this.incrementVersion();
  }

  public terminateGuardianship(reason: string, terminationDate: Date = new Date()): void {
    this.ensureActive();

    if (!reason || reason.trim().length < 10) {
      throw new Error('Termination reason must be detailed (minimum 10 characters)');
    }

    this.mutableProps.status = GuardianshipStatus.TERMINATED;
    this.mutableProps.terminatedDate = terminationDate;
    this.mutableProps.terminationReason = reason;

    // Terminate all active guardian assignments
    this.props.guardianAssignments.forEach((assignment) => {
      if (assignment.isActive()) {
        assignment.terminate(`Guardianship terminated: ${reason}`);
      }
    });

    this.createClosingComplianceReport(reason);

    this.addHistoryEntry('TERMINATED', `Guardianship terminated: ${reason}`, 'SYSTEM', {
      terminationDate,
      reason,
    });

    this.addDomainEvent(
      new GuardianshipTerminatedEvent(this.id.toString(), this.getVersion(), {
        guardianshipId: this.id.toString(),
        reason,
        terminationDate,
      }),
    );

    this.incrementVersion();
  }

  // ---------------------------------------------------------------------------
  // 📋 COMPLIANCE MANAGEMENT (Legal obligations only)
  // ---------------------------------------------------------------------------

  private scheduleComplianceCheck(): void {
    const lastCheck = this.getLastComplianceCheck();
    const nextDue = this.props.complianceSchedule.getNextDueDate(lastCheck?.props.dueDate);

    const complianceCheck = ComplianceCheckEntity.create({
      guardianshipId: this.id.toString(),
      year: nextDue.getFullYear(),
      reportingPeriod: this.determineReportingPeriod(nextDue),
      schedule: this.props.complianceSchedule,
      dueDate: nextDue,
      submissionDeadline: new Date(nextDue.getTime() + 30 * 24 * 60 * 60 * 1000),
      reportTitle: `${this.props.wardFullName} - ${this.getReportingPeriodName(nextDue)} Report`,
      reportType: ReportType.ANNUAL_WELFARE,
      autoGenerated: false,
      sections: this.generateDefaultSections(),
      attachments: [],
      wardStatus: {
        generalHealth: 'GOOD' as const,
        emotionalWellbeing: 'CONTENT' as const,
        livingConditions: 'ADEQUATE' as const,
        notableEvents: [],
      },
    });

    this.mutableProps.complianceChecks.push(complianceCheck);

    this.addDomainEvent(
      new ComplianceCheckDueEvent(this.id.toString(), this.getVersion(), {
        guardianshipId: this.id.toString(),
        dueDate: nextDue,
      }),
    );

    this.addHistoryEntry(
      'COMPLIANCE_SCHEDULED',
      `Next compliance check scheduled for ${nextDue.toLocaleDateString()}`,
      'SYSTEM',
    );

    this.incrementVersion();
  }

  public submitComplianceCheck(
    complianceCheckId: string,
    params: {
      method: 'E_FILING' | 'EMAIL' | 'PHYSICAL' | 'COURT_PORTAL' | 'LAWYER';
      details?: string;
      confirmationNumber?: string;
      submittedBy?: string;
    },
  ): void {
    const check = this.props.complianceChecks.find((cc) => cc.id.toString() === complianceCheckId);

    if (!check) {
      throw new Error('Compliance check not found');
    }

    check.submit(
      params.method,
      params.details || `Submitted by ${params.submittedBy || 'unknown'}`,
      params.confirmationNumber,
    );

    this.addHistoryEntry(
      'COMPLIANCE_SUBMITTED',
      `Compliance check submitted for ${check.props.year} ${check.props.reportingPeriod}`,
      params.submittedBy ? 'GUARDIAN' : 'SYSTEM',
      {
        checkId: complianceCheckId,
        method: params.method,
        confirmationNumber: params.confirmationNumber,
        submittedBy: params.submittedBy,
      },
    );

    this.incrementVersion();
  }

  // ---------------------------------------------------------------------------
  // 🔒 VALIDATION & HELPER METHODS
  // ---------------------------------------------------------------------------

  private ensureActive(): void {
    if (this.props.status !== GuardianshipStatus.ACTIVE) {
      throw new Error('Guardianship is not active');
    }
  }

  private ensureActiveOrPending(): void {
    if (
      this.props.status !== GuardianshipStatus.ACTIVE &&
      this.props.status !== GuardianshipStatus.PENDING_ACTIVATION
    ) {
      throw new Error('Guardianship is not in an active or pending state');
    }
  }

  private getLastComplianceCheck(): ComplianceCheckEntity | undefined {
    if (this.props.complianceChecks.length === 0) return undefined;

    return [...this.props.complianceChecks].sort(
      (a, b) => b.props.dueDate.getTime() - a.props.dueDate.getTime(),
    )[0];
  }

  private determineReportingPeriod(_date: Date): CompliancePeriod {
    // Simplified - could be based on schedule
    return CompliancePeriod.ANNUAL;
  }

  private getReportingPeriodName(date: Date): string {
    return `Year Ending ${date.getFullYear()}`;
  }

  private generateDefaultSections(): any[] {
    return [
      {
        id: 'ward-status',
        title: 'Ward Status Report',
        type: 'TEXT',
        content: '',
        isRequired: true,
        isComplete: false,
      },
    ];
  }

  private createClosingComplianceReport(reason: string): void {
    const check = ComplianceCheckEntity.create({
      guardianshipId: this.id.toString(),
      year: new Date().getFullYear(),
      reportingPeriod: CompliancePeriod.SPECIAL,
      schedule: this.props.complianceSchedule,
      dueDate: new Date(),
      submissionDeadline: new Date(),
      reportTitle: `Closing Report: ${this.props.wardFullName} Guardianship`,
      reportType: ReportType.CLOSING_REPORT,
      autoGenerated: true,
      sections: [
        {
          id: 'closing-summary',
          title: 'Guardianship Closing Summary',
          type: 'TEXT',
          content: `Guardianship terminated on ${new Date().toLocaleDateString()}. Reason: ${reason}`,
          isRequired: true,
          isComplete: true,
        },
      ],
      attachments: [],
      wardStatus: {
        generalHealth: 'GOOD' as const,
        emotionalWellbeing: 'CONTENT' as const,
        livingConditions: 'ADEQUATE' as const,
        notableEvents: [],
      },
    });

    this.mutableProps.complianceChecks.push(check);
  }

  private addHistoryEntry(
    eventType: string,
    description: string,
    actorType: 'SYSTEM' | 'COURT' | 'GUARDIAN' | 'FAMILY',
    metadata?: Record<string, any>,
  ): void {
    this.mutableProps.history.push({
      timestamp: new Date(),
      eventType,
      description,
      actorType,
      metadata,
    });
  }

  // ---------------------------------------------------------------------------
  // 🧪 PUBLIC QUERIES (Read-only, no side effects)
  // ---------------------------------------------------------------------------

  public getActiveGuardians(): GuardianAssignmentEntity[] {
    return this.props.guardianAssignments.filter((ga) => ga.isActive());
  }

  public getPrimaryGuardian(): GuardianAssignmentEntity | undefined {
    return this.props.guardianAssignments.find((ga) => ga.props.isPrimary && ga.isActive());
  }

  public getNextComplianceDue(): Date | undefined {
    return this.props.complianceChecks
      .filter((cc) => cc.props.status === ComplianceStatus.DRAFT)
      .sort((a, b) => a.props.dueDate.getTime() - b.props.dueDate.getTime())[0]?.props.dueDate;
  }

  public getComplianceSummary(): {
    totalChecks: number;
    submittedChecks: number;
    overdueChecks: number;
    nextDueDate?: Date;
  } {
    const now = new Date();

    return {
      totalChecks: this.props.complianceChecks.length,
      submittedChecks: this.props.complianceChecks.filter(
        (cc) =>
          cc.props.status === ComplianceStatus.ACCEPTED ||
          cc.props.status === ComplianceStatus.SUBMITTED,
      ).length,
      overdueChecks: this.props.complianceChecks.filter(
        (cc) => cc.props.dueDate < now && cc.props.status !== ComplianceStatus.ACCEPTED,
      ).length,
      nextDueDate: this.getNextComplianceDue(),
    };
  }

  // ---------------------------------------------------------------------------
  // 🔧 BASE CLASS IMPLEMENTATION
  // ---------------------------------------------------------------------------

  public validate(): void {
    // Children Act Section 23: Guardianship only for minors
    const wardAge = this.calculateAge(this.props.wardDateOfBirth);
    if (wardAge >= 18 && this.props.status === GuardianshipStatus.ACTIVE) {
      throw new Error('Cannot have active guardianship for adult (18+) ward');
    }

    // Must have guardian assignments if active
    if (
      this.props.status === GuardianshipStatus.ACTIVE &&
      this.props.guardianAssignments.length === 0
    ) {
      throw new Error('Active guardianship must have at least one guardian');
    }

    // Bond required if managing property
    if (
      this.props.requiresPropertyManagement &&
      this.props.bondStatus === BondOverallStatus.NOT_REQUIRED
    ) {
      throw new Error('Property management requires bond');
    }
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  protected applyEvent(_event: DomainEvent): void {
    // Event sourcing implementation
  }

  public incrementVersion(): void {
    (this as any)._version = ((this as any)._version || 0) + 1;
  }

  public getVersion(): number {
    return (this as any)._version || 1;
  }

  private get mutableProps(): GuardianshipProps {
    return this.props as unknown as GuardianshipProps;
  }
}

// -----------------------------------------------------------------------------
// 🎯 DOMAIN SERVICES (Moved out of aggregate)
// -----------------------------------------------------------------------------

/**
 * Risk Assessment Service - COMPUTES derived risk, doesn't store
 */
export class GuardianshipRiskService {
  static assessRisk(guardianship: GuardianshipAggregate): {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    recommendations: string[];
  } {
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Check bond status
    if (
      guardianship.props.requiresPropertyManagement &&
      guardianship.props.bondStatus !== BondOverallStatus.POSTED
    ) {
      factors.push('Property bond not posted');
      recommendations.push('Post bond immediately to avoid legal penalties');
    }

    // Check compliance
    const compliance = guardianship.getComplianceSummary();
    if (compliance.overdueChecks > 0) {
      factors.push(`${compliance.overdueChecks} overdue compliance reports`);
      recommendations.push('Submit overdue reports to avoid court action');
    }

    // Check guardian count
    const activeGuardians = guardianship.getActiveGuardians();
    if (activeGuardians.length === 0) {
      factors.push('No active guardians');
      recommendations.push('Appoint at least one guardian');
    }

    // Determine level
    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (factors.some((f) => f.includes('bond not posted'))) level = 'CRITICAL';
    else if (compliance.overdueChecks > 1) level = 'HIGH';
    else if (activeGuardians.length === 0) level = 'HIGH';
    else if (factors.length > 0) level = 'MEDIUM';

    return { level, factors, recommendations };
  }
}

/**
 * Compliance Health Service - COMPUTES derived compliance status
 */
export class ComplianceHealthService {
  static assessComplianceHealth(guardianship: GuardianshipAggregate): {
    status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
    score: number; // 0-100
    issues: string[];
  } {
    const compliance = guardianship.getComplianceSummary();
    let score = 100;
    const issues: string[] = [];

    // Penalty for overdue checks
    if (compliance.overdueChecks > 0) {
      score -= compliance.overdueChecks * 30;
      issues.push(`${compliance.overdueChecks} overdue compliance reports`);
    }

    // Penalty for no submitted checks
    if (compliance.submittedChecks === 0 && compliance.totalChecks > 0) {
      score -= 50;
      issues.push('No compliance reports submitted');
    }

    // Determine status
    let status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' = 'EXCELLENT';
    if (score >= 90) status = 'EXCELLENT';
    else if (score >= 75) status = 'GOOD';
    else if (score >= 60) status = 'FAIR';
    else if (score >= 40) status = 'POOR';
    else status = 'CRITICAL';

    return { status, score, issues };
  }
}

/**
 * Guardianship Dashboard Service - READ MODEL builder
 */
export class GuardianshipDashboardService {
  static buildDashboard(guardianship: GuardianshipAggregate): {
    summary: Record<string, any>;
    guardians: Array<Record<string, any>>;
    compliance: Record<string, any>;
    timeline: Array<Record<string, any>>;
  } {
    const risk = GuardianshipRiskService.assessRisk(guardianship);
    const compliance = ComplianceHealthService.assessComplianceHealth(guardianship);
    const complianceSummary = guardianship.getComplianceSummary();

    return {
      summary: {
        wardName: guardianship.props.wardFullName,
        status: guardianship.props.status,
        establishedDate: guardianship.props.establishedDate,
        riskLevel: risk.level,
        complianceStatus: compliance.status,
      },
      guardians: guardianship.getActiveGuardians().map((ga) => ({
        name: ga.props.guardianName,
        role: ga.props.role,
        isPrimary: ga.props.isPrimary,
      })),
      compliance: {
        nextDueDate: complianceSummary.nextDueDate,
        overdueChecks: complianceSummary.overdueChecks,
        submittedChecks: complianceSummary.submittedChecks,
        healthScore: compliance.score,
        issues: compliance.issues,
      },
      timeline: guardianship.props.history.slice(-10).map((event) => ({
        date: event.timestamp,
        event: event.eventType,
        description: event.description,
      })),
    };
  }
}
