// src/estate-service/src/domain/entities/executor-nomination.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  ExecutorCompensationSetEvent,
  ExecutorConsentUpdatedEvent,
  ExecutorContactUpdatedEvent,
  ExecutorNominatedEvent,
  ExecutorPowersGrantedEvent,
} from '../events/executor-nomination.events';
import { WillExecutorException } from '../exceptions/will-executors.exception';
import { ExecutorPriority } from '../value-objects/executor-priority.vo';

/**
 * WillExecutor Properties Interface
 */
export interface WillExecutorProps {
  willId: string; // Reference to parent Will aggregate
  executorIdentity: {
    type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';
    userId?: string;
    familyMemberId?: string;
    externalDetails?: {
      fullName: string;
      nationalId?: string;
      kraPin?: string;
      email?: string;
      phone?: string;
      relationship?: string;
    };
  };
  priority: ExecutorPriority;
  appointmentType: 'TESTAMENTARY' | 'SPECIAL_EXECUTOR';
  appointmentDate: Date;

  // Optional pre-death information
  consentStatus?: 'PENDING' | 'CONSENTED' | 'DECLINED' | 'UNKNOWN';
  consentDate?: Date;
  consentNotes?: string;

  // Qualification checks (pre-death validation)
  isQualified: boolean;
  qualificationReasons: string[];

  // Legal restrictions
  isMinor: boolean;
  isMentallyIncapacitated: boolean;
  hasCriminalRecord: boolean;
  isBankrupt: boolean;

  // Contact information for notification
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  // Additional provisions
  powers?: string[]; // Specific powers granted by testator
  restrictions?: string[]; // Restrictions imposed by testator
  compensation?: {
    isEntitled: boolean;
    amount?: number;
    basis?: 'FIXED' | 'PERCENTAGE' | 'REASONABLE';
  };
}

/**
 * WillExecutor Entity (Executor Nomination)
 *
 * Represents a nomination of an executor in a will in Kenya
 *
 * Legal Context (S.83 LSA):
 * - Testator may appoint one or more executors
 * - Executor must accept role after testator's death
 * - Minor, bankrupt, or incapacitated persons may be disqualified
 * - Executor can be a beneficiary (allowed by law)
 *
 * IMPORTANT: This is a NOMINATION, not a grant of authority.
 * Actual authority comes from Grant of Probate.
 */
export class WillExecutor extends Entity<WillExecutorProps> {
  private constructor(props: WillExecutorProps, id?: UniqueEntityID) {
    super(id ?? new UniqueEntityID(), props);
  }

  /**
   * Factory method to create a new WillExecutor nomination
   */
  public static create(props: WillExecutorProps, id?: UniqueEntityID): WillExecutor {
    const executor = new WillExecutor(props, id);
    executor.validate();

    // Apply domain event for Executor nomination
    executor.addDomainEvent(
      new ExecutorNominatedEvent(
        props.willId,
        executor.id.toString(),
        executor.getDisplayName(),
        props.priority.toJSON(),
        props.appointmentType,
      ),
    );

    return executor;
  }

  /**
   * Validate WillExecutor invariants
   *
   * Ensures:
   * - Valid identity information
   * - Legal qualification checks
   * - Proper appointment type
   * - Kenyan legal compliance
   */
  public validate(): void {
    // Identity validation
    this.validateIdentity();

    // Date validation
    if (this.props.appointmentDate > new Date()) {
      throw new WillExecutorException(
        'Appointment date cannot be in the future',
        'appointmentDate',
      );
    }

    // Consent date validation (if present)
    if (this.props.consentDate && this.props.consentDate > new Date()) {
      throw new WillExecutorException('Consent date cannot be in the future', 'consentDate');
    }

    // Qualification checks
    this.validateQualifications();
  }

