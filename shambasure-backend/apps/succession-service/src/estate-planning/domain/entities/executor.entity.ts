import { AggregateRoot } from '@nestjs/cqrs';
import { ExecutorStatus } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';
import { ExecutorNominatedEvent } from '../events/executor-nominated.event';
import { ExecutorAcceptedEvent } from '../events/executor-accepted.event';
import { ExecutorDeclinedEvent } from '../events/executor-declined.event';
import { ExecutorRemovedEvent } from '../events/executor-removed.event';

/**
 * Contact information for executor under Kenyan succession law
 * @interface ExecutorContactInfo
 */
export interface ExecutorContactInfo {
  street?: string;
  city?: string;
  county?: string;
  postalCode?: string;
}

/**
 * Identity information for executor (user or external)
 * @interface ExecutorInfo
 */
export interface ExecutorInfo {
  userId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  address?: ExecutorContactInfo;
}

/**
 * Data structure for asset valuation information
 * @interface AssetValueData
 */
export interface AssetValueData {
  amount: number;
  currency: string;
  valuationDate: Date | string;
}

/**
 * Properties required for entity reconstitution from persistence
 * @interface ExecutorReconstituteProps
 */
export interface ExecutorReconstituteProps {
  id: string;
  willId: string;
  executorInfo: ExecutorInfo;
  isPrimary: boolean;
  orderOfPriority: number;
  status: ExecutorStatus;
  appointedAt: Date | string | null;
  acceptedAt: Date | string | null;
  declinedAt: Date | string | null;
  declineReason: string | null;
  isCompensated: boolean;
  compensationAmount: AssetValueData | AssetValue | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Executor Entity representing will executor/administrator under Kenyan succession law
 *
 * Core Domain Entity for managing:
 * - User executors (registered platform users)
 * - External executors (lawyers, family friends, professionals)
 * - Executor appointment and acceptance process
 * - Compensation under Kenyan Law of Succession Act Section 83
 *
 * @class Executor
 * @extends {AggregateRoot}
 */
export class Executor extends AggregateRoot {
  // Core Executor Properties
  private readonly _id: string;
  private readonly _willId: string;
  private readonly _executorInfo: ExecutorInfo;

  // Role Configuration
  private _isPrimary: boolean;
  private _orderOfPriority: number;

  // Appointment Status
  private _status: ExecutorStatus;
  private _appointedAt: Date | null;
  private _acceptedAt: Date | null;
  private _declinedAt: Date | null;
  private _declineReason: string | null;

  // Compensation (Kenyan Law of Succession Act Section 83)
  private _isCompensated: boolean;
  private _compensationAmount: AssetValue | null;

  // Audit Trail
  private _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // PRIVATE CONSTRUCTOR - Enforces use of factory methods
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    willId: string,
    executorInfo: ExecutorInfo,
    isPrimary: boolean = false,
    orderOfPriority: number = 1,
  ) {
    super();

    // Validate required parameters
    if (!id?.trim()) throw new Error('Executor ID is required');
    if (!willId?.trim()) throw new Error('Will ID is required');

    Executor.validateExecutorInfo(executorInfo);

    this._id = id;
    this._willId = willId;
    this._executorInfo = { ...executorInfo };
    this._isPrimary = isPrimary;
    this._orderOfPriority = orderOfPriority;

    // Initialize default values
    this._status = ExecutorStatus.NOMINATED;
    this._appointedAt = null;
    this._acceptedAt = null;
    this._declinedAt = null;
    this._declineReason = null;
    this._isCompensated = false;
    this._compensationAmount = null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS - Domain Lifecycle Management
  // --------------------------------------------------------------------------

  /**
   * Creates an executor assignment for a registered platform user
   *
   * @static
   * @param {string} id - Unique executor identifier
   * @param {string} willId - Will containing the executor nomination
   * @param {string} userId - Registered user ID of executor
   * @param {string} [relationship] - Relationship to testator
   * @param {boolean} [isPrimary=false] - Whether this is primary executor
   * @param {number} [priority=1] - Order of priority (1 = highest)
   * @returns {Executor} New executor entity
   */
  static createForUser(
    id: string,
    willId: string,
    userId: string,
    relationship?: string,
    isPrimary: boolean = false,
    priority: number = 1,
  ): Executor {
    const info: ExecutorInfo = {
      userId: userId.trim(),
      relationship: relationship?.trim(),
    };

    const executor = new Executor(id, willId, info, isPrimary, priority);

    executor.apply(
      new ExecutorNominatedEvent(
        executor._id,
        executor._willId,
        executor._executorInfo,
        'USER',
        executor._isPrimary,
        executor._orderOfPriority,
      ),
    );

    return executor;
  }

  /**
   * Creates an executor assignment for external parties (lawyers, professionals)
   *
   * @static
   * @param {string} id - Unique executor identifier
   * @param {string} willId - Will containing the executor nomination
   * @param {string} fullName - Full name of external executor
   * @param {string} email - Contact email address
   * @param {string} phone - Contact phone number
   * @param {string} [relationship] - Relationship to testator
   * @param {ExecutorContactInfo} [address] - Physical address information
   * @param {boolean} [isPrimary=false] - Whether this is primary executor
   * @param {number} [priority=1] - Order of priority (1 = highest)
   * @returns {Executor} New executor entity
   */
  static createForExternal(
    id: string,
    willId: string,
    fullName: string,
    email: string,
    phone: string,
    relationship?: string,
    address?: ExecutorContactInfo,
    isPrimary: boolean = false,
    priority: number = 1,
  ): Executor {
    const info: ExecutorInfo = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      relationship: relationship?.trim(),
      address: address ? { ...address } : undefined,
    };

    const executor = new Executor(id, willId, info, isPrimary, priority);

    executor.apply(
      new ExecutorNominatedEvent(
        executor._id,
        executor._willId,
        executor._executorInfo,
        'EXTERNAL',
        executor._isPrimary,
        executor._orderOfPriority,
      ),
    );

    return executor;
  }

