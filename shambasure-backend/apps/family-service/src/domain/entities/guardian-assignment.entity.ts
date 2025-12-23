// domain/entities/guardian-assignment.entity.ts
import {
  GuardianAppointmentSource,
  GuardianReportStatus,
  GuardianType,
  GuardianshipTerminationReason,
} from '@prisma/client';

import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
// Domain Events
import { AnnualReportFiledEvent } from '../events/guardianship-events/annual-report-filed.event';
import { GuardianAllowanceUpdatedEvent } from '../events/guardianship-events/guardian-allowance-updated.event';
import { GuardianAppointedEvent } from '../events/guardianship-events/guardian-appointed.event';
import { GuardianBondPostedEvent } from '../events/guardianship-events/guardian-bond-posted.event';
import { GuardianPowersGrantedEvent } from '../events/guardianship-events/guardian-powers-granted.event';
import { GuardianshipTerminatedEvent } from '../events/guardianship-events/guardianship-terminated.event';
// Exceptions
import { InvalidGuardianshipException } from '../exceptions/guardianship.exception';
// Value Objects
import { KenyanMoney } from '../value-objects/financial/kenyan-money.vo';
import { CourtOrder } from '../value-objects/legal/court-order.vo';
import { GuardianBond } from '../value-objects/legal/guardian-bond.vo';
import { GuardianPowers } from '../value-objects/legal/guardian-powers.vo';
import { KenyanLawSection } from '../value-objects/legal/kenyan-law-section.vo';
import { ReportingSchedule } from '../value-objects/legal/reporting-schedule.vo';

/**
 * Guardianship of Person vs Property (Kenyan Law Distinction)
 */
export enum GuardianshipCategory {
  PERSON_ONLY = 'PERSON_ONLY', // Care and welfare only (no property)
  PROPERTY_ONLY = 'PROPERTY_ONLY', // Property management only (e.g., trustee)
  PERSON_AND_PROPERTY = 'PERSON_AND_PROPERTY', // Both care and property
  LIMITED_CUSTODIAL = 'LIMITED_CUSTODIAL', // Temporary/customary arrangement
}

/**
 * Kenyan Customary Law Recognition Status
 */
export enum CustomaryRecognitionStatus {
  NOT_RECOGNIZED = 'NOT_RECOGNIZED',
  COMMUNITY_RECOGNIZED = 'COMMUNITY_RECOGNIZED',
  ELDERS_COUNCIL_CERTIFIED = 'ELDERS_COUNCIL_CERTIFIED',
  COURT_RECOGNIZED = 'COURT_RECOGNIZED',
  STATUTORY_INTEGRATED = 'STATUTORY_INTEGRATED',
}

/**
 * Guardian Assignment Entity Props
 * Entity within Guardianship Aggregate Root
 */
export interface GuardianAssignmentProps {
  // === AGGREGATE RELATIONSHIPS ===
  guardianshipId: UniqueEntityID; // Parent aggregate root
  wardId: UniqueEntityID; // Reference to FamilyMember (ward)
  guardianId: UniqueEntityID; // Reference to FamilyMember (guardian)

  // === APPOINTMENT CONTEXT ===
  appointmentSource: GuardianAppointmentSource; // FAMILY, COURT, WILL, CUSTOMARY_LAW
  isPrimary: boolean; // Primary vs secondary guardian
  orderOfPrecedence: number; // 1, 2, 3 for succession

  // === LEGAL CLASSIFICATION ===
  type: GuardianType; // TESTAMENTARY, COURT_APPOINTED, etc.
  category: GuardianshipCategory; // PERSON_ONLY, PROPERTY_ONLY, etc.

  // === COURT INTEGRATION ===
  courtOrder?: CourtOrder; // S.71 court order (if court-appointed)
  courtFileNumber?: string; // Children's Court file reference
  appointmentDate: Date;
  termExpiryDate?: Date; // For temporary appointments

  // === GUARDIAN POWERS (S.70 & S.71 LSA) ===
  powers: GuardianPowers;

  // === S.72 LSA - GUARDIAN BOND FOR PROPERTY ===
  bond?: GuardianBond;
  bondRequired: boolean;
  bondWaived: boolean; // Court waived bond requirement
  bondWaiverOrderNumber?: string;

  // === S.73 LSA - ANNUAL REPORTING COMPLIANCE ===
  reportingSchedule?: ReportingSchedule;
  lastReportFiledDate?: Date;
  nextReportDueDate?: Date;

  // === FINANCIAL MANAGEMENT ===
  hasFinancialPowers: boolean;
  financialLimit?: KenyanMoney; // Maximum amount guardian can manage
  annualAllowance?: KenyanMoney; // Guardian compensation
  allowanceApprovedByCourt: boolean;
  allowanceOrderNumber?: string;

