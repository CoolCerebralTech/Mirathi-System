// src/domain/aggregates/guardianship.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import { ComplianceCheckEntity } from '../entities/compliance-check.entity';
import { GuardianAssignmentEntity } from '../entities/guardian-assignment.entity';
import { ComplianceScheduleVO } from '../value-objects/compliance-schedule.vo';
import { GuardianshipPeriodVO } from '../value-objects/guardianship-period.vo';
import { GuardianshipTypeVO } from '../value-objects/guardianship-type.vo';
import { KenyanCourtOrderVO } from '../value-objects/kenyan-court-order.vo';

export interface GuardianshipProps {
  // Core Identity
  wardId: string; // FamilyMember ID of the ward
  wardName: string; // Denormalized for performance
  wardDateOfBirth: Date;

  // Legal Framework
  guardianshipType: GuardianshipTypeVO;
  period: GuardianshipPeriodVO;
  courtOrder?: KenyanCourtOrderVO;

  // Status Management
  status: GuardianshipStatus;
  establishedDate: Date;
  terminatedDate?: Date;
  terminationReason?: string;

  // 🎯 INNOVATIVE: Smart Guardianship Hierarchy
  isEmergency: boolean;
  isTemporary: boolean;
  priorityLevel: 'NORMAL' | 'HIGH' | 'CRITICAL';

  // 🎯 INNOVATIVE: Multi-jurisdiction Support
  jurisdiction: 'STATUTORY' | 'ISLAMIC' | 'CUSTOMARY' | 'INTERNATIONAL';
  governingLaw: string; // e.g., "Children Act, Law of Succession Act"

  // Compliance Framework
  complianceSchedule: ComplianceScheduleVO;
  complianceStatus: ComplianceHealthStatus;
  nextComplianceDue: Date;

  // 🎯 INNOVATIVE: Risk Assessment
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: RiskFactor[];
  riskMitigationPlan?: string;

  // Financial Management
  requiresPropertyManagement: boolean;
  totalEstateValue?: number;
  bondStatus: BondOverallStatus;

  // Child Entities (Aggregate Members)
  guardianAssignments: GuardianAssignmentEntity[];
  complianceChecks: ComplianceCheckEntity[];

  // 🎯 INNOVATIVE: Communication & Collaboration
  familyNotificationList: string[]; // FamilyMember IDs to notify
  externalContacts: ExternalContact[];
  collaborationSettings: CollaborationSettings;

  // Metadata
  caseNumber?: string;
  legalNotes?: string;
  specialCircumstances?: string;

  // Audit & History
  history: GuardianshipHistoryEvent[];
  lastRiskAssessmentDate?: Date;
  lastComplianceReviewDate?: Date;
}

export enum GuardianshipStatus {
  PENDING_ACTIVATION = 'PENDING_ACTIVATION', // Created but not yet active
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED', // Temporarily inactive
  TERMINATED = 'TERMINATED', // Ended normally
  REVOKED = 'REVOKED', // Removed by court
  EXPIRED = 'EXPIRED', // Ward reached majority
  EMERGENCY = 'EMERGENCY', // Emergency guardianship
  UNDER_REVIEW = 'UNDER_REVIEW', // Court review ongoing
  APPEALED = 'APPEALED', // Under appeal
}

export enum ComplianceHealthStatus {
  EXCELLENT = 'EXCELLENT', // All compliance met, high scores
  GOOD = 'GOOD', // Minor issues, on track
  FAIR = 'FAIR', // Some overdue items
  POOR = 'POOR', // Multiple compliance failures
  CRITICAL = 'CRITICAL', // Legal action imminent
}

export interface RiskFactor {
  category: 'FAMILY_CONFLICT' | 'FINANCIAL' | 'LEGAL' | 'HEALTH' | 'COMPLIANCE';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigation: string;
  detectedAt: Date;
  resolvedAt?: Date;
}

export enum BondOverallStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  REQUIRED_PENDING = 'REQUIRED_PENDING',
  POSTED = 'POSTED',
  FORFEITED = 'FORFEITED',
  RELEASED = 'RELEASED',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

