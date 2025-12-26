// src/estate-service/src/domain/events/estate.events.ts
import { DomainEvent } from '../base/domain-event';
import { DependantRelationship } from '../entities/legal-dependant.entity';
import { AssetStatus } from '../enums/asset-status.enum';
import { DebtType } from '../enums/debt-type.enum';
import { LiquidationType } from '../enums/liquidation-type.enum';

// ===========================================================================
// CORE ESTATE EVENTS
// ===========================================================================

/**
 * Estate Created Event
 *
 * Triggered when a new estate is registered in the system.
 */
export class EstateCreatedEvent extends DomainEvent<{
  name: string;
  deceasedId: string;
  deceasedName: string;
  createdBy: string;
  dateOfDeath: Date;
}> {
  constructor(
    aggregateId: string,
    name: string,
    deceasedId: string,
    deceasedName: string,
    createdBy: string,
    version: number,
    dateOfDeath: Date = new Date(),
  ) {
    super(aggregateId, 'Estate', version, {
      name,
      deceasedId,
      deceasedName,
      createdBy,
      dateOfDeath,
    });
  }
}

/**
 * Estate Frozen Event
 *
 * Triggered when estate administration is halted due to dispute, court order, or risk.
 */
export class EstateFrozenEvent extends DomainEvent<{
  reason: string;
  frozenBy: string;
  timestamp: Date;
}> {
  constructor(aggregateId: string, reason: string, frozenBy: string, version: number) {
    super(aggregateId, 'Estate', version, {
      reason,
      frozenBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Unfrozen Event
 *
 * Triggered when estate administration resumes after being frozen.
 */
export class EstateUnfrozenEvent extends DomainEvent<{
  reason: string;
  unfrozenBy: string;
  timestamp: Date;
}> {
  constructor(aggregateId: string, reason: string, unfrozenBy: string, version: number) {
    super(aggregateId, 'Estate', version, {
      reason,
      unfrozenBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Insolvency Detected Event
 *
 * Triggered when estate liabilities exceed assets.
 */
export class EstateInsolvencyDetectedEvent extends DomainEvent<{
  netWorth: number;
  debtCount: number;
  timestamp: Date;
}> {
  constructor(aggregateId: string, netWorth: number, debtCount: number, version: number) {
    super(aggregateId, 'Estate', version, {
      netWorth,
      debtCount,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Ready for Distribution Event
 *
 * Triggered when estate passes all validation checks and is ready for distribution.
 */
export class EstateReadyForDistributionEvent extends DomainEvent<{
  distributablePool: number;
  dependantCount: number;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    distributablePool: number,
    dependantCount: number,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      distributablePool,
      dependantCount,
      timestamp: new Date(),
    });
  }
}

// ===========================================================================
// ASSET MANAGEMENT EVENTS
// ===========================================================================

/**
 * Estate Asset Added Event
 *
 * Triggered when a new asset is added to the estate.
 */
export class EstateAssetAddedEvent extends DomainEvent<{
  assetId: string;
  assetType: string;
  value: number;
  addedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    assetId: string,
    assetType: string,
    value: number,
    addedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      assetId,
      assetType,
      value,
      addedBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Asset Updated Event
 *
 * Triggered when an asset's value or status changes.
 */
export class EstateAssetUpdatedEvent extends DomainEvent<{
  assetId: string;
  oldValue: number;
  newValue: number;
  oldStatus: AssetStatus;
  newStatus: AssetStatus;
  updatedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    assetId: string,
    oldValue: number,
    newValue: number,
    oldStatus: AssetStatus,
    newStatus: AssetStatus,
    updatedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      assetId,
      oldValue,
      newValue,
      oldStatus,
      newStatus,
      updatedBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Asset Removed Event
 *
 * Triggered when an asset is removed from the estate (sold, transferred, etc.).
 */
export class EstateAssetRemovedEvent extends DomainEvent<{
  assetId: string;
  reason: string;
  valueAtRemoval: number;
  removedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    assetId: string,
    reason: string,
    valueAtRemoval: number,
    removedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      assetId,
      reason,
      valueAtRemoval,
      removedBy,
      timestamp: new Date(),
    });
  }
}

// ===========================================================================
// DEBT MANAGEMENT EVENTS
// ===========================================================================

/**
 * Estate Debt Added Event
 *
 * Triggered when a new debt is added to the estate.
 */
export class EstateDebtAddedEvent extends DomainEvent<{
  debtId: string;
  debtType: DebtType;
  amount: number;
  priority: number;
  creditorName: string;
  addedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    debtId: string,
    debtType: DebtType,
    amount: number,
    priority: number,
    addedBy: string,
    version: number,
    creditorName?: string,
  ) {
    super(aggregateId, 'Estate', version, {
      debtId,
      debtType,
      amount,
      priority,
      creditorName: creditorName || 'Unknown',
      addedBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Debt Paid Event
 *
 * Triggered when a debt payment is made.
 */
export class EstateDebtPaidEvent extends DomainEvent<{
  debtId: string;
  amount: number;
  priority: number;
  paidBy: string;
  remainingBalance: number;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    debtId: string,
    amount: number,
    priority: number,
    paidBy: string,
    version: number,
    remainingBalance?: number,
  ) {
    super(aggregateId, 'Estate', version, {
      debtId,
      amount,
      priority,
      paidBy,
      remainingBalance: remainingBalance || 0,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Debt Settled Event
 *
 * Triggered when a debt is fully settled.
 */
export class EstateDebtSettledEvent extends DomainEvent<{
  debtId: string;
  creditorName: string;
  totalPaid: number;
  settledBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    debtId: string,
    creditorName: string,
    totalPaid: number,
    settledBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      debtId,
      creditorName,
      totalPaid,
      settledBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Debt Disputed Event
 *
 * Triggered when a debt is disputed.
 */
export class EstateDebtDisputedEvent extends DomainEvent<{
  debtId: string;
  reason: string;
  disputedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    debtId: string,
    reason: string,
    disputedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      debtId,
      reason,
      disputedBy,
      timestamp: new Date(),
    });
  }
}

// ===========================================================================
// GIFT MANAGEMENT EVENTS
// ===========================================================================

/**
 * Estate Gift Added Event
 *
 * Triggered when a gift inter vivos is added for hotchpot calculation.
 */
export class EstateGiftAddedEvent extends DomainEvent<{
  giftId: string;
  value: number;
  recipientId: string;
  addedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    giftId: string,
    value: number,
    recipientId: string,
    addedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      giftId,
      value,
      recipientId,
      addedBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Gift Contested Event
 *
 * Triggered when a gift is contested by other heirs.
 */
export class EstateGiftContestedEvent extends DomainEvent<{
  giftId: string;
  reason: string;
  contestedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    giftId: string,
    reason: string,
    contestedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      giftId,
      reason,
      contestedBy,
      timestamp: new Date(),
    });
  }
}

// ===========================================================================
// DEPENDANT MANAGEMENT EVENTS
// ===========================================================================

/**
 * Estate Dependant Added Event
 *
 * Triggered when a new dependant claim is added.
 */
export class EstateDependantAddedEvent extends DomainEvent<{
  dependantId: string;
  relationship: DependantRelationship;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  addedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    dependantId: string,
    relationship: DependantRelationship,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    addedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      dependantId,
      relationship,
      riskLevel,
      addedBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Dependant Verified Event
 *
 * Triggered when a dependant claim is verified.
 */
export class EstateDependantVerifiedEvent extends DomainEvent<{
  dependantId: string;
  verifiedBy: string;
  verificationNotes?: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    dependantId: string,
    verifiedBy: string,
    version: number,
    verificationNotes?: string,
  ) {
    super(aggregateId, 'Estate', version, {
      dependantId,
      verifiedBy,
      verificationNotes,
      timestamp: new Date(),
    });
  }
}
/**
 * Estate Liquidated Event
 *
 * Triggered when an asset liquidation is initiated.
 */
export class EstateLiquidatedEvent extends DomainEvent<{
  assetId: string;
  targetAmount: number;
  liquidationType: LiquidationType;
  initiatedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    assetId: string,
    targetAmount: number,
    liquidationType: LiquidationType,
    initiatedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      assetId,
      targetAmount,
      liquidationType,
      initiatedBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Liquidation Completed Event
 *
 * Triggered when an asset liquidation is completed.
 */
export class EstateLiquidationCompletedEvent extends DomainEvent<{
  liquidationId: string;
  assetId: string;
  netProceeds: number;
  completedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    liquidationId: string,
    assetId: string,
    netProceeds: number,
    completedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      liquidationId,
      assetId,
      netProceeds,
      completedBy,
      timestamp: new Date(),
    });
  }
}
/**
 * Estate Cash Updated Event
 *
 * Triggered when estate cash position changes.
 */
export class EstateCashUpdatedEvent extends DomainEvent<{
  amount: number;
  changeType: 'DEPOSIT' | 'WITHDRAWAL' | 'LIQUIDATION_PROCEEDS' | 'TAX_PAYMENT' | 'DEBT_PAYMENT';
  updatedBy: string;
  newBalance: number;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    amount: number,
    changeType: 'DEPOSIT' | 'WITHDRAWAL' | 'LIQUIDATION_PROCEEDS' | 'TAX_PAYMENT' | 'DEBT_PAYMENT',
    updatedBy: string,
    version: number,
    newBalance?: number,
  ) {
    super(aggregateId, 'Estate', version, {
      amount,
      changeType,
      updatedBy,
      newBalance: newBalance || 0,
      timestamp: new Date(),
    });
  }
}
/**
 * Estate Tax Assessment Received Event
 *
 * Triggered when KRA issues tax assessment for the estate.
 */
export class EstateTaxAssessmentReceivedEvent extends DomainEvent<{
  totalLiability: number;
  assessmentReference: string;
  assessedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    totalLiability: number,
    assessmentReference: string,
    assessedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      totalLiability,
      assessmentReference,
      assessedBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Tax Cleared Event
 *
 * Triggered when estate receives tax clearance certificate.
 */
export class EstateTaxClearedEvent extends DomainEvent<{
  certificateNumber: string;
  clearedBy: string;
  timestamp: Date;
}> {
  constructor(aggregateId: string, certificateNumber: string, clearedBy: string, version: number) {
    super(aggregateId, 'Estate', version, {
      certificateNumber,
      clearedBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Tax Payment Recorded Event
 *
 * Triggered when a tax payment is made.
 */
export class EstateTaxPaymentRecordedEvent extends DomainEvent<{
  amount: number;
  paymentType: string;
  reference: string;
  paidBy?: string;
  remainingBalance: number;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    amount: number,
    paymentType: string,
    reference: string,
    paidBy: string | undefined,
    version: number,
    remainingBalance?: number,
  ) {
    super(aggregateId, 'Estate', version, {
      amount,
      paymentType,
      reference,
      paidBy,
      remainingBalance: remainingBalance || 0,
      timestamp: new Date(),
    });
  }
}
/**
 * Estate Distribution Started Event
 *
 * Triggered when estate distribution to heirs begins.
 */
export class EstateDistributionStartedEvent extends DomainEvent<{
  distributedBy: string;
  distributionMethod: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    distributedBy: string,
    version: number,
    distributionMethod?: string,
  ) {
    super(aggregateId, 'Estate', version, {
      distributedBy,
      distributionMethod: distributionMethod || 'PROPORTIONAL',
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Distribution Completed Event
 *
 * Triggered when estate distribution is fully completed.
 */
export class EstateDistributionCompletedEvent extends DomainEvent<{
  completedBy: string;
  totalDistributed: number;
  beneficiaryCount: number;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    completedBy: string,
    totalDistributed: number,
    beneficiaryCount: number,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      completedBy,
      totalDistributed,
      beneficiaryCount,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Closed Event
 *
 * Triggered when estate administration is formally closed.
 */
export class EstateClosedEvent extends DomainEvent<{
  closedBy: string;
  closureNotes?: string;
  administrationDurationDays: number;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    closedBy: string,
    version: number,
    closureNotes?: string,
    administrationDurationDays?: number,
  ) {
    super(aggregateId, 'Estate', version, {
      closedBy,
      closureNotes,
      administrationDurationDays: administrationDurationDays || 0,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Co-Owner Added Event
 *
 * Triggered when a co-owner is added to an estate asset.
 */
export class EstateCoOwnerAddedEvent extends DomainEvent<{
  assetId: string;
  coOwnerId: string;
  sharePercentage: number;
  ownershipType: string;
  addedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    assetId: string,
    coOwnerId: string,
    sharePercentage: number,
    ownershipType: string,
    addedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      assetId,
      coOwnerId,
      sharePercentage,
      ownershipType,
      addedBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Asset Encumbered Event
 *
 * Triggered when an asset is encumbered with a secured debt.
 */
export class EstateAssetEncumberedEvent extends DomainEvent<{
  assetId: string;
  debtId: string;
  encumbranceType: string;
  encumbranceAmount: number;
  encumberedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    assetId: string,
    debtId: string,
    encumbranceType: string,
    encumbranceAmount: number,
    encumberedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      assetId,
      debtId,
      encumbranceType,
      encumbranceAmount,
      encumberedBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Court Order Received Event
 *
 * Triggered when a court order affecting the estate is received.
 */
export class EstateCourtOrderReceivedEvent extends DomainEvent<{
  courtCaseNumber: string;
  orderType: string;
  orderDetails: string;
  receivedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    courtCaseNumber: string,
    orderType: string,
    orderDetails: string,
    receivedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      courtCaseNumber,
      orderType,
      orderDetails,
      receivedBy,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Dispute Registered Event
 *
 * Triggered when a legal dispute affecting the estate is registered.
 */
export class EstateDisputeRegisteredEvent extends DomainEvent<{
  disputeType: string;
  disputantId: string;
  reason: string;
  registeredBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    disputeType: string,
    disputantId: string,
    reason: string,
    registeredBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      disputeType,
      disputantId,
      reason,
      registeredBy,
      timestamp: new Date(),
    });
  }
}
/**
 * Estate Audit Trail Created Event
 *
 * Triggered for significant audit trail entries.
 */
export class EstateAuditTrailCreatedEvent extends DomainEvent<{
  action: string;
  performedBy: string;
  details: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    action: string,
    performedBy: string,
    details: string,
    entityType: string,
    entityId: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      action,
      performedBy,
      details,
      entityType,
      entityId,
      timestamp: new Date(),
    });
  }
}

/**
 * Estate Compliance Check Event
 *
 * Triggered when compliance checks are performed.
 */
export class EstateComplianceCheckEvent extends DomainEvent<{
  checkType: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  details: string;
  checkedBy: string;
  timestamp: Date;
}> {
  constructor(
    aggregateId: string,
    checkType: string,
    status: 'PASSED' | 'FAILED' | 'WARNING',
    details: string,
    checkedBy: string,
    version: number,
  ) {
    super(aggregateId, 'Estate', version, {
      checkType,
      status,
      details,
      checkedBy,
      timestamp: new Date(),
    });
  }
}
