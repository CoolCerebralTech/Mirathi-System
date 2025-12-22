// domain/entities/guardian.entity.ts
import { GuardianType } from '@prisma/client';

import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { AnnualReportFiledEvent } from '../events/guardianship-events/annual-report-filed.event';
import { GuardianAllowanceUpdatedEvent } from '../events/guardianship-events/guardian-allowance-updated.event';
import { GuardianAppointedEvent } from '../events/guardianship-events/guardian-appointed.event';
import { GuardianBondExpiredEvent } from '../events/guardianship-events/guardian-bond-expired.event';
import { GuardianBondPostedEvent } from '../events/guardianship-events/guardian-bond-posted.event';
import { GuardianPowersGrantedEvent } from '../events/guardianship-events/guardian-powers-granted.event';
import { GuardianshipTerminatedEvent } from '../events/guardianship-events/guardianship-terminated.event';
import { InvalidGuardianshipException } from '../exceptions/guardianship.exception';
import { KenyanMoney } from '../value-objects/financial/kenyan-money.vo';
// === VALUE OBJECTS ===
import { CourtOrder } from '../value-objects/legal/court-order.vo';
import { GuardianBond } from '../value-objects/legal/guardian-bond.vo';
import { GuardianPowers } from '../value-objects/legal/guardian-powers.vo';
import { ReportingSchedule } from '../value-objects/legal/reporting-schedule.vo';

/**
 * S.73 LSA Reporting Status
 * Tracks annual report compliance
 */
export enum GuardianReportStatus {
  PENDING = 'PENDING', // Not yet due
  DUE = 'DUE', // Due now
  SUBMITTED = 'SUBMITTED', // Awaiting court review
  APPROVED = 'APPROVED', // Court approved
  OVERDUE = 'OVERDUE', // Past deadline - non-compliant
  REJECTED = 'REJECTED', // Court rejected - resubmit required
}

/**
 * Guardianship Termination Reasons (Kenyan Legal Context)
 */
export enum TerminationReason {
  WARD_REACHED_MAJORITY = 'WARD_REACHED_MAJORITY', // Ward turned 18
  WARD_DECEASED = 'WARD_DECEASED', // Ward died
  GUARDIAN_DECEASED = 'GUARDIAN_DECEASED', // Guardian died
  GUARDIAN_INCAPACITATED = 'GUARDIAN_INCAPACITATED', // Guardian can't perform duties
  COURT_REMOVAL = 'COURT_REMOVAL', // Court removed for misconduct
  VOLUNTARY_RESIGNATION = 'VOLUNTARY_RESIGNATION', // Guardian resigned
  WARD_REGAINED_CAPACITY = 'WARD_REGAINED_CAPACITY', // Incapacitated ward recovered
  ADOPTION_FINALIZED = 'ADOPTION_FINALIZED', // Ward was adopted
  CUSTOMARY_TRANSFER = 'CUSTOMARY_TRANSFER', // Customary law transfer
}

/**
 * Guardian Entity Props (Immutable Snapshot)
 */
export interface GuardianProps {
  // === CORE IDENTITY ===
  wardId: UniqueEntityID; // The minor/incapacitated person
  guardianId: UniqueEntityID; // The appointed guardian
  guardianshipId?: UniqueEntityID; // Optional for backward compatibility

  // === LEGAL CLASSIFICATION ===
  type: GuardianType; // TESTAMENTARY | COURT_APPOINTED | NATURAL_PARENT

  // === COURT APPOINTMENT DETAILS ===
  courtOrder?: CourtOrder; // S.71 court order (if court-appointed)
  appointmentDate: Date; // When guardianship started
  validUntil?: Date; // Expiry date (if temporary)

  // === GUARDIAN POWERS (S.70 & S.71) ===
  powers: GuardianPowers; // What guardian can do

  // === S.72 LSA - GUARDIAN BOND ===
  bond?: GuardianBond; // Security for property management
  bondRequired: boolean; // Track if bond is required

