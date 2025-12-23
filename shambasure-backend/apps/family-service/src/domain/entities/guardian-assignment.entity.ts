// domain/entities/guardian-assignment.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { InvalidGuardianshipException } from '../exceptions/guardianship.exception';
import { KenyanMoney } from '../value-objects/financial/kenyan-money.vo';
import { GuardianBond } from '../value-objects/legal/guardian-bond.vo';
import { GuardianPowers } from '../value-objects/legal/guardian-powers.vo';

/**
 * Guardian Assignment Entity Props
 * Represents a specific guardian's role within a guardianship
 */
export interface GuardianAssignmentProps {
  // === CORE IDENTITY ===
  guardianId: UniqueEntityID; // The FamilyMember ID of the guardian
  isPrimary: boolean; // Is this the primary guardian?

  // === ROLE DETAILS ===
  appointmentDate: Date; // When this guardian was appointed
  appointmentSource: GuardianAppointmentSource; // How they were appointed

  // === POWERS (Children Act) ===
  powers: GuardianPowers; // What this guardian can do

  // === BONDING (S.72 LSA requirement for guardians of property) ===
  bondRequired: boolean; // If false, Estate Service appoints Trustee
  bond?: GuardianBond; // Document ID

  // === FINANCIAL ALLOWANCE ===
  annualAllowance?: KenyanMoney; // Guardian's compensation
  allowanceApprovedBy?: UniqueEntityID; // Who approved allowance

  // === STATUS ===
  isActive: boolean;
  removedDate?: Date;
  removalReason?: string;

  // === RESTRICTIONS ===
  restrictions?: string[]; // Court-imposed restrictions
}

/**
 * Guardian Appointment Source (Kenyan Legal Context)
 */
export enum GuardianAppointmentSource {
  FAMILY = 'FAMILY', // Appointed by family/elders
  COURT = 'COURT', // Appointed by Children's Court
  WILL = 'WILL', // Appointed by deceased parent's will (S.70 LSA)
  CUSTOMARY_LAW = 'CUSTOMARY_LAW', // Recognized by clan elders
}

/**
 * Props for Creating Guardian Assignment
 */
export interface CreateGuardianAssignmentProps {
  guardianId: string;
  isPrimary?: boolean;
  appointmentSource: GuardianAppointmentSource;

  // Powers (defaults to minimal)
  hasPropertyManagementPowers?: boolean;
  canConsentToMedical?: boolean;
  canConsentToMarriage?: boolean;
  restrictions?: string[];
  specialInstructions?: string;

  // Bond
  bondRequired?: boolean;
  bondAmountKES?: number;
  bondProvider?: string;
  bondPolicyNumber?: string;
  bondExpiryDate?: Date;

  // Allowance
  annualAllowanceKES?: number;
  allowanceApprovedBy?: string;
}

