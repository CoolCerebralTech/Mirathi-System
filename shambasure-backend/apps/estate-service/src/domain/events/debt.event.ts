// src/estate-service/src/domain/entities/events/debt.event.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Base Debt Event
 */
export abstract class DebtEvent<T = any> extends DomainEvent<T> {
  constructor(aggregateId: string, version: number, payload: T, occurredAt?: Date) {
    super(aggregateId, 'Debt', version, payload, occurredAt);
  }
}

/**
 * Debt Created Event
 * Triggered when a new debt is added to the estate
 */
export class DebtCreatedEvent extends DebtEvent<{
  debtId: string;
  estateId: string;
  description: string;
  type: string;
  amount: number;
  currency: string;
  tier: string;
  priority: string;
  creditorName: string;
  isSecured: boolean;
  securedAssetId?: string;
  createdBy: string;
}> {
  constructor(
    debtId: string,
    estateId: string,
    description: string,
    type: string,
    amount: number,
    currency: string,
    tier: string,
    priority: string,
    creditorName: string,
    isSecured: boolean,
    securedAssetId: string | undefined,
    createdBy: string,
    version: number,
  ) {
    super(debtId, version, {
      debtId,
      estateId,
      description,
      type,
      amount,
      currency,
      tier,
      priority,
      creditorName,
      isSecured,
      securedAssetId,
      createdBy,
    });
  }
}

/**
 * Debt Payment Recorded Event
 * Triggered when a payment is made toward a debt
 */
export class DebtPaymentRecordedEvent extends DebtEvent<{
  debtId: string;
  estateId: string;
  paymentAmount: number;
  currency: string;
  oldBalance: number;
  newBalance: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber?: string;
  paidBy: string;
}> {
  constructor(
    debtId: string,
    estateId: string,
    paymentAmount: number,
    currency: string,
    oldBalance: number,
    newBalance: number,
    paymentDate: Date,
    paymentMethod: string,
    referenceNumber: string | undefined,
    paidBy: string,
    version: number,
  ) {
    super(debtId, version, {
      debtId,
      estateId,
      paymentAmount,
      currency,
      oldBalance,
      newBalance,
      paymentDate,
      paymentMethod,
      referenceNumber,
      paidBy,
    });
  }
}

/**
 * Debt Settled Event
 * Triggered when a debt is fully paid off
 */
export class DebtSettledEvent extends DebtEvent<{
  debtId: string;
  estateId: string;
  originalAmount: number;
  totalPaid: number;
  currency: string;
  settlementDate: Date;
  settledBy: string;
  notes?: string;
}> {
  constructor(
    debtId: string,
    estateId: string,
    originalAmount: number,
    totalPaid: number,
    currency: string,
    settlementDate: Date,
    settledBy: string,
    notes: string | undefined,
    version: number,
  ) {
    super(debtId, version, {
      debtId,
      estateId,
      originalAmount,
      totalPaid,
      currency,
      settlementDate,
      settledBy,
      notes,
    });
  }
}

/**
 * Debt Written Off Event
 * Triggered when a debt is written off (e.g., statute barred, uncollectible)
 */
export class DebtWrittenOffEvent extends DebtEvent<{
  debtId: string;
  estateId: string;
  writtenOffAmount: number;
  currency: string;
  writeOffReason: string;
  writtenOffBy: string;
  writeOffDate: Date;
  notes?: string;
}> {
  constructor(
    debtId: string,
    estateId: string,
    writtenOffAmount: number,
    currency: string,
    writeOffReason: string,
    writtenOffBy: string,
    writeOffDate: Date,
    notes: string | undefined,
    version: number,
  ) {
    super(debtId, version, {
      debtId,
      estateId,
      writtenOffAmount,
      currency,
      writeOffReason,
      writtenOffBy,
      writeOffDate,
      notes,
    });
  }
}

/**
 * Debt Disputed Event
 * Triggered when a debt is disputed (creditor challenge)
 */
export class DebtDisputedEvent extends DebtEvent<{
  debtId: string;
  estateId: string;
  disputedBy: string;
  disputeReason: string;
  disputeDate: Date;
  evidence?: string[];
}> {
  constructor(
    debtId: string,
    estateId: string,
    disputedBy: string,
    disputeReason: string,
    disputeDate: Date,
    evidence: string[] | undefined,
    version: number,
  ) {
    super(debtId, version, {
      debtId,
      estateId,
      disputedBy,
      disputeReason,
      disputeDate,
      evidence,
    });
  }
}

/**
 * Debt Priority Changed Event
 * Triggered when debt priority changes (e.g., becomes statute barred)
 */
export class DebtPriorityChangedEvent extends DebtEvent<{
  debtId: string;
  estateId: string;
  oldPriority: string;
  newPriority: string;
  oldTier: string;
  newTier: string;
  changedBy: string;
  reason: string;
}> {
  constructor(
    debtId: string,
    estateId: string,
    oldPriority: string,
    newPriority: string,
    oldTier: string,
    newTier: string,
    changedBy: string,
    reason: string,
    version: number,
  ) {
    super(debtId, version, {
      debtId,
      estateId,
      oldPriority,
      newPriority,
      oldTier,
      newTier,
      changedBy,
      reason,
    });
  }
}

/**
 * Debt Transferred Event
 * Triggered when debt is transferred to another party
 */
export class DebtTransferredEvent extends DebtEvent<{
  debtId: string;
  estateId: string;
  oldCreditor: string;
  newCreditor: string;
  transferDate: Date;
  transferredBy: string;
  transferDocumentRef?: string;
}> {
  constructor(
    debtId: string,
    estateId: string,
    oldCreditor: string,
    newCreditor: string,
    transferDate: Date,
    transferredBy: string,
    transferDocumentRef: string | undefined,
    version: number,
  ) {
    super(debtId, version, {
      debtId,
      estateId,
      oldCreditor,
      newCreditor,
      transferDate,
      transferredBy,
      transferDocumentRef,
    });
  }
}