  /**
   * Reconstructs Executor entity from persistence layer data
   *
   * @static
   * @param {ExecutorReconstituteProps} props - Data from database
   * @returns {Executor} Rehydrated executor entity
   * @throws {Error} When data validation fails during reconstruction
   */
  static reconstitute(props: ExecutorReconstituteProps): Executor {
    // Validate required reconstruction data
    if (!props.id || !props.willId) {
      throw new Error('Invalid reconstruction data: missing required fields');
    }

    Executor.validateExecutorInfo(props.executorInfo);

    const executor = new Executor(
      props.id,
      props.willId,
      props.executorInfo,
      props.isPrimary,
      props.orderOfPriority,
    );

    // Hydrate additional properties with type safety
    executor._status = props.status;
    executor._isCompensated = Boolean(props.isCompensated);
    executor._declineReason = props.declineReason || null;

    // Handle date conversions safely
    executor._appointedAt = props.appointedAt
      ? Executor.safeDateConversion(props.appointedAt, 'appointedAt')
      : null;
    executor._acceptedAt = props.acceptedAt
      ? Executor.safeDateConversion(props.acceptedAt, 'acceptedAt')
      : null;
    executor._declinedAt = props.declinedAt
      ? Executor.safeDateConversion(props.declinedAt, 'declinedAt')
      : null;
    executor._createdAt = Executor.safeDateConversion(props.createdAt, 'createdAt');
    executor._updatedAt = Executor.safeDateConversion(props.updatedAt, 'updatedAt');

    // Handle AssetValue reconstruction if provided
    if (props.compensationAmount) {
      executor._compensationAmount = Executor.reconstructAssetValue(props.compensationAmount);
    }

    return executor;
  }