  // === S.73 LSA - ANNUAL REPORTING ===
  reportingSchedule?: ReportingSchedule; // When reports are due

  // === FINANCIAL ALLOWANCE ===
  annualAllowance?: KenyanMoney; // Guardian's compensation
  allowanceApprovedBy?: UniqueEntityID; // Who approved allowance

  // === STATUS ===
  isActive: boolean;
  terminationDate?: Date;
  terminationReason?: TerminationReason;

  // === CUSTOMARY LAW SUPPORT ===
  customaryLawApplies: boolean; // Is this under customary law?
  customaryDetails?: CustomaryGuardianshipDetails;
}

/**
 * Customary Law Guardianship Details
 * (Extensible for different Kenyan communities)
 */
export interface CustomaryGuardianshipDetails {
  ethnicGroup: string; // e.g., "KIKUYU", "LUO", "KALENJIN"
  customaryAuthority: string; // e.g., "Council of Elders"
  ceremonyDate?: Date; // When customary ceremony happened
  witnessNames?: string[]; // Community witnesses
  specialConditions?: Record<string, any>; // Community-specific rules
}

/**
 * Props for Creating Guardian
 */
export interface CreateGuardianProps {
  wardId: string;
  guardianId: string;
  guardianshipId: string;
  type: GuardianType;
  appointmentDate: Date;

  // Optional legal details
  courtOrderNumber?: string;
  courtStation?: string;
  validUntil?: Date;

  // Powers (defaults to minimal)
  hasPropertyManagementPowers?: boolean;
  canConsentToMedical?: boolean;
  canConsentToMarriage?: boolean;
  restrictions?: string[];
  specialInstructions?: string;

  // S.72 Bond
  bondRequired?: boolean;
  bondAmountKES?: number;

  // Allowance
  annualAllowanceKES?: number;

  // Customary law
  customaryLawApplies?: boolean;
  customaryDetails?: CustomaryGuardianshipDetails;
}

/**
 * GUARDIAN ENTITY
 *
 * Represents a legal guardian under S.70-73 Law of Succession Act (Kenya)
 *
 * LEGAL RESPONSIBILITIES:
 * - S.70: Testamentary guardians appointed by will
 * - S.71: Court-appointed guardians for minors/incapacitated
 * - S.72: Guardian must post bond if managing property
 * - S.73: Annual accounts and reporting to court
 *
 * AGGREGATE BOUNDARIES:
 * - Guardian is an ENTITY (not aggregate root)
 * - Belongs to Guardianship Aggregate
 * - Cannot exist independently of Guardianship
 *
 * INVARIANTS:
 * - Guardian cannot be same person as ward
 * - Court-appointed guardians MUST have court order
 * - Property management requires bond posting (S.72)
 * - Active guardians with property powers MUST file annual reports (S.73)
 * - Bond must be valid (not expired) for property management
 */