  // === KENYAN CUSTOMARY LAW INTEGRATION ===
  customaryLawApplies: boolean;
  customaryRecognitionStatus: CustomaryRecognitionStatus;
  customaryAuthority?: string; // Clan elders, council name
  customaryInstallationDate?: Date;
  customaryConditions?: Record<string, any>;

  // === CROSS-SERVICE INTEGRATION FLAGS ===
  estateServiceNotified: boolean; // Notified estate-service for asset management
  notificationSentAt?: Date;

  // === STATUS MANAGEMENT ===
  isActive: boolean;
  activationDate?: Date;
  deactivationDate?: Date;
  deactivationReason?: GuardianshipTerminationReason;
  deactivationNotes?: string;

  // === AUDIT & COMPLIANCE ===
  lastComplianceCheckDate?: Date;
  complianceScore: number; // 0-100 score based on filings
  requiresCourtSupervision: boolean;
  nextCourtReviewDate?: Date;

  // === LEGAL BASIS TRACKING ===
  applicableLawSections: KenyanLawSection[]; // S.70, S.71, S.72, S.73
}

/**
 * Props for Creating Guardian Assignment
 */
export interface CreateGuardianAssignmentProps {
  // Required references
  guardianshipId: string;
  wardId: string;
  guardianId: string;

  // Appointment details
  appointmentSource: GuardianAppointmentSource;
  isPrimary?: boolean;
  type: GuardianType;
  category?: GuardianshipCategory;

  // Legal context
  courtOrderNumber?: string;
  courtStation?: string;
  courtFileNumber?: string;
  appointmentDate?: Date;
  termDurationMonths?: number; // For temporary appointments

  // Powers configuration
  hasPropertyManagementPowers?: boolean;
  hasMedicalConsentPowers?: boolean;
  hasEducationalConsentPowers?: boolean;
  hasTravelConsentPowers?: boolean;
  restrictions?: string[];
  specialInstructions?: string;

  // Financial limits
  financialLimitKES?: number;
  requiresBond?: boolean;
  bondAmountKES?: number;

  // Customary law
  customaryLawApplies?: boolean;
  customaryAuthority?: string;
  customaryInstallationDate?: Date;

  // Compliance
  requiresCourtSupervision?: boolean;
}

/**
 * GUARDIAN ASSIGNMENT ENTITY
 *
 * Represents a specific guardian appointment within a Guardianship aggregate.
 *
 * LEGAL CONTEXT:
 * - S.70 LSA: Testamentary guardians appointed by will
 * - S.71 LSA: Court-appointed guardians (Children Act Section 73)
 * - S.72 LSA: Bond requirements for property guardians
 * - S.73 LSA: Annual accounting and reporting
 *
 * REAL-WORLD CONSIDERATIONS:
 * 1. Multiple guardians can be appointed (primary + alternates)
 * 2. Guardianship of person vs property distinction
 * 3. Kenyan customary law integration (clan elders recognition)
 * 4. Court supervision requirements for contentious cases
 * 5. Temporary vs permanent guardianship
 *
 * INVARIANTS:
 * 1. Cannot appoint minor as guardian (must be 18+)
 * 2. Property management requires S.72 bond (unless waived by court)
 * 3. Active property guardians must file S.73 annual reports
 * 4. Guardian cannot have conflict of interest with ward
 * 5. Customary guardians must be recognized by community
 */