  /**
   * Safely converts date strings to Date objects with validation
   *
   * @private
   * @static
   * @param {Date | string} dateInput - Date to convert
   * @param {string} fieldName - Field name for error reporting
   * @returns {Date} Valid Date object
   * @throws {Error} When date conversion fails
   */
  private static safeDateConversion(dateInput: Date | string, fieldName: string): Date {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date value for ${fieldName}`);
      }
      return date;
    } catch (error) {
      throw new Error(
        `Failed to convert ${fieldName} to valid Date: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Reconstructs AssetValue from raw data or existing instance
   *
   * @private
   * @static
   * @param {AssetValueData | AssetValue} valueData - Value data to reconstruct
   * @returns {AssetValue} Reconstructed AssetValue instance
   * @throws {Error} When value data is invalid
   */
  private static reconstructAssetValue(valueData: AssetValueData | AssetValue): AssetValue {
    if (valueData instanceof AssetValue) {
      return valueData;
    }

    if (typeof valueData !== 'object' || valueData === null) {
      throw new Error('Invalid asset value data: must be object or AssetValue instance');
    }

    if (typeof valueData.amount !== 'number' || valueData.amount < 0) {
      throw new Error('Invalid asset value: amount must be non-negative number');
    }

    if (typeof valueData.currency !== 'string' || !valueData.currency.trim()) {
      throw new Error('Invalid asset value: currency is required');
    }

    const valuationDate = Executor.safeDateConversion(valueData.valuationDate, 'valuationDate');

    return new AssetValue(valueData.amount, valueData.currency.trim(), valuationDate);
  }

  /**
   * Validates executor identity structure
   *
   * @private
   * @static
   * @param {ExecutorInfo} info - Executor information to validate
   * @throws {Error} When identity structure is invalid
   */
  private static validateExecutorInfo(info: ExecutorInfo): void {
    const hasUserId = Boolean(info.userId?.trim());
    const hasFullName = Boolean(info.fullName?.trim());

    if (!hasUserId && !hasFullName) {
      throw new Error(
        'Executor must have either a User ID (for registered users) or a Full Name (for external parties)',
      );
    }

    // External executors require at least one contact method
    if (!hasUserId && !info.email?.trim() && !info.phone?.trim()) {
      throw new Error('External executors must have at least one contact method (email or phone)');
    }
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC & DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Officially appoints executor (typically by court or testator)
   *
   * @throws {Error} When executor is not in nominated status
   */
  appoint(): void {
    if (this._status !== ExecutorStatus.NOMINATED) {
      throw new Error('Only nominated executors can be officially appointed');
    }

    this._status = ExecutorStatus.ACTIVE;
    this._appointedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Accepts executor role and responsibilities
   *
   * @throws {Error} When executor cannot accept the role
   */
  accept(): void {
    if (this._status !== ExecutorStatus.NOMINATED && this._status !== ExecutorStatus.ACTIVE) {
      throw new Error('Executor must be NOMINATED or ACTIVE to accept the role');
    }

    this._status = ExecutorStatus.ACTIVE;
    this._acceptedAt = new Date();

    // Auto-appoint if not already appointed
    if (!this._appointedAt) {
      this._appointedAt = new Date();
    }

    this._updatedAt = new Date();

    this.apply(new ExecutorAcceptedEvent(this._id, this._willId, this._acceptedAt));
  }

  /**
   * Declines executor role with reason
   *
   * @param {string} reason - Reason for declining the role
   * @throws {Error} When executor cannot decline the role
   */
  decline(reason: string): void {
    if (this._status === ExecutorStatus.DECLINED || this._status === ExecutorStatus.COMPLETED) {
      throw new Error('Cannot decline an already declined or completed executor role');
    }

    if (!reason?.trim()) {
      throw new Error('Decline reason is required');
    }

    this._status = ExecutorStatus.DECLINED;
    this._declinedAt = new Date();
    this._declineReason = reason.trim();
    this._updatedAt = new Date();

    this.apply(new ExecutorDeclinedEvent(this._id, this._willId, this._declineReason));
  }

  /**
   * Removes executor from role with reason
   *
   * @param {string} reason - Reason for removal
   * @throws {Error} When removal reason is not provided
   */
  remove(reason: string): void {
    if (!reason?.trim()) {
      throw new Error('Removal reason is required');
    }

    this._status = ExecutorStatus.REMOVED;
    this._updatedAt = new Date();

    this.apply(new ExecutorRemovedEvent(this._id, this._willId, reason.trim()));
  }

  /**
   * Marks executor duties as completed
   *
   * @throws {Error} When executor is not active
   */
  markAsCompleted(): void {
    if (this._status !== ExecutorStatus.ACTIVE) {
      throw new Error('Only active executors can be marked as completed');
    }

    this._status = ExecutorStatus.COMPLETED;
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // ROLE CONFIGURATION & COMPENSATION
  // --------------------------------------------------------------------------

  /**
   * Marks executor as primary (first in order of priority)
   */
  markAsPrimary(): void {
    this._isPrimary = true;
    this._updatedAt = new Date();
  }

  /**
   * Marks executor as secondary (not primary)
   */
  markAsSecondary(): void {
    this._isPrimary = false;
    this._updatedAt = new Date();
  }

  /**
   * Updates executor priority order
   *
   * @param {number} priority - New priority level (1 = highest)
   * @throws {Error} When priority is less than 1
   */
  updatePriority(priority: number): void {
    if (priority < 1) {
      throw new Error('Priority must be at least 1');
    }

    this._orderOfPriority = priority;
    this._updatedAt = new Date();
  }

  /**
   * Sets compensation amount under Kenyan Law of Succession Act Section 83
   *
   * @param {AssetValue} amount - Compensation amount
   * @throws {Error} When executor cannot be compensated
   */
  setCompensation(amount: AssetValue): void {
    if (!this.canBeCompensated()) {
      throw new Error('Only active or completed executors can be compensated');
    }

    if (amount.getAmount() <= 0) {
      throw new Error('Compensation amount must be positive');
    }

    this._isCompensated = true;
    this._compensationAmount = amount;
    this._updatedAt = new Date();
  }

  /**
   * Removes compensation from executor
   */
  removeCompensation(): void {
    this._isCompensated = false;
    this._compensationAmount = null;
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // DOMAIN CALCULATIONS & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Determines if executor is currently active
   *
   * @returns {boolean} True if executor is active
   */
  isActive(): boolean {
    return this._status === ExecutorStatus.ACTIVE;
  }

  /**
   * Determines if executor is nominated but not yet active
   *
   * @returns {boolean} True if executor is nominated
   */
  isNominated(): boolean {
    return this._status === ExecutorStatus.NOMINATED;
  }

  /**
   * Determines if executor has completed duties
   *
   * @returns {boolean} True if executor duties are completed
   */
  isCompleted(): boolean {
    return this._status === ExecutorStatus.COMPLETED;
  }

  /**
   * Determines if executor has been removed
   *
   * @returns {boolean} True if executor is removed
   */
  isRemoved(): boolean {
    return this._status === ExecutorStatus.REMOVED;
  }

  /**
   * Determines if executor has accepted the role
   *
   * @returns {boolean} True if executor has accepted
   */
  hasAccepted(): boolean {
    return Boolean(this._acceptedAt);
  }

  /**
   * Determines if executor can accept the role
   *
   * @returns {boolean} True if executor can accept
   */
  canAccept(): boolean {
    return this._status === ExecutorStatus.NOMINATED || this._status === ExecutorStatus.ACTIVE;
  }

  /**
   * Determines if executor can decline the role
   *
   * @returns {boolean} True if executor can decline
   */
  canDecline(): boolean {
    return this._status !== ExecutorStatus.DECLINED && this._status !== ExecutorStatus.COMPLETED;
  }

  /**
   * Determines if executor requires court appointment under Kenyan law
   *
   * @returns {boolean} True if court appointment is required
   */
  requiresCourtAppointment(): boolean {
    return this._isPrimary && !this._appointedAt;
  }

  /**
   * Determines if executor can be compensated
   *
   * @returns {boolean} True if executor can receive compensation
   */
  canBeCompensated(): boolean {
    return this.isActive() || this.isCompleted();
  }

  /**
   * Determines if executor is fully configured with required information
   *
   * @returns {boolean} True if executor is fully configured
   */
  isFullyConfigured(): boolean {
    const hasRequiredInfo = Boolean(
      this._executorInfo.userId ||
        (this._executorInfo.fullName && (this._executorInfo.email || this._executorInfo.phone)),
    );

    return hasRequiredInfo && this._orderOfPriority >= 1;
  }

  /**
   * Gets formatted contact information for display
   *
   * @returns {string} Formatted contact information
   */
  getContactInfo(): string {
    if (this._executorInfo.email && this._executorInfo.phone) {
      return `${this._executorInfo.email} / ${this._executorInfo.phone}`;
    }

    return this._executorInfo.email || this._executorInfo.phone || 'No contact information';
  }

  /**
   * Validates if executor is valid for official appointment
   *
   * @returns {boolean} True if valid for appointment
   */
  isValidForAppointment(): boolean {
    return this.isNominated() && this.isFullyConfigured();
  }

  /**
   * Determines if executor can assume official duties
   *
   * @returns {boolean} True if executor can assume duties
   */
  canAssumeDuties(): boolean {
    return this.isActive() && this.hasAccepted() && Boolean(this._appointedAt);
  }

  /**
   * Validates compensation configuration
   *
   * @returns {boolean} True if compensation is valid
   */
  hasValidCompensation(): boolean {
    if (!this._isCompensated || !this._compensationAmount) {
      return true; // No compensation is valid
    }

    try {
      return this._compensationAmount.getAmount() > 0;
    } catch {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // IMMUTABLE GETTERS - Provide read-only access to entity state
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }
  get willId(): string {
    return this._willId;
  }
  get executorInfo(): ExecutorInfo {
    return { ...this._executorInfo };
  }
  get isPrimary(): boolean {
    return this._isPrimary;
  }
  get orderOfPriority(): number {
    return this._orderOfPriority;
  }
  get status(): ExecutorStatus {
    return this._status;
  }
  get appointedAt(): Date | null {
    return this._appointedAt ? new Date(this._appointedAt) : null;
  }
  get acceptedAt(): Date | null {
    return this._acceptedAt ? new Date(this._acceptedAt) : null;
  }
  get declinedAt(): Date | null {
    return this._declinedAt ? new Date(this._declinedAt) : null;
  }
  get declineReason(): string | null {
    return this._declineReason;
  }
  get isCompensated(): boolean {
    return this._isCompensated;
  }
  get compensationAmount(): AssetValue | null {
    return this._compensationAmount;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
  get fullName(): string | undefined {
    return this._executorInfo.fullName;
  }
  get email(): string | undefined {
    return this._executorInfo.email;
  }
  get phone(): string | undefined {
    return this._executorInfo.phone;
  }
  get relationship(): string | undefined {
    return this._executorInfo.relationship;
  }
  get address(): ExecutorContactInfo | undefined {
    return this._executorInfo.address ? { ...this._executorInfo.address } : undefined;
  }
  get userId(): string | undefined {
    return this._executorInfo.userId;
  }
}
