// domain/entities/executor-nomination.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { ExecutorPowers } from '../value-objects/executor-powers.vo';

/**
 * Executor Nomination Entity
 *
 * Kenyan Legal Context - Section 83 LSA:
 * "An executor or administrator shall have the following powers and duties..."
 *
 * IMPORTANT DISTINCTION:
 * - This is a NOMINATION (testator's intention)
 * - NOT yet an appointment (requires Grant of Probate from court)
 * - The nominated person must accept the role
 * - Court may reject unsuitable nominees
 *
 * ENTITY RESPONSIBILITIES:
 * - Record testator's nomination
 * - Define powers granted to executor
 * - Track acceptance/declination
 * - Enforce priority (primary vs alternate)
 * - Validate executor eligibility
 *
 * Owned by: Will Aggregate
 */

export enum ExecutorStatus {
  NOMINATED = 'NOMINATED', // Testator has nominated them
  NOTIFIED = 'NOTIFIED', // Nominee has been notified
  ACCEPTED = 'ACCEPTED', // Nominee accepted the role
  DECLINED = 'DECLINED', // Nominee declined
  REMOVED = 'REMOVED', // Testator removed them
  APPOINTED = 'APPOINTED', // Court granted probate (succession-service tracks this)
}

export enum ExecutorPriority {
  PRIMARY = 'PRIMARY', // First choice
  ALTERNATE = 'ALTERNATE', // Backup if primary declines/unable
  CO_EXECUTOR = 'CO_EXECUTOR', // Joint executor (acts with others)
}

interface ExecutorNominationProps {
  willId: string;

  // Identity
  executorId?: string; // User ID if registered
  fullName: string;
  nationalId?: string;
  email?: string;
  phoneNumber?: string;

  // Nomination details
  priority: ExecutorPriority;
  isPrimary: boolean; // Shorthand for priority === PRIMARY
  orderNumber: number; // 1st executor, 2nd executor, etc.

  // Powers granted by testator
  powers: ExecutorPowers;

  // Status
  status: ExecutorStatus;
  nominatedAt: Date;
  notifiedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  removedAt?: Date;

  // Declination
  declinationReason?: string;

  // Removal
  removalReason?: string;

  // Eligibility checks
  isLegallyEligible: boolean;
  ineligibilityReason?: string;

  // Address (for legal notices)
  physicalAddress?: string;
  county?: string;

  // Relationship to testator
  relationshipToTestator?: string;

  // Professional status (if lawyer/trust company)
  isProfessional: boolean;
  professionalLicenseNumber?: string;
  licenseIssuingBody?: string;
}