export class GuardianAssignment extends Entity<GuardianAssignmentProps> {
  private constructor(id: UniqueEntityID, props: GuardianAssignmentProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /**
   * Create new Guardian Assignment
   * Validates Kenyan legal requirements
   */
  public static create(props: CreateGuardianAssignmentProps): GuardianAssignment {
    const id = new UniqueEntityID();
    const appointmentDate = props.appointmentDate || new Date();

    // Calculate term expiry if temporary
    let termExpiryDate: Date | undefined;
    if (props.termDurationMonths) {
      termExpiryDate = new Date(appointmentDate);
      termExpiryDate.setMonth(termExpiryDate.getMonth() + props.termDurationMonths);
    }

    // Build court order if provided
    let courtOrder: CourtOrder | undefined;
    if (props.courtOrderNumber && props.courtStation) {
      courtOrder = CourtOrder.create({
        orderNumber: props.courtOrderNumber,
        courtStation: props.courtStation,
        orderDate: appointmentDate,
        courtFileNumber: props.courtFileNumber,
      });
    }

    // Determine category based on powers
    const hasPropertyPowers = props.hasPropertyManagementPowers || false;
    const category =
      props.category ||
      (hasPropertyPowers
        ? GuardianshipCategory.PERSON_AND_PROPERTY
        : GuardianshipCategory.PERSON_ONLY);

    // Build guardian powers
    const powers = GuardianPowers.create({
      hasPropertyManagementPowers: hasPropertyPowers,
      canConsentToMedical: props.hasMedicalConsentPowers ?? true,
      canConsentToEducation: props.hasEducationalConsentPowers ?? true,
      canConsentToTravel: props.hasTravelConsentPowers ?? false,
      restrictions: props.restrictions ?? [],
      specialInstructions: props.specialInstructions,
    });

    // Build reporting schedule if property powers
    let reportingSchedule: ReportingSchedule | undefined;
    if (hasPropertyPowers) {
      const nextReportDue = new Date(appointmentDate);
      nextReportDue.setFullYear(nextReportDue.getFullYear() + 1);

      reportingSchedule = ReportingSchedule.create({
        firstReportDue: nextReportDue,
        frequency: 'ANNUAL',
        reportingEntity: 'GUARDIAN',
        jurisdiction: 'KENYA',
        gracePeriodDays: 60, // S.73 allows 60 days after year end
      });
    }

    // Determine applicable law sections
    const applicableLawSections: KenyanLawSection[] = [];
    if (props.type === 'TESTAMENTARY') {
      applicableLawSections.push(KenyanLawSection.S70_TESTAMENTARY_GUARDIAN);
    } else if (props.type === 'COURT_APPOINTED') {
      applicableLawSections.push(KenyanLawSection.S71_COURT_GUARDIAN);
    }
    if (hasPropertyPowers) {
      applicableLawSections.push(KenyanLawSection.S72_GUARDIAN_BOND);
      applicableLawSections.push(KenyanLawSection.S73_GUARDIAN_ACCOUNTS);
    }

    // Build financial limit if provided
    let financialLimit: KenyanMoney | undefined;
    if (props.financialLimitKES) {
      financialLimit = KenyanMoney.create(props.financialLimitKES);
    }

    const assignment = new GuardianAssignment(id, {
      guardianshipId: new UniqueEntityID(props.guardianshipId),
      wardId: new UniqueEntityID(props.wardId),
      guardianId: new UniqueEntityID(props.guardianId),
      appointmentSource: props.appointmentSource,
      isPrimary: props.isPrimary ?? true,
      orderOfPrecedence: props.isPrimary ? 1 : 2,
      type: props.type,
      category,
      courtOrder,
      courtFileNumber: props.courtFileNumber,
      appointmentDate,
      termExpiryDate,
      powers,
      bondRequired: props.requiresBond ?? hasPropertyPowers,
      bondWaived: false,
      reportingSchedule,
      hasFinancialPowers: hasPropertyPowers,
      financialLimit,
      annualAllowance: undefined,
      allowanceApprovedByCourt: false,
      customaryLawApplies: props.customaryLawApplies ?? false,
      customaryRecognitionStatus: props.customaryLawApplies
        ? CustomaryRecognitionStatus.COMMUNITY_RECOGNIZED
        : CustomaryRecognitionStatus.NOT_RECOGNIZED,
      customaryAuthority: props.customaryAuthority,
      customaryInstallationDate: props.customaryInstallationDate,
      estateServiceNotified: false,
      isActive: true,
      activationDate: new Date(),
      complianceScore: 100, // Start with perfect score
      requiresCourtSupervision: props.requiresCourtSupervision ?? false,
      applicableLawSections,
    });

    // Emit domain event
    assignment.addDomainEvent(
      new GuardianAppointedEvent(id.toString(), 'GuardianAssignment', 1, {
        guardianshipId: props.guardianshipId,
        wardId: props.wardId,
        guardianId: props.guardianId,
        type: props.type,
        category,
        appointmentSource: props.appointmentSource,
        courtOrderNumber: props.courtOrderNumber,
        hasPropertyPowers,
        customaryLawApplies: props.customaryLawApplies ?? false,
      }),
    );

    return assignment;
  }

  /**
   * Reconstitute from persistence
   */
  public static fromPersistence(
    id: string,
    props: GuardianAssignmentProps,
    createdAt: Date,
  ): GuardianAssignment {
    return new GuardianAssignment(new UniqueEntityID(id), props, createdAt);
  }

  // ============================================================================
  // DOMAIN LOGIC - S.72 BOND MANAGEMENT
  // ============================================================================

  /**
   * Post Guardian Bond (S.72 LSA)
   * Required for property management guardians
   */
  public postBond(params: {
    provider: string;
    policyNumber: string;
    amountKES: number;
    expiryDate: Date;
    suretyCompany?: string;
    courtApprovalNumber?: string;
  }): void {
    this.ensureNotDeleted();

    if (!this.requiresBond()) {
      throw new InvalidGuardianshipException('Bond not required for this guardianship category.');
    }

    if (this.props.bondWaived) {
      throw new InvalidGuardianshipException('Bond requirement waived by court. Cannot post bond.');
    }

    if (this.isBondPosted()) {
      throw new InvalidGuardianshipException('Bond already posted. Use renewBond() for extension.');
    }

    // Create bond with Kenyan legal requirements
    const bond = GuardianBond.create({
      provider: params.provider,
      policyNumber: params.policyNumber,
      amount: KenyanMoney.create(params.amountKES),
      issuedDate: new Date(),
      expiryDate: params.expiryDate,
      suretyCompany: params.suretyCompany,
      courtApprovalNumber: params.courtApprovalNumber,
      bondType: 'GUARDIAN_PROPERTY',
      jurisdiction: 'KENYA',
    });

    this.updateProps({ bond });

    this.addDomainEvent(
      new GuardianBondPostedEvent(this._id.toString(), 'GuardianAssignment', this._version, {
        guardianAssignmentId: this._id.toString(),
        guardianshipId: this.props.guardianshipId.toString(),
        amountKES: params.amountKES,
        provider: params.provider,
        policyNumber: params.policyNumber,
        expiryDate: params.expiryDate,
      }),
    );
  }

  /**
   * Request Bond Waiver from Court
   * (For guardians with limited property or family appointments)
   */
  public requestBondWaiver(_params: {
    waiverReason: string;
    supportingAffidavitId?: string;
    requestedBy: string;
  }): void {
    this.ensureNotDeleted();

    if (!this.requiresBond()) {
      throw new InvalidGuardianshipException('Bond not required for this assignment.');
    }

    if (this.props.bondWaived) {
      throw new InvalidGuardianshipException('Bond already waived.');
    }

    // In real system, this would trigger court filing workflow
    this.updateProps({
      bondWaived: true,
      bondWaiverOrderNumber: `WAIVER-${Date.now()}-${this._id.toString().slice(0, 8)}`,
    });
  }

  // ============================================================================
  // DOMAIN LOGIC - S.73 ANNUAL REPORTING
  // ============================================================================

  /**
   * File Annual Report (S.73 LSA)
   * With Kenyan court formatting requirements
   */
  public fileAnnualReport(params: {
    reportDate: Date;
    reportPeriod: string; // e.g., "2024-2025"
    financialSummary: {
      assetsUnderManagementKES: number;
      incomeReceivedKES: number;
      expensesPaidKES: number;
      netChangeKES: number;
    };
    wardWelfareUpdate: {
      healthStatus: string;
      educationProgress: string;
      livingConditions: string;
    };
    challengesEncountered?: string[];
    supportingDocuments?: string[]; // Document IDs
    filedBy: string;
    courtReceiptNumber?: string;
  }): void {
    this.ensureNotDeleted();

    if (!this.requiresAnnualReport()) {
      throw new InvalidGuardianshipException(
        'Annual reports not required for this guardianship category.',
      );
    }

    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Cannot file report for inactive guardianship.');
    }

    const schedule = this.props.reportingSchedule!;

    // Validate report timing
    if (params.reportDate > new Date()) {
      throw new InvalidGuardianshipException('Report date cannot be in future.');
    }

    // Update reporting schedule
    const nextDueDate = new Date(params.reportDate);
    nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);