/**
 * GUARDIAN ASSIGNMENT ENTITY
 *
 * Represents a specific guardian's role within a Guardianship aggregate
 * under Kenyan Children Act and S.70-73 Law of Succession Act
 *
 * IMPORTANT: This is an ENTITY, not an Aggregate Root
 * It belongs to the Guardianship aggregate and cannot exist independently
 *
 * LEGAL BASIS:
 * - Children Act: Legal authority and care responsibility
 * - S.70 LSA: Testamentary guardians appointed by will
 * - S.71 LSA: Court-appointed guardians for minors/incapacitated
 * - S.72 LSA: Guardian must post bond if managing property
 *
 * INVARIANTS (Enforced by Guardianship Aggregate):
 * - Guardian must be an adult (18+ years)
 * - Guardian cannot be the ward themselves
 * - Property management requires bond posting (S.72)
 * - Only one primary guardian per active guardianship
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
   */
  public static create(props: CreateGuardianAssignmentProps): GuardianAssignment {
    const id = new UniqueEntityID();
    const guardianId = new UniqueEntityID(props.guardianId);

    // Build guardian powers
    const powers = GuardianPowers.create({
      hasPropertyManagementPowers: props.hasPropertyManagementPowers ?? false,
      canConsentToMedical: props.canConsentToMedical ?? true,
      canConsentToMarriage: props.canConsentToMarriage ?? false,
      restrictions: props.restrictions ?? [],
      specialInstructions: props.specialInstructions,
    });

    // Build bond if required and details provided
    let bond: GuardianBond | undefined;
    if (
      props.bondRequired &&
      props.bondAmountKES &&
      props.bondProvider &&
      props.bondPolicyNumber &&
      props.bondExpiryDate &&
      powers.hasPropertyManagementPowers
    ) {
      bond = GuardianBond.create({
        provider: props.bondProvider,
        policyNumber: props.bondPolicyNumber,
        amount: KenyanMoney.create(props.bondAmountKES),
        issuedDate: new Date(),
        expiryDate: props.bondExpiryDate,
      });
    }

    // Build allowance if provided
    let annualAllowance: KenyanMoney | undefined;
    let allowanceApprovedBy: UniqueEntityID | undefined;

    if (props.annualAllowanceKES) {
      annualAllowance = KenyanMoney.create(props.annualAllowanceKES);
      if (props.allowanceApprovedBy) {
        allowanceApprovedBy = new UniqueEntityID(props.allowanceApprovedBy);
      }
    }

    return new GuardianAssignment(id, {
      guardianId,
      isPrimary: props.isPrimary ?? false,
      appointmentDate: new Date(),
      appointmentSource: props.appointmentSource,
      powers,
      bondRequired: props.bondRequired ?? false,
      bond,
      annualAllowance,
      allowanceApprovedBy,
      isActive: true,
      restrictions: props.restrictions,
    });
  }

  /**
   * Reconstitute from database (existing guardian assignment)
   */
  public static fromPersistence(
    id: string,
    props: GuardianAssignmentProps,
    createdAt: Date,
  ): GuardianAssignment {
    return new GuardianAssignment(new UniqueEntityID(id), props, createdAt);
  }

  // ============================================================================
  // DOMAIN LOGIC - BOND MANAGEMENT (S.72 LSA)
  // ============================================================================

  /**
   * Post Guardian Bond (S.72 LSA Requirement)
   * Required if guardian has property management powers
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

    // Update props
    const newProps = {
      ...this.cloneProps(),
      bond,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
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

  // ============================================================================
  // DOMAIN LOGIC - POWERS MANAGEMENT
  // ============================================================================

  /**
   * Grant Property Management Powers
   *
   * LEGAL REQUIREMENT: S.72 Bond must be posted if managing property
   */
  public grantPropertyManagementPowers(restrictions?: string[]): void {
    this.ensureNotDeleted();

    if (this.props.powers.hasPropertyManagementPowers) {
      throw new InvalidGuardianshipException('Guardian already has property management powers.');
    }

    const updatedPowers = this.props.powers.grantPropertyManagement(restrictions);

    // Update props
    const newProps = {
      ...this.cloneProps(),
      powers: updatedPowers,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  /**
   * Update Guardian Restrictions (court-imposed)
   */
  public updateRestrictions(restrictions: string[]): void {
    this.ensureNotDeleted();

    const updatedPowers = this.props.powers.updateRestrictions(restrictions);

    const newProps = {
      ...this.cloneProps(),
      powers: updatedPowers,
      restrictions,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
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
  }

  // ============================================================================
  // DOMAIN LOGIC - STATUS MANAGEMENT
  // ============================================================================

  /**
   * Deactivate Guardian Assignment
   */
  public deactivate(removalReason: string): void {
    this.ensureNotDeleted();

    if (!this.props.isActive) {
      throw new InvalidGuardianshipException('Guardian assignment is already inactive.');
    }

    const newProps = {
      ...this.cloneProps(),
      isActive: false,
      removedDate: new Date(),
      removalReason,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  /**
   * Reactivate Guardian Assignment (with court approval)
   */
  public reactivate(): void {
    this.ensureNotDeleted();

    if (this.props.isActive) {
      throw new InvalidGuardianshipException('Guardian assignment is already active.');
    }

    const newProps = {
      ...this.cloneProps(),
      isActive: true,
      removedDate: undefined,
      removalReason: undefined,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  private validate(): void {
    // Property management powers require bond if bondRequired is true
    if (
      this.props.powers.hasPropertyManagementPowers &&
      this.props.bondRequired &&
      !this.props.bond
    ) {
      console.warn(
        `Guardian Assignment ${this._id.toString()}: Property management requires S.72 bond posting`,
      );
    }

    // Bond expiry check
    if (this.props.bond && this.props.bond.isExpired()) {
      console.warn(`Guardian Assignment ${this._id.toString()}: Bond has expired`);
    }
  }

  // ============================================================================
  // QUERY METHODS (GETTERS)
  // ============================================================================

  get guardianId(): UniqueEntityID {
    return this.props.guardianId;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get appointmentDate(): Date {
    return this.props.appointmentDate;
  }

  get appointmentSource(): GuardianAppointmentSource {
    return this.props.appointmentSource;
  }

  get removedDate(): Date | undefined {
    return this.props.removedDate;
  }

  get removalReason(): string | undefined {
    return this.props.removalReason;
  }

  /**
   * Check if bond posting is required
   * (Required if has property management powers AND bondRequired is true)
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
   * Check if guardian can manage property
   * (And if bond is valid if required)
   */
  public canManageProperty(): boolean {
    if (!this.props.powers.hasPropertyManagementPowers) return false;

    if (this.props.bondRequired) {
      return this.isBondPosted() && !this.isBondExpired();
    }

    return true;
  }

  /**
   * Check if guardian can consent to medical treatment
   */
  public canConsentToMedical(): boolean {
    return this.props.powers.canConsentToMedical;
  }

  /**
   * Check if guardian can consent to marriage (for wards 16-18 with court permission)
   */
  public canConsentToMarriage(): boolean {
    return this.props.powers.canConsentToMarriage;
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
   * Get annual allowance
   */
  public getAnnualAllowance(): KenyanMoney | undefined {
    return this.props.annualAllowance;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Serialize to JSON for API responses
   */
  public toJSON(): Record<string, any> {
    return {
      id: this._id.toString(),
      guardianId: this.props.guardianId.toString(),
      isPrimary: this.props.isPrimary,
      appointmentDate: this.props.appointmentDate.toISOString(),
      appointmentSource: this.props.appointmentSource,
      powers: this.props.powers.toJSON(),
      bondRequired: this.props.bondRequired,
      bond: this.props.bond?.toJSON(),
      annualAllowance: this.props.annualAllowance?.toJSON(),
      allowanceApprovedBy: this.props.allowanceApprovedBy?.toString(),
      isActive: this.props.isActive,
      removedDate: this.props.removedDate?.toISOString(),
      removalReason: this.props.removalReason,
      restrictions: this.props.restrictions,

      // Computed properties
      requiresBond: this.requiresBond(),
      isBondPosted: this.isBondPosted(),
      isBondExpired: this.isBondExpired(),
      canManageProperty: this.canManageProperty(),
      canConsentToMedical: this.canConsentToMedical(),
      canConsentToMarriage: this.canConsentToMarriage(),

      // Metadata
      version: this._version,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      deletedAt: this._deletedAt?.toISOString(),
    };
  }
}
