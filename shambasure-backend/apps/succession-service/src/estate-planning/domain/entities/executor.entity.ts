import { ExecutorStatus } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';

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

export class Executor {
  private id: string;
  private willId: string;
  private executorInfo: ExecutorInfo;
  private isPrimary: boolean;
  private orderOfPriority: number;
  private status: ExecutorStatus;
  private appointedAt: Date | null;
  private acceptedAt: Date | null;
  private declinedAt: Date | null;
  private declineReason: string | null;
  private isCompensated: boolean;
  private compensationAmount: AssetValue | null;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    willId: string,
    executorInfo: ExecutorInfo,
    isPrimary: boolean = false,
    orderOfPriority: number = 1,
  ) {
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

  // Getters
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

  // Business methods
  markAsPrimary(): void {
    this.isPrimary = true;
    this.updatedAt = new Date();
  }

  markAsSecondary(): void {
    this.isPrimary = false;
    this.updatedAt = new Date();
  }

  updatePriority(priority: number): void {
    if (priority < 1) {
      throw new Error('Priority must be at least 1');
    }
    this.orderOfPriority = priority;
    this.updatedAt = new Date();
  }

  appoint(): void {
    if (this.status !== ExecutorStatus.NOMINATED) {
      throw new Error('Only nominated executors can be appointed');
    }

    this.status = ExecutorStatus.ACTIVE;
    this.appointedAt = new Date();
    this.updatedAt = new Date();
  }

  accept(): void {
    if (this.status !== ExecutorStatus.NOMINATED && this.status !== ExecutorStatus.ACTIVE) {
      throw new Error('Executor must be nominated or active to accept');
    }

    this.status = ExecutorStatus.ACTIVE;
    this.acceptedAt = new Date();

    if (!this.appointedAt) {
      this.appointedAt = new Date();
    }

    this.updatedAt = new Date();
  }

  decline(reason: string): void {
    if (this.status === ExecutorStatus.DECLINED || this.status === ExecutorStatus.COMPLETED) {
      throw new Error('Cannot decline an already declined or completed executor');
    }

    this.status = ExecutorStatus.DECLINED;
    this.declinedAt = new Date();
    this.declineReason = reason;
    this.updatedAt = new Date();
  }

  remove(): void {
    this.status = ExecutorStatus.REMOVED;
    this.updatedAt = new Date();
  }

  markAsCompleted(): void {
    if (this.status !== ExecutorStatus.ACTIVE) {
      throw new Error('Only active executors can be marked as completed');
    }

    this.status = ExecutorStatus.COMPLETED;
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

  // Validation methods
  private validateExecutorInfo(info: ExecutorInfo): void {
    const hasUserId = !!info.userId;
    const hasFullName = !!info.fullName;

    if (!hasUserId && !hasFullName) {
      throw new Error('Executor must have either user ID or full name');
    }

    if (hasUserId && hasFullName) {
      throw new Error('Executor cannot have both user ID and external name');
    }

    if (!hasUserId && (!info.email || !info.phone)) {
      throw new Error('External executors must have email and phone contact information');
    }
  }

  isExternal(): boolean {
    return !!this.executorInfo.fullName;
  }

  isActive(): boolean {
    return this.status === ExecutorStatus.ACTIVE;
  }

  hasAccepted(): boolean {
    return !!this.acceptedAt;
  }

  canAct(): boolean {
    return this.isActive() && this.hasAccepted();
  }

  getExecutorName(): string {
    if (this.executorInfo.fullName) {
      return this.executorInfo.fullName;
    }
    // In real implementation, we'd fetch the name from user service
    return `Executor ${this.id.substring(0, 8)}`;
  }

  // Static factory methods
  static createForUser(
    id: string,
    willId: string,
    userId: string,
    relationship?: string,
    isPrimary: boolean = false,
    priority: number = 1,
  ): Executor {
    const executorInfo: ExecutorInfo = {
      userId,
      relationship,
    };

    return new Executor(id, willId, executorInfo, isPrimary, priority);
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
    const executorInfo: ExecutorInfo = {
      fullName,
      email,
      phone,
      relationship,
      address,
    };

    return new Executor(id, willId, executorInfo, isPrimary, priority);
  }
}