export class ExecutorNomination extends Entity<ExecutorNominationProps> {
  private constructor(id: UniqueEntityID, props: ExecutorNominationProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // Factory: Create new nomination
  public static create(
    willId: string,
    fullName: string,
    priority: ExecutorPriority,
    orderNumber: number,
    powers: ExecutorPowers,
    executorId?: string,
    nationalId?: string,
  ): ExecutorNomination {
    const id = new UniqueEntityID();

    const props: ExecutorNominationProps = {
      willId,
      executorId,
      fullName,
      nationalId,
      priority,
      isPrimary: priority === ExecutorPriority.PRIMARY,
      orderNumber,
      powers,
      status: ExecutorStatus.NOMINATED,
      nominatedAt: new Date(),
      isLegallyEligible: true, // Default, can be updated
      isProfessional: false,
    };

    return new ExecutorNomination(id, props);
  }

  // Factory: Reconstitute from persistence
  public static reconstitute(
    id: string,
    props: ExecutorNominationProps,
    createdAt: Date,
    updatedAt: Date,
  ): ExecutorNomination {
    const nomination = new ExecutorNomination(new UniqueEntityID(id), props, createdAt);
    (nomination as any)._updatedAt = updatedAt;
    return nomination;
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get willId(): string {
    return this.props.willId;
  }

  get executorId(): string | undefined {
    return this.props.executorId;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get nationalId(): string | undefined {
    return this.props.nationalId;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get priority(): ExecutorPriority {
    return this.props.priority;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get orderNumber(): number {
    return this.props.orderNumber;
  }

  get powers(): ExecutorPowers {
    return this.props.powers;
  }

  get status(): ExecutorStatus {
    return this.props.status;
  }

  get isLegallyEligible(): boolean {
    return this.props.isLegallyEligible;
  }

  get ineligibilityReason(): string | undefined {
    return this.props.ineligibilityReason;
  }

  get declinationReason(): string | undefined {
    return this.props.declinationReason;
  }

  get relationshipToTestator(): string | undefined {
    return this.props.relationshipToTestator;
  }

  // =========================================================================
  // BUSINESS LOGIC - ELIGIBILITY
  // =========================================================================

  /**
   * Check if nominee is eligible to serve as executor
   *
   * Kenyan law requirements:
   * - Must be 18+ years old
   * - Must be of sound mind
   * - Cannot be an undischarged bankrupt
   * - Cannot have serious criminal convictions
   */
  public checkEligibility(params: {
    isAdult: boolean;
    hasMentalCapacity: boolean;
    isBankrupt: boolean;
    hasCriminalRecord: boolean;
  }): void {
    this.ensureNotDeleted();

    let eligible = true;
    const reasons: string[] = [];

    if (!params.isAdult) {
      eligible = false;
      reasons.push('Executor must be 18 years or older');
    }

    if (!params.hasMentalCapacity) {
      eligible = false;
      reasons.push('Executor must be of sound mind');
    }

    if (params.isBankrupt) {
      eligible = false;
      reasons.push('Undischarged bankrupt cannot serve as executor');
    }

    if (params.hasCriminalRecord) {
      eligible = false;
      reasons.push('Person with serious criminal conviction cannot serve as executor');
    }

    (this.props as any).isLegallyEligible = eligible;
    (this.props as any).ineligibilityReason = reasons.length > 0 ? reasons.join('; ') : undefined;

    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - NOTIFICATION & ACCEPTANCE
  // =========================================================================

  /**
   * Notify the nominee of their nomination
   */
  public notify(): void {
    this.ensureNotDeleted();

    if (this.status !== ExecutorStatus.NOMINATED) {
      throw new Error('Can only notify nominees in NOMINATED status');
    }

    if (!this.props.isLegallyEligible) {
      throw new Error(`Cannot notify ineligible nominee: ${this.props.ineligibilityReason}`);
    }

    (this.props as any).status = ExecutorStatus.NOTIFIED;
    (this.props as any).notifiedAt = new Date();
    this.incrementVersion();
  }

  /**
   * Nominee accepts the executorship
   */
  public accept(): void {
    this.ensureNotDeleted();

    if (this.status !== ExecutorStatus.NOTIFIED) {
      throw new Error('Can only accept from NOTIFIED status');
    }

    if (!this.props.isLegallyEligible) {
      throw new Error(`Ineligible nominee cannot accept: ${this.props.ineligibilityReason}`);
    }

    (this.props as any).status = ExecutorStatus.ACCEPTED;
    (this.props as any).acceptedAt = new Date();
    this.incrementVersion();
  }

  /**
   * Nominee declines the executorship
   */
  public decline(reason?: string): void {
    this.ensureNotDeleted();

    if (this.status === ExecutorStatus.DECLINED) {
      throw new Error('Nomination already declined');
    }

    if (this.status === ExecutorStatus.REMOVED) {
      throw new Error('Cannot decline after removal');
    }

    (this.props as any).status = ExecutorStatus.DECLINED;
    (this.props as any).declinedAt = new Date();
    (this.props as any).declinationReason = reason;
    this.incrementVersion();
  }

  /**
   * Testator removes the nomination (while will is still draft)
   */
  public remove(reason?: string): void {
    this.ensureNotDeleted();

    if (this.status === ExecutorStatus.APPOINTED) {
      throw new Error('Cannot remove appointed executor (requires court order)');
    }

    (this.props as any).status = ExecutorStatus.REMOVED;
    (this.props as any).removedAt = new Date();
    (this.props as any).removalReason = reason;
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - POWERS MANAGEMENT
  // =========================================================================

  /**
   * Grant additional power to executor
   */
  public grantPower(power: keyof ExecutorPowers): void {
    this.ensureNotDeleted();

    if (this.status === ExecutorStatus.APPOINTED) {
      throw new Error('Cannot modify powers after appointment');
    }

    const updatedPowers = this.props.powers.grantPower(power);
    (this.props as any).powers = updatedPowers;
    this.incrementVersion();
  }

  /**
   * Revoke a power from executor
   */
  public revokePower(power: keyof ExecutorPowers): void {
    this.ensureNotDeleted();

    if (this.status === ExecutorStatus.APPOINTED) {
      throw new Error('Cannot modify powers after appointment');
    }

    const updatedPowers = this.props.powers.revokePower(power);
    (this.props as any).powers = updatedPowers;
    this.incrementVersion();
  }

  /**
   * Replace all powers with new power set
   */
  public updatePowers(newPowers: ExecutorPowers): void {
    this.ensureNotDeleted();

    if (this.status === ExecutorStatus.APPOINTED) {
      throw new Error('Cannot modify powers after appointment');
    }

    (this.props as any).powers = newPowers;
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - PRIORITY MANAGEMENT
  // =========================================================================

  /**
   * Change priority (e.g., promote alternate to primary)
   */
  public changePriority(newPriority: ExecutorPriority, newOrderNumber: number): void {
    this.ensureNotDeleted();

    if (this.status === ExecutorStatus.APPOINTED) {
      throw new Error('Cannot change priority after appointment');
    }

    (this.props as any).priority = newPriority;
    (this.props as any).isPrimary = newPriority === ExecutorPriority.PRIMARY;
    (this.props as any).orderNumber = newOrderNumber;
    this.incrementVersion();
  }

  /**
   * Promote to primary executor
   */
  public promoteToprimary(orderNumber: number = 1): void {
    this.changePriority(ExecutorPriority.PRIMARY, orderNumber);
  }

  /**
   * Demote to alternate
   */
  public demoteToAlternate(orderNumber: number): void {
    this.changePriority(ExecutorPriority.ALTERNATE, orderNumber);
  }

  // =========================================================================
  // BUSINESS LOGIC - CONTACT & ADDRESS
  // =========================================================================

  /**
   * Update contact details
   */
  public updateContactDetails(
    email?: string,
    phoneNumber?: string,
    physicalAddress?: string,
    county?: string,
  ): void {
    this.ensureNotDeleted();

    if (email) (this.props as any).email = email;
    if (phoneNumber) (this.props as any).phoneNumber = phoneNumber;
    if (physicalAddress) (this.props as any).physicalAddress = physicalAddress;
    if (county) (this.props as any).county = county;

    this.incrementVersion();
  }

  /**
   * Set relationship to testator (for court documentation)
   */
  public setRelationship(relationship: string): void {
    this.ensureNotDeleted();
    (this.props as any).relationshipToTestator = relationship;
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - PROFESSIONAL EXECUTORS
  // =========================================================================

  /**
   * Designate as professional executor (lawyer, trust company)
   */
  public designateAsProfessional(licenseNumber: string, issuingBody: string): void {
    this.ensureNotDeleted();

    (this.props as any).isProfessional = true;
    (this.props as any).professionalLicenseNumber = licenseNumber;
    (this.props as any).licenseIssuingBody = issuingBody;
    this.incrementVersion();
  }

  public isProfessionalExecutor(): boolean {
    return this.props.isProfessional;
  }

  // =========================================================================
  // QUERY METHODS
  // =========================================================================

  public isNominated(): boolean {
    return this.status === ExecutorStatus.NOMINATED;
  }

  public isNotified(): boolean {
    return this.status === ExecutorStatus.NOTIFIED;
  }

  public hasAccepted(): boolean {
    return this.status === ExecutorStatus.ACCEPTED;
  }

  public hasDeclined(): boolean {
    return this.status === ExecutorStatus.DECLINED;
  }

  public isRemoved(): boolean {
    return this.status === ExecutorStatus.REMOVED;
  }

  public isAppointed(): boolean {
    return this.status === ExecutorStatus.APPOINTED;
  }

  public isActive(): boolean {
    return (
      this.status === ExecutorStatus.NOMINATED ||
      this.status === ExecutorStatus.NOTIFIED ||
      this.status === ExecutorStatus.ACCEPTED
    );
  }

  public canServe(): boolean {
    return (
      this.props.isLegallyEligible && this.isActive() && !this.isRemoved() && !this.hasDeclined()
    );
  }

  public isAlternate(): boolean {
    return this.props.priority === ExecutorPriority.ALTERNATE;
  }

  public isCoExecutor(): boolean {
    return this.props.priority === ExecutorPriority.CO_EXECUTOR;
  }

  public requiresBond(): boolean {
    return this.props.powers.requiresBond();
  }

  public getBondAmount(): number | undefined {
    return this.props.powers.getBondAmount();
  }

  // =========================================================================
  // BUSINESS LOGIC - VALIDATION
  // =========================================================================

  /**
   * Validate nomination completeness
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.props.fullName || this.props.fullName.trim().length === 0) {
      errors.push('Executor full name is required');
    }

    if (!this.props.isLegallyEligible) {
      errors.push(`Executor is ineligible: ${this.props.ineligibilityReason}`);
    }

    if (!this.props.email && !this.props.phoneNumber && !this.props.executorId) {
      errors.push('At least one contact method required (email, phone, or user ID)');
    }

    if (this.props.orderNumber < 1) {
      errors.push('Order number must be positive');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toJSON() {
    return {
      id: this.id.toString(),
      willId: this.props.willId,
      executorId: this.props.executorId,
      fullName: this.props.fullName,
      nationalId: this.props.nationalId,
      email: this.props.email,
      phoneNumber: this.props.phoneNumber,
      priority: this.props.priority,
      isPrimary: this.props.isPrimary,
      orderNumber: this.props.orderNumber,
      powers: this.props.powers.toJSON(),
      status: this.props.status,
      nominatedAt: this.props.nominatedAt.toISOString(),
      notifiedAt: this.props.notifiedAt?.toISOString(),
      acceptedAt: this.props.acceptedAt?.toISOString(),
      declinedAt: this.props.declinedAt?.toISOString(),
      removedAt: this.props.removedAt?.toISOString(),
      declinationReason: this.props.declinationReason,
      removalReason: this.props.removalReason,
      isLegallyEligible: this.props.isLegallyEligible,
      ineligibilityReason: this.props.ineligibilityReason,
      physicalAddress: this.props.physicalAddress,
      county: this.props.county,
      relationshipToTestator: this.props.relationshipToTestator,
      isProfessional: this.props.isProfessional,
      professionalLicenseNumber: this.props.professionalLicenseNumber,
      licenseIssuingBody: this.props.licenseIssuingBody,
      canServe: this.canServe(),
      validation: this.validate(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }
}