export interface ExternalContact {
  type: 'LAWYER' | 'DOCTOR' | 'SCHOOL' | 'COURT_OFFICIAL' | 'SOCIAL_WORKER';
  name: string;
  contact: string;
  relationship: string;
  canBeContacted: boolean;
}

export interface CollaborationSettings {
  familyPortalAccess: boolean;
  documentSharing: boolean;
  realTimeUpdates: boolean;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface GuardianshipHistoryEvent {
  timestamp: Date;
  eventType: string;
  description: string;
  actor?: string;
  metadata?: Record<string, any>;
}

// 🎯 INNOVATIVE: Custom Domain Events for Guardianship
export class GuardianshipCreatedEvent extends DomainEvent<{
  wardId: string;
  guardianshipType: string;
  establishedDate: Date;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class GuardianAppointedEvent extends DomainEvent<{
  guardianId: string;
  role: string;
  isPrimary: boolean;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class GuardianshipTerminatedEvent extends DomainEvent<{
  reason: string;
  terminatedDate: Date;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class ComplianceCheckDueEvent extends DomainEvent<{
  dueDate: Date;
  checkType: string;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class RiskFlagRaisedEvent extends DomainEvent<{
  riskLevel: string;
  factor: string;
}> {
  constructor(aggregateId: string, version: number, payload: any) {
    super(aggregateId, 'Guardianship', version, payload);
  }
}

export class GuardianshipAggregate extends AggregateRoot<GuardianshipProps> {
  private constructor(id: UniqueEntityID, props: GuardianshipProps) {
    super(id, props);
    this.validate();
  }

  // 🎯 INNOVATIVE: Factory method with comprehensive validation
  public static create(
    props: Omit<
      GuardianshipProps,
      | 'status'
      | 'complianceStatus'
      | 'bondStatus'
      | 'riskLevel'
      | 'guardianAssignments'
      | 'complianceChecks'
      | 'history'
      | 'nextComplianceDue'
      | 'riskFactors'
      | 'familyNotificationList'
      | 'externalContacts'
      | 'collaborationSettings'
    > & {
      id?: string;
    },
  ): GuardianshipAggregate {
    const defaultProps: Partial<GuardianshipProps> = {
      status: GuardianshipStatus.PENDING_ACTIVATION,
      complianceStatus: ComplianceHealthStatus.GOOD,
      bondStatus: props.requiresPropertyManagement
        ? BondOverallStatus.REQUIRED_PENDING
        : BondOverallStatus.NOT_REQUIRED,
      riskLevel: 'LOW',
      guardianAssignments: [],
      complianceChecks: [],
      history: [],
      nextComplianceDue: props.complianceSchedule.getNextDueDate(),
      riskFactors: [],
      familyNotificationList: [],
      externalContacts: [],
      collaborationSettings: {
        familyPortalAccess: true,
        documentSharing: true,
        realTimeUpdates: true,
        notificationPreferences: {
          email: true,
          sms: false,
          push: true,
        },
      },
    };

    const entityProps: GuardianshipProps = {
      ...props,
      ...defaultProps,
    } as GuardianshipProps;

    const aggregate = new GuardianshipAggregate(new UniqueEntityID(props.id), entityProps);

    // Record creation event
    aggregate.addHistoryEvent('CREATED', 'Guardianship created', undefined, {
      wardName: props.wardName,
      guardianshipType: props.guardianshipType.getValue().value,
    });

    // Emit domain event
    aggregate.addDomainEvent(
      new GuardianshipCreatedEvent(aggregate.id.toString(), aggregate.getVersion(), {
        wardId: props.wardId,
        guardianshipType: props.guardianshipType.getValue().value,
        establishedDate: props.establishedDate,
      }),
    );

    return aggregate;
  }

  // 🎯 INNOVATIVE: Core Business Methods

  /**
   * Appoint a guardian with comprehensive validation
   */
  public appointGuardian(assignment: GuardianAssignmentEntity): void {
    this.validateGuardianshipIsActive();

    // Validate no conflicting primary guardians
    if (assignment.isPrimary) {
      const existingPrimary = this.props.guardianAssignments.find(
        (ga) => ga.isPrimary && ga.status === 'ACTIVE',
      );

      if (existingPrimary) {
        throw new Error('Cannot appoint multiple primary guardians');
      }
    }

    // Validate guardian isn't already appointed
    const existingAssignment = this.props.guardianAssignments.find(
      (ga) =>
        ga.guardianId === assignment.guardianId &&
        (ga.status === 'ACTIVE' || ga.status === 'PENDING'),
    );

    if (existingAssignment) {
      throw new Error('Guardian already appointed to this ward');
    }

    // Check for conflicts of interest
    this.detectPotentialConflicts(assignment);

    // Add the assignment
    this.props.guardianAssignments.push(assignment);

    // Update risk level based on new appointment
    this.recalculateRiskLevel();

    // Record in history
    this.addHistoryEvent(
      'GUARDIAN_APPOINTED',
      `Appointed ${assignment.isPrimary ? 'Primary' : 'Alternate'} Guardian: ${assignment.props.guardianName}`,
      'SYSTEM',
    );

    // Emit domain event
    this.addDomainEvent(
      new GuardianAppointedEvent(this.id.toString(), this.getVersion(), {
        guardianId: assignment.guardianId,
        role: assignment.props.role,
        isPrimary: assignment.isPrimary,
      }),
    );

    this.incrementVersion();
  }

  /**
   * Activate the guardianship (starts the clock)
   */
  public activateGuardianship(activationDate: Date = new Date()): void {
    if (this.props.status !== GuardianshipStatus.PENDING_ACTIVATION) {
      throw new Error('Guardianship is not in pending activation state');
    }

    // Must have at least one guardian appointed
    if (this.props.guardianAssignments.length === 0) {
      throw new Error('Cannot activate guardianship without at least one guardian');
    }

    // Must have a primary guardian if required
    if (!this.props.guardianAssignments.some((ga) => ga.isPrimary)) {
      throw new Error('Cannot activate guardianship without a primary guardian');
    }

    // Check bond requirements
    if (
      this.props.requiresPropertyManagement &&
      this.props.bondStatus === BondOverallStatus.REQUIRED_PENDING
    ) {
      throw new Error('Cannot activate guardianship without required bond');
    }

    // Update status
    this.props.status = GuardianshipStatus.ACTIVE;
    this.props.establishedDate = activationDate;

    // Activate all guardian assignments
    this.props.guardianAssignments.forEach((assignment) => {
      if (assignment.status === 'PENDING') {
        assignment.activate(activationDate);
      }
    });

    // Schedule first compliance check
    this.scheduleNextComplianceCheck();

    // Record in history
    this.addHistoryEvent('ACTIVATED', 'Guardianship activated', 'SYSTEM', {
      activationDate,
      guardiansCount: this.props.guardianAssignments.length,
    });

    this.incrementVersion();
  }

  /**
   * Terminate the guardianship
   */
  public terminateGuardianship(
    reason: string,
    terminationDate: Date = new Date(),
    courtOrderReference?: string,
  ): void {
    this.validateGuardianshipIsActive();

    // Validate termination reason
    if (!reason || reason.trim().length < 10) {
      throw new Error('Termination reason must be detailed (minimum 10 characters)');
    }

    // Check if ward has reached majority
    if (this.props.period.isWardMinor()) {
      throw new Error('Cannot terminate guardianship while ward is still a minor');
    }

    // Update status
    this.props.status = GuardianshipStatus.TERMINATED;
    this.props.terminatedDate = terminationDate;
    this.props.terminationReason = reason;

    // Deactivate all guardian assignments
    this.props.guardianAssignments.forEach((assignment) => {
      if (assignment.status === 'ACTIVE') {
        assignment.deactivate(`Guardianship terminated: ${reason}`, terminationDate);
      }
    });

    // Create final compliance report
    this.createClosingComplianceReport(reason);

    // Record in history
    this.addHistoryEvent('TERMINATED', `Guardianship terminated: ${reason}`, 'SYSTEM', {
      terminationDate,
      courtOrderReference,
    });

    // Emit domain event
    this.addDomainEvent(
      new GuardianshipTerminatedEvent(this.id.toString(), this.getVersion(), {
        reason,
        terminatedDate: terminationDate,
      }),
    );

    this.incrementVersion();
  }

  /**
   * Suspend the guardianship (temporary)
   */
  public suspendGuardianship(
    reason: string,
    suspensionDate: Date = new Date(),
    expectedResumptionDate?: Date,
  ): void {
    this.validateGuardianshipIsActive();

    if (!reason) {
      throw new Error('Suspension reason is required');
    }

    this.props.status = GuardianshipStatus.SUSPENDED;

    // Suspend all guardian assignments
    this.props.guardianAssignments.forEach((assignment) => {
      if (assignment.status === 'ACTIVE') {
        assignment.suspend(reason);
      }
    });

    // Record in history
    this.addHistoryEvent('SUSPENDED', `Guardianship suspended: ${reason}`, 'SYSTEM', {
      suspensionDate,
      expectedResumptionDate,
    });

    this.incrementVersion();
  }

  /**
   * Resume suspended guardianship
   */
  public resumeGuardianship(resumptionDate: Date = new Date()): void {
    if (this.props.status !== GuardianshipStatus.SUSPENDED) {
      throw new Error('Guardianship is not suspended');
    }

    this.props.status = GuardianshipStatus.ACTIVE;

    // Reactivate all guardian assignments
    this.props.guardianAssignments.forEach((assignment) => {
      if (assignment.status === 'SUSPENDED') {
        assignment.reactivate();
      }
    });

    // Record in history
    this.addHistoryEvent('RESUMED', 'Guardianship resumed', 'SYSTEM', {
      resumptionDate,
    });

    this.incrementVersion();
  }

  // 🎯 INNOVATIVE: Compliance Management

  /**
   * Schedule the next compliance check
   */
  private scheduleNextComplianceCheck(): void {
    const lastCheck = this.getLastComplianceCheck();
    const nextDue = this.props.complianceSchedule.getNextDueDate(lastCheck?.props.submissionDate);

    this.props.nextComplianceDue = nextDue;

    // Create a pending compliance check
    const complianceCheck = ComplianceCheckEntity.create({
      guardianshipId: this.id.toString(),
      year: nextDue.getFullYear(),
      reportingPeriod: this.determineReportingPeriod(nextDue),
      schedule: this.props.complianceSchedule,
      dueDate: nextDue,
      submissionDeadline: new Date(nextDue.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after due
      reportTitle: `${this.props.wardName} - ${this.getReportingPeriodName(nextDue)} Report`,
      reportType: this.determineReportType(),
      autoGenerated: true,
      sections: this.generateDefaultSections(),
      attachments: [],
      wardStatus: {
        generalHealth: 'GOOD',
        emotionalWellbeing: 'CONTENT',
        livingConditions: 'ADEQUATE',
        notableEvents: [],
      },
    });

    this.props.complianceChecks.push(complianceCheck);

    // Emit domain event for reminder
    this.addDomainEvent(
      new ComplianceCheckDueEvent(this.id.toString(), this.getVersion(), {
        dueDate: nextDue,
        checkType: complianceCheck.props.reportType,
      }),
    );

    // Record in history
    this.addHistoryEvent(
      'COMPLIANCE_SCHEDULED',
      `Next compliance check scheduled for ${nextDue.toLocaleDateString()}`,
      'SYSTEM',
    );
  }

  private determineReportingPeriod(date: Date): any {
    const month = date.getMonth();
    if (month >= 0 && month <= 2) return 'Q1';
    if (month >= 3 && month <= 5) return 'Q2';
    if (month >= 6 && month <= 8) return 'Q3';
    return 'Q4';
  }

  private getReportingPeriodName(date: Date): string {
    const period = this.determineReportingPeriod(date);
    const year = date.getFullYear();
    return `${period} ${year}`;
  }

  private determineReportType(): any {
    if (this.props.requiresPropertyManagement) {
      return 'PROPERTY_MANAGEMENT';
    }
    return this.props.complianceSchedule.getValue().frequency === 'ANNUAL'
      ? 'ANNUAL_WELFARE'
      : 'QUARTERLY_FINANCIAL';
  }

  private generateDefaultSections(): any[] {
    const baseSections = [
      {
        id: 'ward-status',
        title: 'Ward Status Report',
        type: 'TEXT',
        content: '',
        isRequired: true,
        isComplete: false,
      },
      {
        id: 'guardian-update',
        title: 'Guardian Update',
        type: 'TEXT',
        content: '',
        isRequired: true,
        isComplete: false,
      },
    ];

    if (this.props.requiresPropertyManagement) {
      baseSections.push({
        id: 'financial-statement',
        title: 'Financial Statement',
        type: 'FINANCIAL',
        content: '',
        isRequired: true,
        isComplete: false,
      });
    }

    return baseSections;
  }

  /**
   * Submit a compliance check
   */
  public submitComplianceCheck(complianceCheckId: string, submissionMethod: any): void {
    const check = this.props.complianceChecks.find((cc) => cc.id.toString() === complianceCheckId);
    if (!check) {
      throw new Error('Compliance check not found');
    }

    check.submit(submissionMethod);

    // Update overall compliance status
    this.updateComplianceHealthStatus();

    // Schedule next check if applicable
    if (check.props.status === 'ACCEPTED') {
      this.scheduleNextComplianceCheck();
    }

    // Record in history
    this.addHistoryEvent(
      'COMPLIANCE_SUBMITTED',
      `Compliance check submitted for ${check.props.year} ${check.props.reportingPeriod}`,
      'SYSTEM',
      { checkId: complianceCheckId, qualityScore: check.props.qualityScore },
    );

    this.incrementVersion();
  }

  /**
   * Update overall compliance health status
   */
  private updateComplianceHealthStatus(): void {
    const checks = this.props.complianceChecks;

    if (checks.length === 0) {
      this.props.complianceStatus = ComplianceHealthStatus.GOOD;
      return;
    }

    const recentChecks = checks.slice(-3); // Last 3 checks
    const acceptedChecks = recentChecks.filter((cc) => cc.props.status === 'ACCEPTED');
    const overdueChecks = recentChecks.filter((cc) => cc.props.status === 'OVERDUE');

    let newStatus: ComplianceHealthStatus;

    if (overdueChecks.length > 0) {
      newStatus = ComplianceHealthStatus.CRITICAL;
    } else if (acceptedChecks.length === recentChecks.length) {
      const avgScore =
        acceptedChecks.reduce((sum, cc) => sum + cc.props.qualityScore, 0) / acceptedChecks.length;
      newStatus =
        avgScore >= 90
          ? ComplianceHealthStatus.EXCELLENT
          : avgScore >= 75
            ? ComplianceHealthStatus.GOOD
            : avgScore >= 60
              ? ComplianceHealthStatus.FAIR
              : ComplianceHealthStatus.POOR;
    } else {
      newStatus = ComplianceHealthStatus.POOR;
    }

    this.props.complianceStatus = newStatus;

    // Update risk level based on compliance
    if (
      newStatus === ComplianceHealthStatus.CRITICAL ||
      newStatus === ComplianceHealthStatus.POOR
    ) {
      this.addRiskFactor(
        'COMPLIANCE',
        `Poor compliance health: ${newStatus}`,
        newStatus === ComplianceHealthStatus.CRITICAL ? 'CRITICAL' : 'HIGH',
        'Improve compliance submissions',
      );
    }
  }

  // 🎯 INNOVATIVE: Risk Management

  /**
   * Add a risk factor
   */
  public addRiskFactor(
    category: RiskFactor['category'],
    description: string,
    severity: RiskFactor['severity'],
    mitigation: string,
  ): void {
    const riskFactor: RiskFactor = {
      category,
      description,
      severity,
      mitigation,
      detectedAt: new Date(),
    };

    this.props.riskFactors.push(riskFactor);

    // Recalculate overall risk level
    this.recalculateRiskLevel();

    // Emit domain event
    this.addDomainEvent(
      new RiskFlagRaisedEvent(this.id.toString(), this.getVersion(), {
        riskLevel: severity,
        factor: description,
      }),
    );

    // Record in history
    this.addHistoryEvent('RISK_ADDED', `Risk factor added: ${description}`, 'SYSTEM', {
      category,
      severity,
    });

    this.props.lastRiskAssessmentDate = new Date();
    this.incrementVersion();
  }

  /**
   * Recalculate overall risk level
   */
  private recalculateRiskLevel(): void {
    const activeFactors = this.props.riskFactors.filter((rf) => !rf.resolvedAt);

    if (activeFactors.length === 0) {
      this.props.riskLevel = 'LOW';
      return;
    }

    const severityWeights = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    const totalWeight = activeFactors.reduce(
      (sum, factor) => sum + severityWeights[factor.severity],
      0,
    );

    const averageWeight = totalWeight / activeFactors.length;

    if (averageWeight >= 3.5) {
      this.props.riskLevel = 'CRITICAL';
    } else if (averageWeight >= 2.5) {
      this.props.riskLevel = 'HIGH';
    } else if (averageWeight >= 1.5) {
      this.props.riskLevel = 'MEDIUM';
    } else {
      this.props.riskLevel = 'LOW';
    }

    // Update compliance status if risk is high
    if (this.props.riskLevel === 'CRITICAL' || this.props.riskLevel === 'HIGH') {
      this.props.complianceStatus = Math.max(
        this.props.complianceStatus,
        ComplianceHealthStatus.POOR,
      );
    }
  }

  /**
   * Resolve a risk factor
   */
  public resolveRiskFactor(index: number, resolutionNotes: string): void {
    if (index < 0 || index >= this.props.riskFactors.length) {
      throw new Error('Invalid risk factor index');
    }

    const riskFactor = this.props.riskFactors[index];
    if (riskFactor.resolvedAt) {
      throw new Error('Risk factor already resolved');
    }

    riskFactor.resolvedAt = new Date();

    // Recalculate risk level
    this.recalculateRiskLevel();

    // Record in history
    this.addHistoryEvent(
      'RISK_RESOLVED',
      `Risk factor resolved: ${riskFactor.description}`,
      'SYSTEM',
      { index, resolutionNotes },
    );

    this.incrementVersion();
  }

  // 🎯 INNOVATIVE: Bond Management

  /**
   * Post a bond for property management
   */
  public postBond(
    amount: number,
    suretyCompany: string,
    bondReference: string,
    digitalVerificationUrl?: string,
  ): void {
    if (!this.props.requiresPropertyManagement) {
      throw new Error('Bond not required for this guardianship');
    }

    // Update bond status
    this.props.bondStatus = BondOverallStatus.POSTED;

    // Update all guardian assignments that require bonds
    this.props.guardianAssignments.forEach((assignment) => {
      if (assignment.powers.requiresPropertyBond()) {
        // This would update the individual bond VO in the assignment
        // Simplified for this example
      }
    });

    // Record in history
    this.addHistoryEvent(
      'BOND_POSTED',
      `Bond posted: ${suretyCompany} - KES ${amount.toLocaleString()}`,
      'SYSTEM',
      { amount, suretyCompany, bondReference },
    );

    this.incrementVersion();
  }

  // 🎯 INNOVATIVE: Emergency Procedures

  /**
   * Activate emergency guardianship mode
   */
  public activateEmergencyMode(reason: string, emergencyContactChain: string[]): void {
    this.props.status = GuardianshipStatus.EMERGENCY;
    this.props.isEmergency = true;
    this.props.priorityLevel = 'CRITICAL';

    // Notify all emergency contacts
    emergencyContactChain.forEach((contact) => {
      this.notifyExternalContact(contact, 'EMERGENCY_ACTIVATION', {
        reason,
        activationTime: new Date(),
      });
    });

    // Record in history
    this.addHistoryEvent('EMERGENCY_ACTIVATED', `Emergency mode activated: ${reason}`, 'SYSTEM', {
      reason,
      contactsNotified: emergencyContactChain.length,
    });

    this.incrementVersion();
  }

  /**
   * Deactivate emergency mode
   */
  public deactivateEmergencyMode(): void {
    if (!this.props.isEmergency) {
      throw new Error('Emergency mode not active');
    }

    this.props.status = GuardianshipStatus.ACTIVE;
    this.props.isEmergency = false;
    this.props.priorityLevel = 'NORMAL';

    // Record in history
    this.addHistoryEvent('EMERGENCY_DEACTIVATED', 'Emergency mode deactivated', 'SYSTEM');

    this.incrementVersion();
  }

  // 🎯 INNOVATIVE: Reporting & Analytics

  /**
   * Generate comprehensive guardianship report
   */
  public generateComprehensiveReport(): {
    summary: Record<string, any>;
    guardians: Array<Record<string, any>>;
    compliance: Record<string, any>;
    risks: RiskFactor[];
    recommendations: string[];
    timeline: Array<Record<string, any>>;
  } {
    const activeGuardians = this.props.guardianAssignments
      .filter((ga) => ga.status === 'ACTIVE')
      .map((ga) => ga.generateReport());

    const recentCompliance = this.props.complianceChecks.slice(-3).map((cc) => ({
      period: `${cc.props.year} ${cc.props.reportingPeriod}`,
      status: cc.props.status,
      qualityScore: cc.props.qualityScore,
    }));

    const activeRisks = this.props.riskFactors.filter((rf) => !rf.resolvedAt);

    return {
      summary: {
        wardName: this.props.wardName,
        guardianshipType: this.props.guardianshipType.getValue().value,
        status: this.props.status,
        establishedDate: this.props.establishedDate,
        daysActive: this.calculateDaysActive(),
        riskLevel: this.props.riskLevel,
        complianceStatus: this.props.complianceStatus,
        bondStatus: this.props.bondStatus,
      },
      guardians: activeGuardians,
      compliance: {
        overallStatus: this.props.complianceStatus,
        nextDue: this.props.nextComplianceDue,
        recentChecks: recentCompliance,
      },
      risks: activeRisks,
      recommendations: this.generateRecommendations(),
      timeline: this.generateTimelineReport(),
    };
  }

  private calculateDaysActive(): number {
    const startDate = this.props.establishedDate;
    const endDate =
      this.props.status === GuardianshipStatus.TERMINATED ? this.props.terminatedDate : new Date();

    if (!endDate) return 0;

    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Compliance recommendations
    if (
      this.props.complianceStatus === ComplianceHealthStatus.POOR ||
      this.props.complianceStatus === ComplianceHealthStatus.CRITICAL
    ) {
      recommendations.push(
        'Improve compliance submissions - consider setting up automated reminders',
      );
    }

    // Risk recommendations
    if (this.props.riskLevel === 'HIGH' || this.props.riskLevel === 'CRITICAL') {
      recommendations.push('Address outstanding risk factors immediately');
    }

    // Guardian recommendations
    if (this.props.guardianAssignments.length === 1) {
      recommendations.push('Consider appointing an alternate guardian for redundancy');
    }

    // Bond recommendations
    if (
      this.props.requiresPropertyManagement &&
      this.props.bondStatus === BondOverallStatus.REQUIRED_PENDING
    ) {
      recommendations.push('Post required bond for property management');
    }

    return recommendations;
  }

  private generateTimelineReport(): Array<Record<string, any>> {
    return this.props.history.map((event) => ({
      date: event.timestamp,
      event: event.eventType,
      description: event.description,
      actor: event.actor,
    }));
  }

  // 🎯 INNOVATIVE: Helper Methods

  private validate(): void {
    // Ward must be a minor or incapacitated
    if (this.props.period.isWardMinor() && this.props.status === GuardianshipStatus.TERMINATED) {
      throw new Error('Cannot terminate guardianship for minor ward');
    }

    // Must have at least one guardian if active
    if (
      this.props.status === GuardianshipStatus.ACTIVE &&
      this.props.guardianAssignments.length === 0
    ) {
      throw new Error('Active guardianship must have at least one guardian');
    }

    // Court order required for certain types
    if (
      (this.props.guardianshipType.getValue().value === 'COURT_APPOINTED' ||
        this.props.guardianshipType.getValue().value === 'EMERGENCY') &&
      !this.props.courtOrder
    ) {
      throw new Error('Court order required for court-appointed or emergency guardianships');
    }
  }

  private validateGuardianshipIsActive(): void {
    if (
      this.props.status !== GuardianshipStatus.ACTIVE &&
      this.props.status !== GuardianshipStatus.EMERGENCY
    ) {
      throw new Error('Guardianship is not active');
    }
  }

  private detectPotentialConflicts(assignment: GuardianAssignmentEntity): void {
    // Check if guardian is also a beneficiary of ward's estate
    // Check if guardian has financial conflicts
    // Check if guardian is in legal dispute with ward
    // Simplified for this example
    console.log('Conflict detection for guardian:', assignment.props.guardianName);
  }

  private getLastComplianceCheck(): ComplianceCheckEntity | undefined {
    if (this.props.complianceChecks.length === 0) return undefined;

    return this.props.complianceChecks
      .slice()
      .sort((a, b) => b.props.dueDate.getTime() - a.props.dueDate.getTime())[0];
  }

  private createClosingComplianceReport(reason: string): void {
    const closingCheck = ComplianceCheckEntity.create({
      guardianshipId: this.id.toString(),
      year: new Date().getFullYear(),
      reportingPeriod: 'CLOSING',
      schedule: this.props.complianceSchedule,
      dueDate: new Date(),
      submissionDeadline: new Date(),
      reportTitle: `Closing Report: ${this.props.wardName} Guardianship`,
      reportType: 'CLOSING_REPORT',
      autoGenerated: true,
      sections: this.generateClosingSections(reason),
      attachments: [],
      wardStatus: {
        generalHealth: 'GOOD',
        emotionalWellbeing: 'CONTENT',
        livingConditions: 'ADEQUATE',
        notableEvents: [],
      },
    });

    this.props.complianceChecks.push(closingCheck);
  }

  private generateClosingSections(reason: string): any[] {
    return [
      {
        id: 'closing-summary',
        title: 'Guardianship Closing Summary',
        type: 'TEXT',
        content: `Guardianship terminated on ${new Date().toLocaleDateString()}. Reason: ${reason}`,
        isRequired: true,
        isComplete: true,
      },
      {
        id: 'final-ward-status',
        title: 'Final Ward Status',
        type: 'TEXT',
        content: `Ward age: ${this.props.period.getWardAge()}. Status: ${this.props.period.getStatus()}`,
        isRequired: true,
        isComplete: true,
      },
      {
        id: 'assets-transfer',
        title: 'Assets Transfer Summary',
        type: 'TEXT',
        content: 'All assets transferred to ward or designated beneficiaries.',
        isRequired: this.props.requiresPropertyManagement,
        isComplete: true,
      },
    ];
  }

  private addHistoryEvent(
    eventType: string,
    description: string,
    actor?: string,
    metadata?: Record<string, any>,
  ): void {
    this.props.history.push({
      timestamp: new Date(),
      eventType,
      description,
      actor,
      metadata,
    });
  }

  private notifyExternalContact(
    contact: string,
    notificationType: string,
    data: Record<string, any>,
  ): void {
    // In real implementation, this would integrate with notifications service
    console.log(`Notifying ${contact} about ${notificationType}:`, data);
  }

  // 🎯 INNOVATIVE: Apply events for event sourcing
  protected applyEvent(event: DomainEvent): void {
    // Handle different event types to rebuild aggregate state
    switch (event.getEventType()) {
      case 'GUARDIANSHIP_CREATED':
        // Apply creation logic
        break;
      case 'GUARDIAN_APPOINTED':
        // Apply guardian appointment logic
        break;
      case 'COMPLIANCE_CHECK_SUBMITTED':
        // Apply compliance submission logic
        break;
      // Handle other events
    }
  }

  // 🎯 INNOVATIVE: Clone props for snapshot
  private cloneProps(): any {
    return JSON.parse(JSON.stringify(this.props));
  }

  // Public getters
  get wardId(): string {
    return this.props.wardId;
  }

  get status(): GuardianshipStatus {
    return this.props.status;
  }

  get complianceStatus(): ComplianceHealthStatus {
    return this.props.complianceStatus;
  }

  get riskLevel(): string {
    return this.props.riskLevel;
  }

  get activeGuardians(): GuardianAssignmentEntity[] {
    return this.props.guardianAssignments.filter(
      (ga) => ga.status === 'ACTIVE' || ga.status === 'PENDING',
    );
  }

  get primaryGuardian(): GuardianAssignmentEntity | undefined {
    return this.props.guardianAssignments.find(
      (ga) => ga.isPrimary && (ga.status === 'ACTIVE' || ga.status === 'PENDING'),
    );
  }
}