  /**
   * Validate executor identity based on type
   */
  private validateIdentity(): void {
    const { type, userId, familyMemberId, externalDetails } = this.props.executorIdentity;

    switch (type) {
      case 'USER':
        if (!userId) {
          throw new WillExecutorException(
            'User executor must have userId',
            'executorIdentity.userId',
          );
        }
        break;

      case 'FAMILY_MEMBER':
        if (!familyMemberId) {
          throw new WillExecutorException(
            'Family member executor must have familyMemberId',
            'executorIdentity.familyMemberId',
          );
        }
        break;

      case 'EXTERNAL':
        if (!externalDetails?.fullName) {
          throw new WillExecutorException(
            'External executor must have full name',
            'executorIdentity.externalDetails.fullName',
          );
        }

        // Validate Kenyan ID if provided
        if (externalDetails.nationalId) {
          this.validateKenyanNationalId(externalDetails.nationalId);
        }

        // Validate KRA PIN if provided
        if (externalDetails.kraPin) {
          this.validateKraPin(externalDetails.kraPin);
        }

        // Validate email if provided
        if (externalDetails.email) {
          this.validateEmail(externalDetails.email);
        }

        // Validate phone if provided
        if (externalDetails.phone) {
          this.validatePhone(externalDetails.phone);
        }
        break;

      default:
        throw new WillExecutorException(
          `Invalid executor identity type: ${type as any}`,
          'executorIdentity.type',
        );
    }
  }

  private validateKenyanNationalId(id: string): void {
    const idPattern = /^[1-3]\d{7}$/;
    if (!idPattern.test(id)) {
      throw new WillExecutorException(
        'Invalid Kenyan National ID format',
        'executorIdentity.externalDetails.nationalId',
      );
    }
  }

  private validateKraPin(pin: string): void {
    const pinPattern = /^[A-Z]\d{10}$/;
    if (!pinPattern.test(pin)) {
      throw new WillExecutorException(
        'Invalid KRA PIN format',
        'executorIdentity.externalDetails.kraPin',
      );
    }
  }