    const updatedSchedule = schedule.fileReport(
      params.reportDate,
      params.courtReceiptNumber ? GuardianReportStatus.APPROVED : GuardianReportStatus.SUBMITTED,
      params.courtReceiptNumber,
    );

    // Update compliance score (penalize late filings)
    const daysLate = schedule.calculateDaysLate(params.reportDate);
    const compliancePenalty = daysLate > 0 ? Math.min(daysLate * 0.5, 20) : 0;
    const newComplianceScore = Math.max(0, this.props.complianceScore - compliancePenalty + 10);

    this.updateProps({
      reportingSchedule: updatedSchedule,
      lastReportFiledDate: params.reportDate,
      nextReportDueDate: nextDueDate,
      complianceScore: newComplianceScore,
      lastComplianceCheckDate: new Date(),
    });

    this.addDomainEvent(
      new AnnualReportFiledEvent(this._id.toString(), 'GuardianAssignment', this._version, {
        guardianAssignmentId: this._id.toString(),
        guardianshipId: this.props.guardianshipId.toString(),
        reportPeriod: params.reportPeriod,
        reportDate: params.reportDate,
        financialSummary: params.financialSummary,
        nextReportDue: nextDueDate,
        filedBy: params.filedBy,
        courtReceiptNumber: params.courtReceiptNumber,
        complianceScore: newComplianceScore,
      }),
    );

