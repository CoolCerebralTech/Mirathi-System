// domain/entities/executor-nomination.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';

/**
 * Executor Nomination Entity
 *
 * Kenyan Legal Context (Law of Succession Act, Cap 160):
 * - S.7 LSA: Who may make a will (includes appointing executors)
 * - S.51 LSA: Appointment of executors and trustees
 * - S.52 LSA: Power to appoint substitute executors
 * - S.53 LSA: Power to appoint co-executors
 * - S.80-83 LSA: Duties and powers of executors
 *
 * Entity Scope:
 * 1. Represents a single executor nomination in a will
 * 2. Tracks executor's acceptance/rejection of role
 * 3. Records necessary details for probate court
 * 4. Manages lifecycle of nomination
 *
 * Legal Requirements:
 * - Executor must be competent (S.7: not a minor, of sound mind)
 * - Executor can renounce (refuse) the appointment
 * - Testator can appoint substitutes and co-executors
 * - Court may grant power reserved (S.56 LSA) if executor unwilling
 */

// =========================================================================
// VALUE OBJECTS
// =========================================================================

/**
 * Kenyan National ID Value Object with validation
 */
export class KenyanNationalId {
  constructor(readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('National ID is required');
    }

    // Kenyan ID formats: 8 digits (old) or 8 digits + 1 letter + 3 digits (new)
    const cleaned = value.trim().toUpperCase();
    const oldFormat = /^\d{8}$/;
    const newFormat = /^\d{8}[A-Z]\d{3}$/;

    if (!oldFormat.test(cleaned) && !newFormat.test(cleaned)) {
      throw new Error('Invalid Kenyan National ID format');
    }
  }

  equals(other: KenyanNationalId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  get format(): 'OLD' | 'NEW' {
    return this.value.length === 8 ? 'OLD' : 'NEW';
  }

  mask(): string {
    if (this.format === 'OLD') {
      return `***${this.value.slice(-3)}`;
    } else {
      return `***${this.value.slice(-6)}`;
    }
  }
}

/**
 * Executor Contact Details Value Object
 */