  private validateEmail(email: string): void {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new WillExecutorException(
        'Invalid email format',
        'executorIdentity.externalDetails.email',
      );
    }
  }

  private validatePhone(phone: string): void {
    // Kenyan phone validation: +254... or 07...
    const phonePattern = /^(?:\+254|0)[17]\d{8}$/;
    if (!phonePattern.test(phone.replace(/\s/g, ''))) {
      throw new WillExecutorException(
        'Invalid Kenyan phone number format',
        'executorIdentity.externalDetails.phone',
      );
    }
  }

  /**
   * Validate legal qualifications
   */
  private validateQualifications(): void {
    const qualificationReasons: string[] = [];

    // Check for legal disqualifications
    if (this.props.isMinor) {
      qualificationReasons.push('Minor cannot serve as executor (S.83 LSA)');
    }

    if (this.props.isMentallyIncapacitated) {
      qualificationReasons.push('Mentally incapacitated person cannot serve as executor');
    }

    if (this.props.hasCriminalRecord) {
      qualificationReasons.push('Person with criminal record may be disqualified by court');
    }

    if (this.props.isBankrupt) {
      qualificationReasons.push('Bankrupt person cannot serve as executor');
    }

    // Check if executor is also a beneficiary (allowed but noted)
    // This check would require cross-checking with beneficiary assignments
    // For now, we just note it if relationship suggests beneficiary status
    if (this.props.executorIdentity.externalDetails?.relationship === 'BENEFICIARY') {
      qualificationReasons.push(
        'Note: Executor is also a beneficiary - potential conflict of interest',
      );
    }

    // Update qualification status
    const isQualified = qualificationReasons.length === 0;

    if (this.props.isQualified !== isQualified) {
      throw new WillExecutorException(
        'Qualification status does not match qualification reasons',
        'isQualified',
      );
    }

    if (JSON.stringify(this.props.qualificationReasons) !== JSON.stringify(qualificationReasons)) {
      throw new WillExecutorException(
        'Qualification reasons do not match calculated reasons',
        'qualificationReasons',
      );
    }
  }

  /**
   * Update consent status (pre-death)
   */
  public updateConsent(
    status: 'PENDING' | 'CONSENTED' | 'DECLINED' | 'UNKNOWN',
    notes?: string,
  ): void {
    if (status === this.props.consentStatus && notes === this.props.consentNotes) {
      return; // No change
    }
    const previousStatus = this.props.consentStatus;

    this.updateState({
      consentStatus: status,
      consentDate: status === 'CONSENTED' || status === 'DECLINED' ? new Date() : undefined,
      consentNotes: notes,
    });

    // Add domain event for consent update
    this.addDomainEvent(
      new ExecutorConsentUpdatedEvent(
        this.props.willId,
        this.id.toString(),
        this.getDisplayName(),
        previousStatus,
        status,
        notes,
      ),
    );
  }

  /**
   * Update contact information
   */
  public updateContactInfo(contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  }): void {
    // 1. Define the variable to track changes
    const updatedFields: string[] = [];
    const currentInfo = this.props.contactInfo || {};

    // 2. Check each field for changes and validate
    if (contactInfo.email !== undefined && contactInfo.email !== currentInfo.email) {
      if (contactInfo.email) this.validateEmail(contactInfo.email);
      updatedFields.push('email');
    }

    if (contactInfo.phone !== undefined && contactInfo.phone !== currentInfo.phone) {
      if (contactInfo.phone) this.validatePhone(contactInfo.phone);
      updatedFields.push('phone');
    }

    if (contactInfo.address !== undefined && contactInfo.address !== currentInfo.address) {
      updatedFields.push('address');
    }

    // 3. If nothing changed, stop here
    if (updatedFields.length === 0) {
      return;
    }

    // 4. Update state
    this.updateState({
      contactInfo: {
        ...this.props.contactInfo,
        ...contactInfo,
      },
    });

    // 5. Emit event with the defined 'updatedFields' variable
    this.addDomainEvent(
      new ExecutorContactUpdatedEvent(
        this.props.willId,
        this.id.toString(),
        this.getDisplayName(),
        updatedFields,
      ),
    );
  }

  /**
   * Add specific powers granted by testator
   */
  public addPower(power: string): void {
    const currentPowers = this.props.powers || [];

    if (currentPowers.includes(power)) {
      throw new WillExecutorException('Power already granted to executor', 'powers');
    }

    this.updateState({
      powers: [...currentPowers, power],
    });
    this.addDomainEvent(
      new ExecutorPowersGrantedEvent(
        this.props.willId,
        this.id.toString(),
        this.getDisplayName(),
        [power], // Event expects array
      ),
    );
  }

  /**
   * Add restriction imposed by testator
   */
  public addRestriction(restriction: string): void {
    const currentRestrictions = this.props.restrictions || [];

    if (currentRestrictions.includes(restriction)) {
      throw new WillExecutorException('Restriction already imposed on executor', 'restrictions');
    }

    this.updateState({
      restrictions: [...currentRestrictions, restriction],
    });
  }

  /**
   * Set compensation details
   */
  public setCompensation(
    isEntitled: boolean,
    amount?: number,
    basis?: 'FIXED' | 'PERCENTAGE' | 'REASONABLE',
  ): void {
    if (isEntitled && (!amount || amount <= 0) && basis !== 'REASONABLE') {
      throw new WillExecutorException(
        'Compensation amount must be positive for fixed or percentage basis',
        'compensation',
      );
    }

    if (basis === 'PERCENTAGE' && amount && (amount < 0 || amount > 100)) {
      throw new WillExecutorException(
        'Percentage compensation must be between 0 and 100',
        'compensation',
      );
    }

    this.updateState({
      compensation: {
        isEntitled,
        amount,
        basis,
      },
    });
    this.addDomainEvent(
      new ExecutorCompensationSetEvent(
        this.props.willId,
        this.id.toString(),
        this.getDisplayName(),
        isEntitled,
        amount,
        basis,
      ),
    );
  }

  /**
   * Get display name based on identity type
   */
  public getDisplayName(): string {
    const { type, externalDetails } = this.props.executorIdentity;

    switch (type) {
      case 'USER':
        return `User ${this.props.executorIdentity.userId?.substring(0, 8)}...`;
      case 'FAMILY_MEMBER':
        return `Family Member ${this.props.executorIdentity.familyMemberId?.substring(0, 8)}...`;
      case 'EXTERNAL':
        return externalDetails?.fullName || 'Unknown External Executor';
      default:
        return 'Unknown Executor';
    }
  }

  /**
   * Check if executor has given consent
   */
  public hasGivenConsent(): boolean {
    return this.props.consentStatus === 'CONSENTED';
  }

  /**
   * Check if executor is legally qualified
   */
  public isLegallyQualified(): boolean {
    return (
      this.props.isQualified &&
      !this.props.isMinor &&
      !this.props.isMentallyIncapacitated &&
      !this.props.isBankrupt
    );
  }

  /**
   * Get recommended actions for executor nomination
   */
  public getRecommendedActions(): string[] {
    const actions: string[] = [];

    if (!this.hasGivenConsent()) {
      actions.push('Obtain written consent from executor');
    }

    if (!this.props.contactInfo?.email && !this.props.contactInfo?.phone) {
      actions.push('Obtain contact information for executor');
    }

    if (this.props.hasCriminalRecord) {
      actions.push('Consider alternative executor due to criminal record');
    }

    if (
      this.props.executorIdentity.type === 'EXTERNAL' &&
      !this.props.executorIdentity.externalDetails?.nationalId
    ) {
      actions.push('Obtain National ID for external executor');
    }

    if (
      this.props.compensation?.isEntitled &&
      (!this.props.compensation.basis ||
        (this.props.compensation.basis === 'REASONABLE' && !this.props.compensation.amount))
    ) {
      actions.push('Specify compensation details clearly');
    }

    return actions;
  }

  /**
   * Get legal status assessment
   */
  public getLegalAssessment(): {
    status: 'VALID' | 'WARNING' | 'INVALID';
    reasons: string[];
    actions: string[];
  } {
    const reasons: string[] = [];
    const actions = this.getRecommendedActions();

    // Check legal qualifications
    if (this.props.isMinor) {
      reasons.push('Executor is a minor - legally disqualified (S.83 LSA)');
    }

    if (this.props.isMentallyIncapacitated) {
      reasons.push('Executor is mentally incapacitated - legally disqualified');
    }

    if (this.props.isBankrupt) {
      reasons.push('Executor is bankrupt - legally disqualified');
    }

    // Check consent
    if (!this.hasGivenConsent()) {
      reasons.push('Executor has not given consent - may refuse appointment');
    }

    // Check contact information
    if (!this.props.contactInfo?.email && !this.props.contactInfo?.phone) {
      reasons.push('No contact information for executor - may delay probate');
    }

    // Determine overall status
    let status: 'VALID' | 'WARNING' | 'INVALID' = 'VALID';

    if (this.props.isMinor || this.props.isMentallyIncapacitated || this.props.isBankrupt) {
      status = 'INVALID';
    } else if (reasons.length > 0 || actions.length > 0) {
      status = 'WARNING';
    }

    return { status, reasons, actions };
  }

  // Getters
  get willId(): string {
    return this.props.willId;
  }

  get executorIdentity(): WillExecutorProps['executorIdentity'] {
    return { ...this.props.executorIdentity };
  }

  get priority(): ExecutorPriority {
    return this.props.priority;
  }

  get appointmentType(): string {
    return this.props.appointmentType;
  }

  get appointmentDate(): Date {
    return this.props.appointmentDate;
  }

  get consentStatus(): string | undefined {
    return this.props.consentStatus;
  }

  get consentDate(): Date | undefined {
    return this.props.consentDate;
  }

  get consentNotes(): string | undefined {
    return this.props.consentNotes;
  }

  get isQualified(): boolean {
    return this.props.isQualified;
  }

  get qualificationReasons(): string[] {
    return [...this.props.qualificationReasons];
  }

  get isMinor(): boolean {
    return this.props.isMinor;
  }

  get isMentallyIncapacitated(): boolean {
    return this.props.isMentallyIncapacitated;
  }

  get hasCriminalRecord(): boolean {
    return this.props.hasCriminalRecord;
  }

  get isBankrupt(): boolean {
    return this.props.isBankrupt;
  }

  get contactInfo(): WillExecutorProps['contactInfo'] {
    return this.props.contactInfo ? { ...this.props.contactInfo } : undefined;
  }

  get powers(): string[] | undefined {
    return this.props.powers ? [...this.props.powers] : undefined;
  }

  get restrictions(): string[] | undefined {
    return this.props.restrictions ? [...this.props.restrictions] : undefined;
  }

  get compensation(): WillExecutorProps['compensation'] {
    return this.props.compensation ? { ...this.props.compensation } : undefined;
  }
}
