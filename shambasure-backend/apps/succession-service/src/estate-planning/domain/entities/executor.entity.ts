import { AggregateRoot } from '@nestjs/cqrs';
import { ExecutorStatus } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';
import { ExecutorNominatedEvent } from '../events/executor-nominated.event';
import { ExecutorAcceptedEvent } from '../events/executor-accepted.event';
import { ExecutorDeclinedEvent } from '../events/executor-declined.event';
import { ExecutorRemovedEvent } from '../events/executor-removed.event';

export interface ExecutorInfo {
  userId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  address?: {
    street?: string;
    city?: string;
    county?: string;
    postalCode?: string;
  };
}

// Interface for AssetValue data structure
export interface AssetValueData {
  amount: number;
  currency: string;
  valuationDate: Date | string;
}

// Interface for reconstitute method
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

export class Executor extends AggregateRoot {
  private id: string;
  private willId: string;
  private executorInfo: ExecutorInfo;

  // Configuration
  private isPrimary: boolean;
  private orderOfPriority: number;

  // State
  private status: ExecutorStatus;
  private appointedAt: Date | null;
  private acceptedAt: Date | null;
  private declinedAt: Date | null;
  private declineReason: string | null;

  // Compensation (Section 83)
  private isCompensated: boolean;
  private compensationAmount: AssetValue | null;

  private createdAt: Date;
  private updatedAt: Date;