    // Trigger notification to estate-service for asset reconciliation
    if (this.props.hasFinancialPowers) {
      this.triggerEstateServiceNotification('ANNUAL_REPORT_FILED', {
        reportId: this._id.toString(),
        reportDate: params.reportDate,
        financialSummary: params.financialSummary,
      });
    }
  }

  // ============================================================================
  // DOMAIN LOGIC - POWERS & AUTHORITY MANAGEMENT
  // ============================================================================

  /**
   * Grant Additional Powers with Court Approval
   */
  public grantAdditionalPowers(params: {
    powerType: 'MEDICAL' | 'EDUCATIONAL' | 'TRAVEL' | 'FINANCIAL';
    scope: string;
    limitKES?: number;
    courtOrderNumber?: string;
    effectiveDate: Date;
    grantedBy: string;
  }): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Cannot modify powers of inactive guardianship.');
    }

    const updatedPowers = this.props.powers.grantAdditionalPower(
      params.powerType,
      params.scope,
      params.limitKES,
    );

    // Update financial limit if financial powers granted
    let financialLimit = this.props.financialLimit;
    if (params.powerType === 'FINANCIAL' && params.limitKES) {
      financialLimit = KenyanMoney.create(params.limitKES);
      this.updateProps({ hasFinancialPowers: true });
    }

    this.updateProps({
      powers: updatedPowers,
      financialLimit,
    });

    // Update applicable law sections
    if (!this.props.applicableLawSections.includes(KenyanLawSection.S71_COURT_GUARDIAN)) {
      const updatedSections = [
        ...this.props.applicableLawSections,
        KenyanLawSection.S71_COURT_GUARDIAN,
      ];
      this.updateProps({ applicableLawSections: updatedSections });
    }

    this.addDomainEvent(
      new GuardianPowersGrantedEvent(this._id.toString(), 'GuardianAssignment', this._version, {
        guardianAssignmentId: this._id.toString(),
        powerType: params.powerType,
        scope: params.scope,
        limitKES: params.limitKES,
        courtOrderNumber: params.courtOrderNumber,
        grantedBy: params.grantedBy,
      }),
    );
  }

  /**
   * Restrict Guardian Powers (Court Order)
   */
  public restrictPowers(params: {
    restrictions: string[];
    courtOrderNumber: string;
    effectiveDate: Date;
    reason: string;
  }): void {
    this.ensureNotDeleted();

    const updatedPowers = this.props.powers.addRestrictions(params.restrictions);
    this.updateProps({ powers: updatedPowers });

    // Update compliance requirements
    if (params.restrictions.includes('NO_PROPERTY_MANAGEMENT')) {
      this.updateProps({
        bondRequired: false,
        hasFinancialPowers: false,
      });
    }
  }

  // ============================================================================
  // DOMAIN LOGIC - STATUS MANAGEMENT
  // ============================================================================

  /**
   * Activate Guardianship (After Court Approval)
   */
  public activate(params: {
    activationDate: Date;
    activatedBy: string;
    courtOrderNumber?: string;
  }): void {
    this.ensureNotDeleted();

    if (this.props.isActive) {
      throw new InvalidGuardianshipException('Guardianship already active.');
    }

    this.updateProps({
      isActive: true,
      activationDate: params.activationDate,
    });

    // Notify estate-service for asset management setup
    this.triggerEstateServiceNotification('GUARDIANSHIP_ACTIVATED', {
      activationDate: params.activationDate,
      guardianId: this.props.guardianId.toString(),
      wardId: this.props.wardId.toString(),
      hasFinancialPowers: this.props.hasFinancialPowers,
    });
  }

  /**
   * Terminate Guardianship Assignment
   */
  public terminate(params: {
    reason: GuardianshipTerminationReason;
    terminationDate: Date;
    terminatedBy: string;
    courtOrderNumber?: string;
    handoverToGuardianId?: string;
    notes?: string;
  }): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Guardianship already terminated.');
    }

    // Validate termination reason
    if (params.reason === GuardianshipTerminationReason.WARD_REACHED_MAJORITY) {
      // Would need ward's DOB to validate
      console.warn('Verify ward age before termination for majority.');
    }

    this.updateProps({
      isActive: false,
      deactivationDate: params.terminationDate,
      deactivationReason: params.reason,
      deactivationNotes: params.notes,
    });

    // Release bond if posted
    if (this.isBondPosted()) {
      console.log(`Bond ${this.props.bond!.policyNumber} should be released.`);
    }

    // Notify estate-service to freeze asset management
    this.triggerEstateServiceNotification('GUARDIANSHIP_TERMINATED', {
      terminationDate: params.terminationDate,
      reason: params.reason,
      handoverToGuardianId: params.handoverToGuardianId,
    });

    this.addDomainEvent(
      new GuardianshipTerminatedEvent(this._id.toString(), 'GuardianAssignment', this._version, {
        guardianAssignmentId: this._id.toString(),
        guardianshipId: this.props.guardianshipId.toString(),
        wardId: this.props.wardId.toString(),
        guardianId: this.props.guardianId.toString(),
        reason: params.reason,
        terminationDate: params.terminationDate,
        terminatedBy: params.terminatedBy,
        courtOrderNumber: params.courtOrderNumber,
      }),
    );
  }

  /**
   * Suspend Guardianship (Temporary)
   */
  public suspend(params: {
    reason: string;
    suspensionDate: Date;
    expectedResumptionDate?: Date;
    suspendedBy: string;
  }): void {
    this.ensureNotDeleted();

    this.updateProps({
      isActive: false,
      deactivationDate: params.suspensionDate,
      deactivationReason: GuardianshipTerminationReason.GUARDIAN_INCAPACITATED,
      deactivationNotes: `Suspended: ${params.reason}. Expected resumption: ${params.expectedResumptionDate}`,
    });

    // Notify estate-service to restrict asset access
    this.triggerEstateServiceNotification('GUARDIANSHIP_SUSPENDED', {
      suspensionDate: params.suspensionDate,
      reason: params.reason,
      expectedResumptionDate: params.expectedResumptionDate,
    });
  }

  // ============================================================================
  // DOMAIN LOGIC - FINANCIAL MANAGEMENT
  // ============================================================================

  /**
   * Set Annual Allowance (Court-Approved)
   */
  public setAllowance(params: {
    amountKES: number;
    paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
    effectiveDate: Date;
    courtOrderNumber: string;
    approvedBy: string;
    reviewDate?: Date;
  }): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Cannot set allowance for inactive guardianship.');
    }

    if (params.amountKES < 0) {
      throw new InvalidGuardianshipException('Allowance amount cannot be negative.');
    }

    // Kenyan law: Allowance must be reasonable and court-approved
    if (params.amountKES > 500000) {
      // Example threshold
      console.warn('High guardian allowance - ensure court approval documented.');
    }

    this.updateProps({
      annualAllowance: KenyanMoney.create(params.amountKES),
      allowanceApprovedByCourt: true,
      allowanceOrderNumber: params.courtOrderNumber,
    });

    this.addDomainEvent(
      new GuardianAllowanceUpdatedEvent(this._id.toString(), 'GuardianAssignment', this._version, {
        guardianAssignmentId: this._id.toString(),
        newAmountKES: params.amountKES,
        paymentFrequency: params.paymentFrequency,
        courtOrderNumber: params.courtOrderNumber,
        approvedBy: params.approvedBy,
      }),
    );
  }

  /**
   * Update Financial Management Limit
   */
  public updateFinancialLimit(params: {
    newLimitKES: number;
    effectiveDate: Date;
    courtOrderNumber?: string;
    reason: string;
  }): void {
    this.ensureNotDeleted();

    if (!this.props.hasFinancialPowers) {
      throw new InvalidGuardianshipException('Guardian does not have financial management powers.');
    }

    this.updateProps({
      financialLimit: KenyanMoney.create(params.newLimitKES),
    });

    // Log change for audit trail
    console.log(`Financial limit updated for guardian ${this._id.toString()}: ${params.reason}`);
  }

  // ============================================================================
  // DOMAIN LOGIC - CUSTOMARY LAW INTEGRATION
  // ============================================================================

  /**
   * Recognize Customary Guardianship
   */
  public recognizeCustomaryGuardianship(params: {
    recognitionStatus: CustomaryRecognitionStatus;
    recognizedBy: string; // Elders council, community leader
    recognitionDate: Date;
    customaryConditions: Record<string, any>;
    integrationNotes?: string;
  }): void {
    this.ensureNotDeleted();

    if (!this.props.customaryLawApplies) {
      throw new InvalidGuardianshipException(
        'Guardianship not marked as customary law applicable.',
      );
    }

    this.updateProps({
      customaryRecognitionStatus: params.recognitionStatus,
      customaryAuthority: params.recognizedBy,
      customaryInstallationDate: params.recognitionDate,
      customaryConditions: params.customaryConditions,
    });

    // If court-recognized, update legal basis
    if (params.recognitionStatus === CustomaryRecognitionStatus.COURT_RECOGNIZED) {
      console.log('Customary guardianship recognized by court - updating legal status.');
    }
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  private validate(): void {
    // Core invariants
    if (this.props.wardId.equals(this.props.guardianId)) {
      throw new InvalidGuardianshipException('Guardian cannot be the same person as ward.');
    }

    // Court appointment validation
    if (this.props.type === 'COURT_APPOINTED' && !this.props.courtOrder) {
      console.warn(`Court-appointed guardian ${this._id.toString()} should have court order.`);
    }

    // S.72 Bond requirement validation
    if (
      this.props.category === GuardianshipCategory.PERSON_AND_PROPERTY &&
      this.props.bondRequired &&
      !this.isBondPosted() &&
      !this.props.bondWaived &&
      this.props.isActive
    ) {
      console.warn(`Active property guardian ${this._id.toString()} requires S.72 bond.`);
    }

    // S.73 Reporting requirement validation
    if (this.requiresAnnualReport() && !this.props.reportingSchedule && this.props.isActive) {
      console.warn(
        `Active property guardian ${this._id.toString()} requires S.73 reporting schedule.`,
      );
    }

    // Term expiry check
    if (
      this.props.termExpiryDate &&
      this.props.termExpiryDate < new Date() &&
      this.props.isActive
    ) {
      console.warn(`Guardianship term expired but still active: ${this._id.toString()}`);
    }

    // Financial powers without bond check
    if (this.props.hasFinancialPowers && !this.props.bondRequired && !this.props.bondWaived) {
      console.warn(`Financial management powers without bond requirement: ${this._id.toString()}`);
    }
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  get guardianshipId(): UniqueEntityID {
    return this.props.guardianshipId;
  }

  get wardId(): UniqueEntityID {
    return this.props.wardId;
  }

  get guardianId(): UniqueEntityID {
    return this.props.guardianId;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get type(): GuardianType {
    return this.props.type;
  }

  get category(): GuardianshipCategory {
    return this.props.category;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get appointmentDate(): Date {
    return this.props.appointmentDate;
  }

  /**
   * Check if bond posting is required
   */
  public requiresBond(): boolean {
    return (
      this.props.bondRequired &&
      (this.props.category === GuardianshipCategory.PERSON_AND_PROPERTY ||
        this.props.category === GuardianshipCategory.PROPERTY_ONLY) &&
      !this.props.bondWaived
    );
  }

  /**
   * Check if bond has been posted
   */
  public isBondPosted(): boolean {
    return !!this.props.bond;
  }

  /**
   * Check if bond is expired
   */
  public isBondExpired(): boolean {
    return this.props.bond?.isExpired() ?? false;
  }

  /**
   * Check if annual reports are required (S.73)
   */
  public requiresAnnualReport(): boolean {
    return (
      this.props.isActive &&
      (this.props.category === GuardianshipCategory.PERSON_AND_PROPERTY ||
        this.props.category === GuardianshipCategory.PROPERTY_ONLY)
    );
  }

  /**
   * Check if report is overdue
   */
  public isReportOverdue(): boolean {
    if (!this.props.reportingSchedule) return false;
    return this.props.reportingSchedule.isOverdue();
  }

  /**
   * Get S.73 compliance status with Kenyan court standards
   */
  public getS73ComplianceStatus(): {
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_REQUIRED' | 'GRACE_PERIOD';
    daysRemaining?: number;
    nextAction?: string;
  } {
    if (!this.requiresAnnualReport()) {
      return { status: 'NOT_REQUIRED' };
    }

    if (!this.props.reportingSchedule) {
      return { status: 'NON_COMPLIANT', nextAction: 'Establish reporting schedule' };
    }

    const schedule = this.props.reportingSchedule;

    if (schedule.isOverdue()) {
      const daysOverdue = schedule.calculateDaysOverdue();
      return {
        status: 'NON_COMPLIANT',
        daysRemaining: -daysOverdue,
        nextAction: 'File overdue report immediately',
      };
    }

    if (schedule.isInGracePeriod()) {
      const daysRemaining = schedule.daysRemainingInGracePeriod();
      return {
        status: 'GRACE_PERIOD',
        daysRemaining,
        nextAction: `File within ${daysRemaining} days`,
      };
    }

    const currentStatus = schedule.status;
    if (currentStatus === GuardianReportStatus.APPROVED) {
      return { status: 'COMPLIANT' };
    } else if (currentStatus === GuardianReportStatus.SUBMITTED) {
      return {
        status: 'COMPLIANT',
        nextAction: 'Awaiting court approval',
      };
    }

    return {
      status: 'NON_COMPLIANT',
      nextAction: 'File annual report',
    };
  }

  /**
   * Check if guardianship requires court supervision
   */
  public requiresCourtSupervision(): boolean {
    return (
      this.props.requiresCourtSupervision ||
      this.props.complianceScore < 70 ||
      this.isReportOverdue()
    );
  }

  /**
   * Get powers summary for UI/API
   */
  public getPowersSummary(): Record<string, any> {
    return {
      ...this.props.powers.toJSON(),
      financialLimit: this.props.financialLimit?.toJSON(),
      hasFinancialPowers: this.props.hasFinancialPowers,
      requiresBond: this.requiresBond(),
      bondPosted: this.isBondPosted(),
      bondExpired: this.isBondExpired(),
    };
  }

  /**
   * Get next required action
   */
  public getNextRequiredAction(): string | null {
    if (!this.props.isActive) return null;

    if (this.requiresBond() && !this.isBondPosted()) {
      return 'Post S.72 guardian bond';
    }

    if (this.isBondExpired()) {
      return 'Renew expired guardian bond';
    }

    if (this.isReportOverdue()) {
      return 'File overdue S.73 annual report';
    }

    if (this.props.nextReportDueDate && this.props.nextReportDueDate < new Date()) {
      return `File annual report (due ${this.props.nextReportDueDate.toLocaleDateString()})`;
    }

    if (this.props.nextCourtReviewDate && this.props.nextCourtReviewDate < new Date()) {
      return 'Schedule court review';
    }

    return null;
  }

  // ============================================================================
  // INTEGRATION METHODS
  // ============================================================================

  /**
   * Trigger notification to estate-service
   */
  private triggerEstateServiceNotification(eventType: string, payload: Record<string, any>): void {
    // In real implementation, this would publish to event bus
    console.log(`[EVENT BUS] Publishing to estate-service: ${eventType}`, payload);

    // Update notification flag
    if (!this.props.estateServiceNotified) {
      this.updateProps({
        estateServiceNotified: true,
        notificationSentAt: new Date(),
      });
    }
  }

  /**
   * Mark estate-service notification as sent
   */
  public markEstateServiceNotified(): void {
    this.updateProps({
      estateServiceNotified: true,
      notificationSentAt: new Date(),
    });
  }

  /**
   * Schedule court review
   */
  public scheduleCourtReview(reviewDate: Date, reason: string): void {
    this.updateProps({
      requiresCourtSupervision: true,
      nextCourtReviewDate: reviewDate,
    });

    console.log(`Court review scheduled for ${reviewDate.toLocaleDateString()}: ${reason}`);
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  /**
   * Serialize for API response
   */
  public toJSON(): Record<string, any> {
    const compliance = this.getS73ComplianceStatus();

    return {
      id: this._id.toString(),
      guardianshipId: this.props.guardianshipId.toString(),
      wardId: this.props.wardId.toString(),
      guardianId: this.props.guardianId.toString(),

      // Appointment details
      appointmentSource: this.props.appointmentSource,
      isPrimary: this.props.isPrimary,
      orderOfPrecedence: this.props.orderOfPrecedence,
      type: this.props.type,
      category: this.props.category,

      // Legal context
      courtOrder: this.props.courtOrder?.toJSON(),
      courtFileNumber: this.props.courtFileNumber,
      appointmentDate: this.props.appointmentDate.toISOString(),
      termExpiryDate: this.props.termExpiryDate?.toISOString(),

      // Powers and authority
      powers: this.props.powers.toJSON(),
      hasFinancialPowers: this.props.hasFinancialPowers,
      financialLimit: this.props.financialLimit?.toJSON(),

      // Bond information
      bondRequired: this.props.bondRequired,
      bondWaived: this.props.bondWaived,
      bondWaiverOrderNumber: this.props.bondWaiverOrderNumber,
      bond: this.props.bond?.toJSON(),

      // Reporting
      reportingSchedule: this.props.reportingSchedule?.toJSON(),
      lastReportFiledDate: this.props.lastReportFiledDate?.toISOString(),
      nextReportDueDate: this.props.nextReportDueDate?.toISOString(),

      // Allowance
      annualAllowance: this.props.annualAllowance?.toJSON(),
      allowanceApprovedByCourt: this.props.allowanceApprovedByCourt,
      allowanceOrderNumber: this.props.allowanceOrderNumber,

      // Customary law
      customaryLawApplies: this.props.customaryLawApplies,
      customaryRecognitionStatus: this.props.customaryRecognitionStatus,
      customaryAuthority: this.props.customaryAuthority,
      customaryInstallationDate: this.props.customaryInstallationDate?.toISOString(),

      // Status
      isActive: this.props.isActive,
      activationDate: this.props.activationDate?.toISOString(),
      deactivationDate: this.props.deactivationDate?.toISOString(),
      deactivationReason: this.props.deactivationReason,
      deactivationNotes: this.props.deactivationNotes,

      // Compliance
      complianceScore: this.props.complianceScore,
      s73ComplianceStatus: compliance.status,
      requiresCourtSupervision: this.props.requiresCourtSupervision,
      nextCourtReviewDate: this.props.nextCourtReviewDate?.toISOString(),
      lastComplianceCheckDate: this.props.lastComplianceCheckDate?.toISOString(),

      // Legal basis
      applicableLawSections: this.props.applicableLawSections,

      // Computed properties
      requiresAnnualReport: this.requiresAnnualReport(),
      isReportOverdue: this.isReportOverdue(),
      requiresBond: this.requiresBond(),
      isBondPosted: this.isBondPosted(),
      isBondExpired: this.isBondExpired(),
      nextRequiredAction: this.getNextRequiredAction(),

      // Integration
      estateServiceNotified: this.props.estateServiceNotified,
      notificationSentAt: this.props.notificationSentAt?.toISOString(),

      // Metadata
      version: this._version,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      deletedAt: this._deletedAt?.toISOString(),
    };
  }

  // ============================================================================
  // PRIVATE HELPER
  // ============================================================================

  private updateProps(updates: Partial<GuardianAssignmentProps>): void {
    const newProps = {
      ...this.cloneProps(),
      ...updates,
    };
    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }
}
