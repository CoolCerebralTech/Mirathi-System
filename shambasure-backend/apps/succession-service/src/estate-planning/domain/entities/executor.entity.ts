import { AggregateRoot } from '@nestjs/cqrs';
import { ExecutorStatus } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';
import { ExecutorNominatedEvent } from '../events/executor-nominated.event';
import { ExecutorAcceptedEvent } from '../events/executor-accepted.event';
import { ExecutorDeclinedEvent } from '../events/executor-declined.event';
import { ExecutorRemovedEvent } from '../events/executor-removed.event';

export interface ExecutorInfo {
  userId?: string;
  fullName?: string; // Required if userId is missing
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
  // FACTORY METHODS
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

    // Fixed: Pass executorInfo object instead of userId string
    executor.apply(
      new ExecutorNominatedEvent(
        id,
        willId,
        { userId }, // executorInfo object
        'USER',
        isPrimary,
      ),
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

    // Fixed: Pass executorInfo object instead of email string
    executor.apply(
      new ExecutorNominatedEvent(
        id,
        willId,
        { fullName, email, phone }, // executorInfo object
        'EXTERNAL',
        isPrimary,
      ),
    );

    return executor;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC & STATE TRANSITIONS
  // --------------------------------------------------------------------------

  appoint(): void {
    if (this.status !== ExecutorStatus.NOMINATED) {
      throw new Error('Only nominated executors can be officially appointed.');
    }

    this.status = ExecutorStatus.ACTIVE;
    this.appointedAt = new Date();
    this.updatedAt = new Date();
    // We don't necessarily emit an event here if "appoint" implies just setting the flag,
    // but if it's a legal court appointment, we would.
  }

  accept(): void {
    if (this.status !== ExecutorStatus.NOMINATED && this.status !== ExecutorStatus.ACTIVE) {
      throw new Error('Executor must be NOMINATED or ACTIVE to accept the role.');
    }

    this.status = ExecutorStatus.ACTIVE;
    this.acceptedAt = new Date();

    // If they accepted, they are implicitly appointed if not already
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
  // CONFIGURATION & COMPENSATION
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
    // Typically court approved, but modelled here
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
  // VALIDATION & HELPERS
  // --------------------------------------------------------------------------

  private validateExecutorInfo(info: ExecutorInfo): void {
    const hasUserId = !!info.userId;
    const hasFullName = !!info.fullName;

    if (!hasUserId && !hasFullName) {
      throw new Error(
        'Executor must have either a User ID (for registered users) or a Full Name (for external parties).',
      );
    }

    // External executors need contact info
    if (!hasUserId && (!info.email || !info.phone)) {
      throw new Error('External executors must have valid contact information (email or phone).');
    }
  }

  isActive(): boolean {
    return this.status === ExecutorStatus.ACTIVE;
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

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

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
  isNominated(): boolean {
    return this.status === ExecutorStatus.NOMINATED;
  }

  isCompleted(): boolean {
    return this.status === ExecutorStatus.COMPLETED;
  }

  isRemoved(): boolean {
    return this.status === ExecutorStatus.REMOVED;
  }

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
}