export class ExecutorContact {
  constructor(
    readonly email?: string,
    readonly phone?: string,
    readonly address?: string,
  ) {
    // Validate email if provided
    if (email && !this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone if provided (Kenyan format)
    if (phone && !this.isValidKenyanPhone(phone)) {
      throw new Error('Invalid Kenyan phone number');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidKenyanPhone(phone: string): boolean {
    const kenyanPhoneRegex = /^(?:\+254|0)7[0-9]{8}$/;
    return kenyanPhoneRegex.test(phone.replace(/\s+/g, ''));
  }

  equals(other: ExecutorContact): boolean {
    return (
      this.email === other.email && this.phone === other.phone && this.address === other.address
    );
  }

  hasValidContact(): boolean {
    return !!(this.email || this.phone);
  }

  toJSON() {
    return {
      email: this.email,
      phone: this.phone,
      address: this.address,
      hasValidContact: this.hasValidContact(),
    };
  }
}

// =========================================================================
// ENUMS
// =========================================================================

/**
 * Executor Nomination Status
 * Tracks the lifecycle of executor appointment
 */
export enum ExecutorNominationStatus {
  NOMINATED = 'NOMINATED', // Appointed in will, awaiting acceptance
  NOTIFIED = 'NOTIFIED', // Has been notified of nomination
  ACCEPTED = 'ACCEPTED', // Has accepted the role
  CONDITIONAL_ACCEPTANCE = 'CONDITIONAL_ACCEPTANCE', // Accepted with conditions
  RENOUNCED = 'RENOUNCED', // Has refused the role (S.55 LSA)
  PRE_DECEASED = 'PRE_DECEASED', // Died before testator
  INCAPACITATED = 'INCAPACITATED', // Became incapacitated
  SUBSTITUTED = 'SUBSTITUTED', // Replaced by substitute executor
  COURT_APPROVED = 'COURT_APPROVED', // Approved by probate court
  REVOKED = 'REVOKED', // Nomination revoked by codicil
}

/**
 * Executor Type
 * Differentiates between types of executors
 */
export enum ExecutorType {
  PRIMARY = 'PRIMARY', // Main executor
  CO_EXECUTOR = 'CO_EXECUTOR', // Joint executor (S.53 LSA)
  SUBSTITUTE = 'SUBSTITUTE', // Replacement if primary cannot act (S.52 LSA)
  SPECIAL = 'SPECIAL', // Limited to specific assets/actions
  PROFESSIONAL = 'PROFESSIONAL', // Lawyer, accountant, trust company
}

/**
 * Executor Capacity Status
 * Legal capacity to act as executor
 */
export enum CapacityStatus {
  COMPETENT = 'COMPETENT', // Meets S.7 LSA requirements
  MINOR = 'MINOR', // Below 18 years
  MENTALLY_INCAPACITATED = 'MENTALLY_INCAPACITATED',
  BANKRUPT = 'BANKRUPT', // Disqualified under bankruptcy laws
  CONVICTED = 'CONVICTED', // Disqualified due to criminal conviction
  UNKNOWN = 'UNKNOWN', // Capacity not verified
}

// =========================================================================
// EXECUTOR NOMINATION ENTITY
// =========================================================================

interface ExecutorNominationProps {
  willId: string; // Reference to parent Will aggregate
  testatorId: string; // Reference to testator (User)

  // Executor Identity
  executorType: ExecutorType;
  isNamedInWill: boolean; // True if specifically named in will text

  // Executor Details (may be external person)
  userId?: string; // If executor is system user
  fullName: string; // Required for probate forms
  nationalId?: KenyanNationalId; // For probate court verification
  contact?: ExecutorContact; // For notification
  relationshipToTestator?: string; // e.g., "Brother", "Lawyer", "Friend"

  // Legal Status
  status: ExecutorNominationStatus;
  capacityStatus: CapacityStatus;

  // Timeline
  nominatedAt: Date; // When nominated in will
  notifiedAt?: Date; // When informed of nomination
  respondedAt?: Date; // When accepted/renounced
  acceptedAt?: Date; // When formally accepted
  renouncedAt?: Date; // When refused role (S.55 LSA)

  // Legal Documentation
  acceptanceInstrumentId?: string; // Document ID of acceptance
  renunciationInstrumentId?: string; // Document ID of renunciation
  bondRequired: boolean; // Whether executor bond required

  // Special Provisions (S.56 LSA: Power reserved)
  isPowerReserved: boolean; // Court may grant power reserved
  conditions?: string; // Any conditions of acceptance
  limitations?: string[]; // Limitations on powers (S.83)

  // Substitution & Chain
  substitutesForId?: string; // If substitute, who they replace
  successorId?: string; // Who takes over if this executor cannot act
}

export class ExecutorNomination extends Entity<ExecutorNominationProps> {
  // =========================================================================
  // CONSTRUCTOR & FACTORY
  // =========================================================================

  private constructor(props: ExecutorNominationProps, id?: UniqueEntityID) {
    // Domain Rule: Must have at least name for probate court
    if (!props.fullName || props.fullName.trim().length < 2) {
      throw new Error('Executor must have a valid full name');
    }

    // Domain Rule: Cannot be both primary and substitute
    if (props.executorType === ExecutorType.SUBSTITUTE && !props.substitutesForId) {
      throw new Error('Substitute executor must specify who they substitute');
    }

    super(id ?? new UniqueEntityID(), props);
  }

  /**
   * Factory: Create nomination for system user
   */
  public static createForUser(
    willId: string,
    testatorId: string,
    userId: string,
    fullName: string,
    executorType: ExecutorType = ExecutorType.PRIMARY,
    relationshipToTestator?: string,
  ): ExecutorNomination {
    const props: ExecutorNominationProps = {
      willId,
      testatorId,
      executorType,
      isNamedInWill: true,
      userId,
      fullName,
      relationshipToTestator,
      status: ExecutorNominationStatus.NOMINATED,
      capacityStatus: CapacityStatus.UNKNOWN, // To be verified
      nominatedAt: new Date(),
      bondRequired: false,
      isPowerReserved: false,
    };

    return new ExecutorNomination(props);
  }

  /**
   * Factory: Create nomination for external person
   */
  public static createForExternal(
    willId: string,
    testatorId: string,
    fullName: string,
    nationalId: string,
    contact?: ExecutorContact,
    executorType: ExecutorType = ExecutorType.PRIMARY,
    relationshipToTestator?: string,
  ): ExecutorNomination {
    const props: ExecutorNominationProps = {
      willId,
      testatorId,
      executorType,
      isNamedInWill: true,
      fullName,
      nationalId: new KenyanNationalId(nationalId),
      contact,
      relationshipToTestator,
      status: ExecutorNominationStatus.NOMINATED,
      capacityStatus: CapacityStatus.UNKNOWN,
      nominatedAt: new Date(),
      bondRequired: true, // External executors typically need bond
      isPowerReserved: false,
    };

    return new ExecutorNomination(props);
  }

  /**
   * Factory: Create substitute executor nomination
   */
  public static createSubstitute(
    willId: string,
    testatorId: string,
    fullName: string,
    nationalId: string,
    substitutesForId: string,
    contact?: ExecutorContact,
  ): ExecutorNomination {
    const props: ExecutorNominationProps = {
      willId,
      testatorId,
      executorType: ExecutorType.SUBSTITUTE,
      isNamedInWill: true,
      fullName,
      nationalId: new KenyanNationalId(nationalId),
      contact,
      substitutesForId,
      status: ExecutorNominationStatus.NOMINATED,
      capacityStatus: CapacityStatus.UNKNOWN,
      nominatedAt: new Date(),
      bondRequired: true,
      isPowerReserved: false,
    };

    return new ExecutorNomination(props);
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: ExecutorNominationProps,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ): ExecutorNomination {
    const nomination = new ExecutorNomination(props, new UniqueEntityID(id));
    (nomination as any)._createdAt = createdAt;
    (nomination as any)._updatedAt = updatedAt;
    (nomination as any)._version = version;
    return nomination;
  }

  // =========================================================================
  // BUSINESS LOGIC (MUTATIONS)
  // =========================================================================

  /**
   * Notify executor of nomination (required before acceptance)
   */
  public notify(at: Date = new Date()): void {
    if (this.status !== ExecutorNominationStatus.NOMINATED) {
      throw new Error('Can only notify nominated executors');
    }

    if (!this.contact?.hasValidContact()) {
      throw new Error('Cannot notify executor without contact information');
    }

    this.updateState({
      status: ExecutorNominationStatus.NOTIFIED,
      notifiedAt: at,
    });
  }

  /**
   * Accept the executor role (S.55 LSA: Acceptance by conduct)
   */
  public accept(instrumentId?: string, conditions?: string, at: Date = new Date()): void {
    const allowedStatuses = [
      ExecutorNominationStatus.NOTIFIED,
      ExecutorNominationStatus.NOMINATED, // Direct acceptance without notification
    ];

    if (!allowedStatuses.includes(this.status)) {
      throw new Error('Can only accept from NOMINATED or NOTIFIED status');
    }

    // Check capacity (S.7 LSA: must be competent)
    if (this.capacityStatus !== CapacityStatus.COMPETENT) {
      throw new Error('Cannot accept without verifying capacity status');
    }

    const newStatus = conditions
      ? ExecutorNominationStatus.CONDITIONAL_ACCEPTANCE
      : ExecutorNominationStatus.ACCEPTED;

    this.updateState({
      status: newStatus,
      respondedAt: at,
      acceptedAt: at,
      acceptanceInstrumentId: instrumentId,
      conditions,
    });
  }

  /**
   * Renounce (refuse) the executor role (S.55 LSA: Right to renounce)
   */
  public renounce(instrumentId?: string, reason?: string, at: Date = new Date()): void {
    const allowedStatuses = [
      ExecutorNominationStatus.NOTIFIED,
      ExecutorNominationStatus.NOMINATED,
      ExecutorNominationStatus.ACCEPTED, // May renounce even after accepting
    ];

    if (!allowedStatuses.includes(this.status)) {
      throw new Error('Cannot renounce from current status');
    }

    // Record the conditions for renunciation
    const newConditions = this.conditions ? `${this.conditions} | RENOUNCED: ${reason}` : reason;

    this.updateState({
      status: ExecutorNominationStatus.RENOUNCED,
      respondedAt: at,
      renouncedAt: at,
      renunciationInstrumentId: instrumentId,
      conditions: newConditions,
    });
  }

  /**
   * Update capacity status (S.7 LSA: competency check)
   */
  public updateCapacityStatus(status: CapacityStatus): void {
    if (status === CapacityStatus.MINOR && this.isActive()) {
      throw new Error('Cannot appoint minor as active executor (S.7 LSA)');
    }

    this.updateState({
      capacityStatus: status,
    });
  }

  /**
   * Mark as pre-deceased (died before testator)
   */
  public markPreDeceased(_at: Date = new Date()): void {
    if (this.status === ExecutorNominationStatus.PRE_DECEASED) {
      return; // Already marked
    }

    this.updateState({
      status: ExecutorNominationStatus.PRE_DECEASED,
    });
  }

  /**
   * Mark as incapacitated (cannot act as executor)
   */
  public markIncapacitated(_at: Date = new Date()): void {
    if (this.status === ExecutorNominationStatus.INCAPACITATED) {
      return;
    }

    this.updateState({
      status: ExecutorNominationStatus.INCAPACITATED,
      capacityStatus: CapacityStatus.MENTALLY_INCAPACITATED,
    });
  }

  /**
   * Activate substitute (S.52 LSA: Substitution on renunciation/death)
   */
  public activateSubstitute(_substituteId: string): void {
    if (this.executorType !== ExecutorType.SUBSTITUTE) {
      throw new Error('Only substitute executors can be activated');
    }

    if (this.status !== ExecutorNominationStatus.NOMINATED) {
      throw new Error('Only nominated substitutes can be activated');
    }

    this.updateState({
      status: ExecutorNominationStatus.ACCEPTED,
      respondedAt: new Date(),
      acceptedAt: new Date(),
    });
  }

  /**
   * Court approval (probate court grants power)
   */
  public approveByCourt(_instrumentId: string, _at: Date = new Date()): void {
    if (this.status !== ExecutorNominationStatus.ACCEPTED) {
      throw new Error('Only accepted executors can be court approved');
    }

    this.updateState({
      status: ExecutorNominationStatus.COURT_APPROVED,
    });
  }

  /**
   * Set executor bond requirement (S.58 LSA: Security by executors)
   */
  public setBondRequirement(required: boolean): void {
    this.updateState({
      bondRequired: required,
    });
  }

  /**
   * Set power reserved (S.56 LSA: Court may grant power reserved)
   */
  public setPowerReserved(reserved: boolean): void {
    this.updateState({
      isPowerReserved: reserved,
    });
  }

  /**
   * Add limitations to executor powers (S.83 LSA)
   */
  public addLimitation(limitation: string): void {
    const currentLimitations = this.limitations || [];

    if (currentLimitations.includes(limitation)) {
      throw new Error('Limitation already exists');
    }

    this.updateState({
      limitations: [...currentLimitations, limitation],
    });
  }

  /**
   * Update contact information
   */
  public updateContact(contact: ExecutorContact): void {
    this.updateState({
      contact,
    });
  }

  // =========================================================================
  // QUERY METHODS (PURE)
  // =========================================================================

  /**
   * Check if executor is competent (S.7 LSA requirements)
   */
  public isCompetent(): boolean {
    return this.capacityStatus === CapacityStatus.COMPETENT;
  }

  /**
   * Check if executor is currently active and able to act
   */
  public isActive(): boolean {
    const activeStatuses = [
      ExecutorNominationStatus.ACCEPTED,
      ExecutorNominationStatus.CONDITIONAL_ACCEPTANCE,
      ExecutorNominationStatus.COURT_APPROVED,
    ];
    return activeStatuses.includes(this.status) && this.isCompetent();
  }

  /**
   * Check if executor has renounced (S.55 LSA)
   */
  public hasRenounced(): boolean {
    return this.status === ExecutorNominationStatus.RENOUNCED;
  }

  /**
   * Check if executor is pre-deceased
   */
  public isPreDeceased(): boolean {
    return this.status === ExecutorNominationStatus.PRE_DECEASED;
  }

  /**
   * Check if executor is incapacitated
   */
  public isIncapacitated(): boolean {
    return this.status === ExecutorNominationStatus.INCAPACITATED;
  }

  /**
   * Check if executor can be substituted
   */
  public canBeSubstituted(): boolean {
    return (
      this.hasRenounced() || this.isPreDeceased() || this.isIncapacitated() || !this.isCompetent()
    );
  }

  /**
   * Check if executor has been notified
   */
  public hasBeenNotified(): boolean {
    return !!this.notifiedAt;
  }

  /**
   * Check if executor has responded (accepted/renounced)
   */
  public hasResponded(): boolean {
    return !!this.respondedAt;
  }

  /**
   * Check if executor is a system user
   */
  public isSystemUser(): boolean {
    return !!this.userId;
  }

  /**
   * Get days since nomination
   */
  public daysSinceNomination(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.nominatedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // =========================================================================
  // PROPERTY GETTERS
  // =========================================================================

  get willId(): string {
    return this.props.willId;
  }

  get testatorId(): string {
    return this.props.testatorId;
  }

  get executorType(): ExecutorType {
    return this.props.executorType;
  }

  get isNamedInWill(): boolean {
    return this.props.isNamedInWill;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get nationalId(): KenyanNationalId | undefined {
    return this.props.nationalId;
  }

  get contact(): ExecutorContact | undefined {
    return this.props.contact;
  }

  get relationshipToTestator(): string | undefined {
    return this.props.relationshipToTestator;
  }

  get status(): ExecutorNominationStatus {
    return this.props.status;
  }

  get capacityStatus(): CapacityStatus {
    return this.props.capacityStatus;
  }

  get nominatedAt(): Date {
    return this.props.nominatedAt;
  }

  get notifiedAt(): Date | undefined {
    return this.props.notifiedAt;
  }

  get respondedAt(): Date | undefined {
    return this.props.respondedAt;
  }

  get acceptedAt(): Date | undefined {
    return this.props.acceptedAt;
  }

  get renouncedAt(): Date | undefined {
    return this.props.renouncedAt;
  }

  get acceptanceInstrumentId(): string | undefined {
    return this.props.acceptanceInstrumentId;
  }

  get renunciationInstrumentId(): string | undefined {
    return this.props.renunciationInstrumentId;
  }

  get bondRequired(): boolean {
    return this.props.bondRequired;
  }

  get isPowerReserved(): boolean {
    return this.props.isPowerReserved;
  }

  get conditions(): string | undefined {
    return this.props.conditions;
  }

  get limitations(): string[] | undefined {
    return this.props.limitations;
  }

  get substitutesForId(): string | undefined {
    return this.props.substitutesForId;
  }

  get successorId(): string | undefined {
    return this.props.successorId;
  }

  // Type checkers
  public isPrimary(): boolean {
    return this.executorType === ExecutorType.PRIMARY;
  }

  public isCoExecutor(): boolean {
    return this.executorType === ExecutorType.CO_EXECUTOR;
  }

  public isSubstitute(): boolean {
    return this.executorType === ExecutorType.SUBSTITUTE;
  }

  public isProfessional(): boolean {
    return this.executorType === ExecutorType.PROFESSIONAL;
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  /**
   * Validate nomination against Kenyan legal requirements
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!this.fullName.trim()) {
      errors.push('Executor must have a valid name');
    }

    // S.7 LSA: Competency check
    if (this.isActive() && !this.isCompetent()) {
      errors.push('Active executor must be competent (S.7 LSA)');
    }

    // Cannot be both primary and substitute
    if (this.isSubstitute() && !this.substitutesForId) {
      errors.push('Substitute executor must specify who they substitute');
    }

    // Professional executors typically require bond
    if (this.isProfessional() && !this.bondRequired) {
      errors.push('Professional executors typically require bond');
    }

    // Must have contact information if notified
    if (this.hasBeenNotified() && !this.contact?.hasValidContact()) {
      errors.push('Notified executor must have valid contact information');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toJSON() {
    return {
      id: this.id.toString(),
      willId: this.willId,
      testatorId: this.testatorId,

      // Identity
      executorType: this.executorType,
      isNamedInWill: this.isNamedInWill,
      userId: this.userId,
      fullName: this.fullName,
      nationalId: this.nationalId?.toString(),
      maskedNationalId: this.nationalId?.mask(),
      contact: this.contact?.toJSON(),
      relationshipToTestator: this.relationshipToTestator,

      // Status
      status: this.status,
      capacityStatus: this.capacityStatus,
      isCompetent: this.isCompetent(),
      isActive: this.isActive(),
      hasRenounced: this.hasRenounced(),

      // Timeline
      nominatedAt: this.nominatedAt.toISOString(),
      notifiedAt: this.notifiedAt?.toISOString(),
      respondedAt: this.respondedAt?.toISOString(),
      acceptedAt: this.acceptedAt?.toISOString(),
      renouncedAt: this.renouncedAt?.toISOString(),
      daysSinceNomination: this.daysSinceNomination(),

      // Legal
      acceptanceInstrumentId: this.acceptanceInstrumentId,
      renunciationInstrumentId: this.renunciationInstrumentId,
      bondRequired: this.bondRequired,
      isPowerReserved: this.isPowerReserved,
      conditions: this.conditions,
      limitations: this.limitations,

      // Chain
      substitutesForId: this.substitutesForId,
      successorId: this.successorId,
      canBeSubstituted: this.canBeSubstituted(),

      // Validation
      validation: this.validate(),

      // System
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }
}