export class Guardian extends Entity<GuardianProps> {
  private constructor(id: UniqueEntityID, props: GuardianProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /**
   * Create new Guardian (first-time appointment)
   */
  public static create(props: CreateGuardianProps): Guardian {
    const id = new UniqueEntityID();
    const wardId = new UniqueEntityID(props.wardId);
    const guardianId = new UniqueEntityID(props.guardianId);
    const guardianshipId = new UniqueEntityID(props.guardianshipId);

    // Build court order if provided
    let courtOrder: CourtOrder | undefined;
    if (props.courtOrderNumber && props.courtStation) {
      courtOrder = CourtOrder.create({
        orderNumber: props.courtOrderNumber,
        courtStation: props.courtStation,
        orderDate: props.appointmentDate,
      });
    }

    // Build guardian powers
    const powers = GuardianPowers.create({
      hasPropertyManagementPowers: props.hasPropertyManagementPowers ?? false,
      canConsentToMedical: props.canConsentToMedical ?? true,
      canConsentToMarriage: props.canConsentToMarriage ?? false,
      restrictions: props.restrictions ?? [],
      specialInstructions: props.specialInstructions,
    });

    // Build reporting schedule (1 year from appointment)
    let reportingSchedule: ReportingSchedule | undefined;
    if (powers.hasPropertyManagementPowers) {
      reportingSchedule = ReportingSchedule.create({
        firstReportDue: this.calculateNextReportDate(props.appointmentDate),
        frequency: 'ANNUAL',
        status: GuardianReportStatus.PENDING,
      });
    }

    // Build allowance if provided
    let annualAllowance: KenyanMoney | undefined;
    if (props.annualAllowanceKES) {
      annualAllowance = KenyanMoney.create(props.annualAllowanceKES);
    }

    const guardian = new Guardian(id, {
      wardId,
      guardianId,
      guardianshipId,
      type: props.type,
      courtOrder,
      appointmentDate: props.appointmentDate,
      validUntil: props.validUntil,
      powers,
      reportingSchedule,
      annualAllowance,
      isActive: true,
      customaryLawApplies: props.customaryLawApplies ?? false,
      customaryDetails: props.customaryDetails,
      bondRequired: props.bondRequired ?? false,
    });
    // Post bond immediately if required and details are provided
    if (
      props.bondRequired &&
      props.bondAmountKES &&
      powers.hasPropertyManagementPowers // Only post bond if they have property management powers
    ) {
      // Use default provider or get from props
      const bondProvider = 'COURT_APPROVED_INSURER'; // Should come from props in real implementation
      const bondPolicyNumber = `BOND-${id.toString().slice(0, 8)}`; // Generate policy number

      // Calculate expiry date (typically 1 year from appointment)
      const bondExpiryDate = new Date(props.appointmentDate);
      bondExpiryDate.setFullYear(bondExpiryDate.getFullYear() + 1);

      try {
        guardian.postBond({
          provider: bondProvider,
          policyNumber: bondPolicyNumber,
          amountKES: props.bondAmountKES,
          expiryDate: bondExpiryDate,
        });
      } catch (error) {
        // Log error but don't fail guardian creation
        console.warn(`Could not post bond during guardian creation: ${error.message}`);
      }
    }

    // Emit domain event
    guardian.addDomainEvent(
      new GuardianAppointedEvent(id.toString(), 'Guardian', 1, {
        wardId: props.wardId,
        guardianId: props.guardianId,
        type: props.type,
        courtOrderNumber: props.courtOrderNumber,
        appointmentDate: props.appointmentDate,
        customaryLawApplies: props.customaryLawApplies ?? false,
      }),
    );

    return guardian;
  }

  /**
   * Reconstitute from database (existing guardian)
   */
  public static fromPersistence(id: string, props: GuardianProps, createdAt: Date): Guardian {
    return new Guardian(new UniqueEntityID(id), props, createdAt);
  }

  // ============================================================================
  // DOMAIN LOGIC - S.72 BOND POSTING
  // ============================================================================

  /**
   * Post Guardian Bond (S.72 LSA Requirement)
   *
   * LEGAL REQUIREMENT:
   * "Every person appointed as guardian of the estate of a minor
   * shall give security by bond with sufficient sureties"
   *
   * @throws InvalidGuardianshipException if bond not required or already posted
   */
  public postBond(params: {
    provider: string;
    policyNumber: string;
    amountKES: number;
    expiryDate: Date;
  }): void {
    this.ensureNotDeleted();

    // Validation
    if (!this.requiresBond()) {
      throw new InvalidGuardianshipException(
        'Bond is not required for this guardianship (no property management powers).',
      );
    }

    if (this.isBondPosted()) {
      throw new InvalidGuardianshipException('Bond already posted. Use renewBond() to extend.');
    }

    if (params.expiryDate <= new Date()) {
      throw new InvalidGuardianshipException('Bond expiry date must be in the future.');
    }

    // Create bond value object
    const bond = GuardianBond.create({
      provider: params.provider,
      policyNumber: params.policyNumber,
      amount: KenyanMoney.create(params.amountKES),
      issuedDate: new Date(),
      expiryDate: params.expiryDate,
    });

    // Update props (create new immutable version)
    const newProps = {
      ...this.cloneProps(),
      bond,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    // Emit event
    this.addDomainEvent(
      new GuardianBondPostedEvent(this._id.toString(), 'Guardian', this._version, {
        guardianshipId: this._id.toString(),
        amount: params.amountKES,
        provider: params.provider,
        policyNumber: params.policyNumber,
        expiryDate: params.expiryDate,
      }),
    );
  }

  /**
   * Renew Bond (before expiry)
   */
  public renewBond(newExpiryDate: Date, newPolicyNumber?: string): void {
    this.ensureNotDeleted();

    if (!this.isBondPosted()) {
      throw new InvalidGuardianshipException('No bond to renew. Use postBond() first.');
    }

    if (newExpiryDate <= new Date()) {
      throw new InvalidGuardianshipException('New expiry date must be in the future.');
    }

    const currentBond = this.props.bond!;
    const renewedBond = currentBond.renew(newExpiryDate, newPolicyNumber);

    const newProps = {
      ...this.cloneProps(),
      bond: renewedBond,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  /**
   * Check if bond has expired (and emit event if needed)
   */
  public checkBondExpiry(): void {
    if (!this.isBondPosted()) return;

    const bond = this.props.bond!;
    if (bond.isExpired() && this.props.isActive) {
      // Emit warning event
      this.addDomainEvent(
        new GuardianBondExpiredEvent(this._id.toString(), 'Guardian', this._version, {
          guardianshipId: this._id.toString(),
          bondProvider: bond.provider,
          bondPolicyNumber: bond.policyNumber,
          expiryDate: bond.expiryDate,
        }),
      );

      // If property management powers, they should be suspended
      // (handled at aggregate level)
    }
  }

  // ============================================================================
  // DOMAIN LOGIC - S.73 ANNUAL REPORTING
  // ============================================================================

  /**
   * File Annual Report (S.73 LSA Requirement)
   *
   * LEGAL REQUIREMENT:
   * "Every guardian shall within 60 days after expiration of each year
   * render to the court full and accurate accounts"
   */
  public fileAnnualReport(params: {
    reportDate: Date;
    summary: string;
    financialStatement?: Record<string, any>;
    approvedBy?: string;
  }): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Cannot file report for inactive guardianship.');
    }

    if (!this.requiresAnnualReport()) {
      throw new InvalidGuardianshipException(
        'Annual reports not required (no property management powers).',
      );
    }

    const schedule = this.props.reportingSchedule!;
    const updatedSchedule = schedule.fileReport(
      params.reportDate,
      params.approvedBy ? GuardianReportStatus.APPROVED : GuardianReportStatus.SUBMITTED,
    );

    const newProps = {
      ...this.cloneProps(),
      reportingSchedule: updatedSchedule,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new AnnualReportFiledEvent(this._id.toString(), 'Guardian', this._version, {
        guardianshipId: this._id.toString(),
        reportDate: params.reportDate,
        summary: params.summary,
        nextReportDue: updatedSchedule.nextReportDue,
        approvedBy: params.approvedBy,
        financialStatement: params.financialStatement,
      }),
    );
  }

  // ============================================================================
  // DOMAIN LOGIC - POWERS MANAGEMENT
  // ============================================================================

  /**
   * Grant Property Management Powers
   *
   * LEGAL REQUIREMENT: S.72 Bond must be posted first
   */
  public grantPropertyManagementPowers(params: {
    courtOrderNumber?: string;
    restrictions?: string[];
  }): void {
    this.ensureNotDeleted();

    if (this.props.powers.hasPropertyManagementPowers) {
      throw new InvalidGuardianshipException('Guardian already has property management powers.');
    }

    // S.72 Validation: Bond must be posted
    if (this.requiresBond() && !this.isBondPosted()) {
      throw new InvalidGuardianshipException(
        'Cannot grant property management powers until S.72 Bond is posted.',
      );
    }

    // Ensure bond is not expired
    if (this.isBondPosted() && this.props.bond!.isExpired()) {
      throw new InvalidGuardianshipException(
        'Cannot grant property management powers - bond has expired.',
      );
    }

    const updatedPowers = this.props.powers.grantPropertyManagement(params.restrictions);

    // Create reporting schedule (now required)
    const reportingSchedule = ReportingSchedule.create({
      firstReportDue: Guardian.calculateNextReportDate(new Date()),
      frequency: 'ANNUAL',
      status: GuardianReportStatus.PENDING,
    });

    // Update court order if provided
    let courtOrder = this.props.courtOrder;
    if (params.courtOrderNumber) {
      courtOrder = CourtOrder.create({
        orderNumber: params.courtOrderNumber,
        courtStation: courtOrder?.courtStation ?? 'Unknown',
        orderDate: new Date(),
      });
    }

    const newProps = {
      ...this.cloneProps(),
      powers: updatedPowers,
      reportingSchedule,
      courtOrder,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new GuardianPowersGrantedEvent(this._id.toString(), 'Guardian', this._version, {
        guardianshipId: this._id.toString(),
        powerType: 'PROPERTY_MANAGEMENT',
        courtOrderNumber: params.courtOrderNumber,
        restrictions: params.restrictions,
      }),
    );
  }

  /**
   * Update Guardian Restrictions
   */
  public updateRestrictions(restrictions: string[]): void {
    this.ensureNotDeleted();

    const updatedPowers = this.props.powers.updateRestrictions(restrictions);

    const newProps = {
      ...this.cloneProps(),
      powers: updatedPowers,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  // ============================================================================
  // DOMAIN LOGIC - TERMINATION
  // ============================================================================

  /**
   * Terminate Guardianship
   *
   * REASONS:
   * - Ward reached majority (18 years)
   * - Ward deceased
   * - Guardian deceased/incapacitated
   * - Court removal for misconduct
   * - Voluntary resignation
   */
  public terminate(reason: TerminationReason, terminationDate: Date): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Guardianship is already terminated.');
    }

    const newProps = {
      ...this.cloneProps(),
      isActive: false,
      terminationDate,
      terminationReason: reason,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new GuardianshipTerminatedEvent(this._id.toString(), 'Guardian', this._version, {
        guardianshipId: this._id.toString(),
        wardId: this.props.wardId.toString(),
        guardianId: this.props.guardianId.toString(),
        reason,
        terminationDate,
      }),
    );
  }

  // ============================================================================
  // DOMAIN LOGIC - ALLOWANCE MANAGEMENT
  // ============================================================================

  /**
   * Update Annual Allowance (Court-approved)
   */
  public updateAllowance(amountKES: number, approvedBy: string): void {
    this.ensureNotDeleted();

    if (amountKES < 0) {
      throw new InvalidGuardianshipException('Allowance amount cannot be negative.');
    }

    const newProps = {
      ...this.cloneProps(),
      annualAllowance: KenyanMoney.create(amountKES),
      allowanceApprovedBy: new UniqueEntityID(approvedBy),
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new GuardianAllowanceUpdatedEvent(this._id.toString(), 'Guardian', this._version, {
        guardianshipId: this._id.toString(),
        newAmount: amountKES,
        approvedBy,
      }),
    );
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  private validate(): void {
    // Cannot be own guardian
    if (this.props.wardId.equals(this.props.guardianId)) {
      throw new InvalidGuardianshipException('A person cannot be their own guardian.');
    }

    // Court-appointed must have court order
    if (this.props.type === GuardianType.COURT_APPOINTED && !this.props.courtOrder) {
      console.warn(
        `Guardian ${this._id.toString()}: Court-appointed guardian should have court order`,
      );
    }

    // Property powers require bond
    if (
      this.props.powers.hasPropertyManagementPowers &&
      this.requiresBond() &&
      !this.isBondPosted()
    ) {
      console.warn(
        `Guardian ${this._id.toString()}: Property management requires S.72 bond posting`,
      );
    }

    // Valid until must be after appointment
    if (this.props.validUntil && this.props.validUntil <= this.props.appointmentDate) {
      throw new InvalidGuardianshipException('Valid until date must be after appointment date.');
    }
  }

  // ============================================================================
  // QUERY METHODS (GETTERS)
  // ============================================================================

  get wardId(): UniqueEntityID {
    return this.props.wardId;
  }

  get guardianId(): UniqueEntityID {
    return this.props.guardianId;
  }

  get type(): GuardianType {
    return this.props.type;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get appointmentDate(): Date {
    return this.props.appointmentDate;
  }

  get terminationDate(): Date | undefined {
    return this.props.terminationDate;
  }

  get terminationReason(): TerminationReason | undefined {
    return this.props.terminationReason;
  }

  /**
   * Check if bond posting is required
   * (Required if has property management powers)
   */
  public requiresBond(): boolean {
    return this.props.bondRequired && this.props.powers.hasPropertyManagementPowers;
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
    return this.props.isActive && this.props.powers.hasPropertyManagementPowers;
  }

  /**
   * Check if report is overdue
   */
  public isReportOverdue(): boolean {
    if (!this.props.reportingSchedule) return false;
    return this.props.reportingSchedule.isOverdue();
  }

  /**
   * Get S.73 compliance status
   */
  public getS73ComplianceStatus(): 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_REQUIRED' {
    if (!this.requiresAnnualReport()) return 'NOT_REQUIRED';

    if (!this.props.reportingSchedule) return 'NON_COMPLIANT';

    if (this.props.reportingSchedule.isOverdue()) return 'NON_COMPLIANT';

    const status = this.props.reportingSchedule.status;
    if (status === GuardianReportStatus.APPROVED || status === GuardianReportStatus.SUBMITTED) {
      return 'COMPLIANT';
    }

    return 'NON_COMPLIANT';
  }

  /**
   * Check if guardianship term has expired
   */
  public isTermExpired(): boolean {
    if (!this.props.validUntil) return false;
    return new Date() > this.props.validUntil;
  }

  /**
   * Get powers (read-only)
   */
  public getPowers(): GuardianPowers {
    return this.props.powers;
  }

  /**
   * Get bond details (if posted)
   */
  public getBond(): GuardianBond | undefined {
    return this.props.bond;
  }

  /**
   * Get reporting schedule (if required)
   */
  public getReportingSchedule(): ReportingSchedule | undefined {
    return this.props.reportingSchedule;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate next annual report due date
   * (1 year from given date)
   */
  private static calculateNextReportDate(fromDate: Date): Date {
    const nextDate = new Date(fromDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    return nextDate;
  }

  /**
   * Serialize to JSON for API responses
   */
  public toJSON(): Record<string, any> {
    return {
      id: this._id.toString(),
      wardId: this.props.wardId.toString(),
      guardianId: this.props.guardianId.toString(),
      type: this.props.type,
      courtOrder: this.props.courtOrder?.toJSON(),
      appointmentDate: this.props.appointmentDate.toISOString(),
      validUntil: this.props.validUntil?.toISOString(),
      powers: this.props.powers.toJSON(),
      bond: this.props.bond?.toJSON(),
      reportingSchedule: this.props.reportingSchedule?.toJSON(),
      annualAllowance: this.props.annualAllowance?.toJSON(),
      allowanceApprovedBy: this.props.allowanceApprovedBy?.toString(),
      isActive: this.props.isActive,
      terminationDate: this.props.terminationDate?.toISOString(),
      terminationReason: this.props.terminationReason,
      customaryLawApplies: this.props.customaryLawApplies,
      customaryDetails: this.props.customaryDetails,

      // Computed properties
      requiresBond: this.requiresBond(),
      isBondPosted: this.isBondPosted(),
      isBondExpired: this.isBondExpired(),
      requiresAnnualReport: this.requiresAnnualReport(),
      isReportOverdue: this.isReportOverdue(),
      isTermExpired: this.isTermExpired(),
      s73ComplianceStatus: this.getS73ComplianceStatus(),

      // Metadata
      version: this._version,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      deletedAt: this._deletedAt?.toISOString(),
    };
  }
}