  // Private constructor forces use of static factories
  private constructor(
    id: string,
    willId: string,
    executorInfo: ExecutorInfo,
    isPrimary: boolean = false,
    orderOfPriority: number = 1,
  ) {
    super();
    this.validateExecutorInfo(executorInfo);

    this.id = id;
    this.willId = willId;
    this.executorInfo = { ...executorInfo };
    this.isPrimary = isPrimary;
    this.orderOfPriority = orderOfPriority;

    // Default values
    this.status = ExecutorStatus.NOMINATED;
    this.appointedAt = null;
    this.acceptedAt = null;
    this.declinedAt = null;
    this.declineReason = null;
    this.isCompensated = false;
    this.compensationAmount = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // 1. FACTORY METHODS
  // --------------------------------------------------------------------------

  static createForUser(
    id: string,
    willId: string,
    userId: string,
    relationship?: string,
    isPrimary: boolean = false,
    priority: number = 1,
  ): Executor {
    const info: ExecutorInfo = { userId, relationship };
    const executor = new Executor(id, willId, info, isPrimary, priority);

    executor.apply(
      new ExecutorNominatedEvent(id, willId, { userId, relationship }, 'USER', isPrimary, priority),
    );

    return executor;
  }

  static createForExternal(
    id: string,
    willId: string,
    fullName: string,
    email: string,
    phone: string,
    relationship?: string,
    address?: ExecutorInfo['address'],
    isPrimary: boolean = false,
    priority: number = 1,
  ): Executor {
    const info: ExecutorInfo = { fullName, email, phone, relationship, address };
    const executor = new Executor(id, willId, info, isPrimary, priority);

    executor.apply(
      new ExecutorNominatedEvent(
        id,
        willId,
        { fullName, email, phone, relationship },
        'EXTERNAL',
        isPrimary,
        priority,
      ),
    );

    return executor;
  }

  /**
   * Rehydrate from Database (No Events)
   */
  static reconstitute(props: ExecutorReconstituteProps): Executor {
    const executor = new Executor(
      props.id,
      props.willId,
      props.executorInfo,
      props.isPrimary,
      props.orderOfPriority,
    );

    // Hydrate properties safely with proper typing
    executor.status = props.status;
    executor.isCompensated = props.isCompensated;
    executor.declineReason = props.declineReason;

    // Handle date conversions safely
    executor.appointedAt = props.appointedAt ? new Date(props.appointedAt) : null;
    executor.acceptedAt = props.acceptedAt ? new Date(props.acceptedAt) : null;
    executor.declinedAt = props.declinedAt ? new Date(props.declinedAt) : null;
    executor.createdAt = new Date(props.createdAt);
    executor.updatedAt = new Date(props.updatedAt);

    // Handle AssetValue reconstruction if provided
    if (props.compensationAmount) {
      executor.compensationAmount = Executor.reconstructAssetValue(props.compensationAmount);
    }

    return executor;
  }

  /**
   * Helper method to reconstruct AssetValue from raw data or existing instance
   */
  private static reconstructAssetValue(valueData: AssetValueData | AssetValue): AssetValue {
    if (valueData instanceof AssetValue) {
      return valueData;
    }

    // Handle raw data object with proper typing
    const valuationDate =
      typeof valueData.valuationDate === 'string'
        ? new Date(valueData.valuationDate)
        : valueData.valuationDate;

    return new AssetValue(valueData.amount, valueData.currency, valuationDate);
  }

  // --------------------------------------------------------------------------
  // 2. BUSINESS LOGIC & STATE TRANSITIONS
  // --------------------------------------------------------------------------

  appoint(): void {
    if (this.status !== ExecutorStatus.NOMINATED) {
      throw new Error('Only nominated executors can be officially appointed.');
    }

    this.status = ExecutorStatus.ACTIVE;
    this.appointedAt = new Date();
    this.updatedAt = new Date();
  }

  accept(): void {
    if (this.status !== ExecutorStatus.NOMINATED && this.status !== ExecutorStatus.ACTIVE) {
      throw new Error('Executor must be NOMINATED or ACTIVE to accept the role.');
    }

    this.status = ExecutorStatus.ACTIVE;
    this.acceptedAt = new Date();

    if (!this.appointedAt) {
      this.appointedAt = new Date();
    }

    this.updatedAt = new Date();
    this.apply(new ExecutorAcceptedEvent(this.id, this.willId, this.acceptedAt));
  }

  decline(reason: string): void {
    if (this.status === ExecutorStatus.DECLINED || this.status === ExecutorStatus.COMPLETED) {
      throw new Error('Cannot decline an already declined or completed executor role.');
    }

    this.status = ExecutorStatus.DECLINED;
    this.declinedAt = new Date();
    this.declineReason = reason;
    this.updatedAt = new Date();

    this.apply(new ExecutorDeclinedEvent(this.id, this.willId, reason));
  }

  remove(reason: string): void {
    this.status = ExecutorStatus.REMOVED;
    this.updatedAt = new Date();
    this.apply(new ExecutorRemovedEvent(this.id, this.willId, reason));
  }

  markAsCompleted(): void {
    if (this.status !== ExecutorStatus.ACTIVE) {
      throw new Error('Only active executors can be marked as completed.');
    }
    this.status = ExecutorStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // 3. CONFIGURATION & COMPENSATION
  // --------------------------------------------------------------------------

  markAsPrimary(): void {
    this.isPrimary = true;
    this.updatedAt = new Date();
  }

  markAsSecondary(): void {
    this.isPrimary = false;
    this.updatedAt = new Date();
  }

  updatePriority(priority: number): void {
    if (priority < 1) throw new Error('Priority must be at least 1.');
    this.orderOfPriority = priority;
    this.updatedAt = new Date();
  }

  setCompensation(amount: AssetValue): void {
    this.isCompensated = true;
    this.compensationAmount = amount;
    this.updatedAt = new Date();
  }

  removeCompensation(): void {
    this.isCompensated = false;
    this.compensationAmount = null;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // 4. VALIDATION & HELPERS
  // --------------------------------------------------------------------------

  private validateExecutorInfo(info: ExecutorInfo): void {
    const hasUserId = !!info.userId;
    const hasFullName = !!info.fullName;

    if (!hasUserId && !hasFullName) {
      throw new Error(
        'Executor must have either a User ID (for registered users) or a Full Name (for external parties).',
      );
    }

    // External executors need contact info - updated logic to require at least one contact method
    if (!hasUserId && !info.email && !info.phone) {
      throw new Error('External executors must have at least one contact method (email or phone).');
    }
  }

  // --------------------------------------------------------------------------
  // 5. GETTERS & HELPER METHODS
  // --------------------------------------------------------------------------

  // Core Properties
  getId(): string {
    return this.id;
  }

  getWillId(): string {
    return this.willId;
  }

  getExecutorInfo(): ExecutorInfo {
    return { ...this.executorInfo };
  }

  getIsPrimary(): boolean {
    return this.isPrimary;
  }

  getOrderOfPriority(): number {
    return this.orderOfPriority;
  }

  getStatus(): ExecutorStatus {
    return this.status;
  }

  getAppointedAt(): Date | null {
    return this.appointedAt ? new Date(this.appointedAt) : null;
  }

  getAcceptedAt(): Date | null {
    return this.acceptedAt ? new Date(this.acceptedAt) : null;
  }

  getDeclinedAt(): Date | null {
    return this.declinedAt ? new Date(this.declinedAt) : null;
  }

  getDeclineReason(): string | null {
    return this.declineReason;
  }

  getIsCompensated(): boolean {
    return this.isCompensated;
  }

  getCompensationAmount(): AssetValue | null {
    return this.compensationAmount;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // Additional computed getters for business logic
  isActive(): boolean {
    return this.status === ExecutorStatus.ACTIVE;
  }

  isNominated(): boolean {
    return this.status === ExecutorStatus.NOMINATED;
  }

  isCompleted(): boolean {
    return this.status === ExecutorStatus.COMPLETED;
  }

  isRemoved(): boolean {
    return this.status === ExecutorStatus.REMOVED;
  }

  hasAccepted(): boolean {
    return !!this.acceptedAt;
  }

  canAccept(): boolean {
    return this.status === ExecutorStatus.NOMINATED || this.status === ExecutorStatus.ACTIVE;
  }

  canDecline(): boolean {
    return this.status !== ExecutorStatus.DECLINED && this.status !== ExecutorStatus.COMPLETED;
  }

  // Detailed info getters
  getFullName(): string | undefined {
    return this.executorInfo.fullName;
  }

  getEmail(): string | undefined {
    return this.executorInfo.email;
  }

  getPhone(): string | undefined {
    return this.executorInfo.phone;
  }

  getRelationship(): string | undefined {
    return this.executorInfo.relationship;
  }

  getAddress(): ExecutorInfo['address'] | undefined {
    return this.executorInfo.address ? { ...this.executorInfo.address } : undefined;
  }

  getUserId(): string | undefined {
    return this.executorInfo.userId;
  }

  // Business logic helpers
  requiresCourtAppointment(): boolean {
    // In some jurisdictions, primary executors might require court appointment
    return this.isPrimary && !this.appointedAt;
  }

  canBeCompensated(): boolean {
    // Only active or completed executors can be compensated
    return this.isActive() || this.isCompleted();
  }

  isFullyConfigured(): boolean {
    // Check if executor has all required information with proper boolean conversion
    const hasRequiredInfo =
      Boolean(this.executorInfo.userId) ||
      (Boolean(this.executorInfo.fullName) &&
        (Boolean(this.executorInfo.email) || Boolean(this.executorInfo.phone)));

    return hasRequiredInfo && this.orderOfPriority >= 1;
  }

  getContactInfo(): string {
    if (this.executorInfo.email && this.executorInfo.phone) {
      return `${this.executorInfo.email} / ${this.executorInfo.phone}`;
    }
    return this.executorInfo.email || this.executorInfo.phone || 'No contact info';
  }

  // Validation methods
  isValidForAppointment(): boolean {
    return this.isNominated() && this.isFullyConfigured();
  }

  canAssumeDuties(): boolean {
    return this.isActive() && this.hasAccepted() && !!this.appointedAt;
  }

  // Compensation validation
  hasValidCompensation(): boolean {
    if (!this.isCompensated || !this.compensationAmount) {
      return true; // No compensation is valid
    }

    try {
      // Validate that compensation amount is positive
      return this.compensationAmount.getAmount() > 0;
    } catch {
      return false;
    }
  }
}
