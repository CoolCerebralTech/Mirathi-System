// src/estate-service/src/domain/entities/events/asset.event.ts
import { DomainEvent } from '../base/domain-event';
import { AssetStatus } from '../enums/asset-status.enum';
import { CoOwnershipType } from '../enums/co-ownership-type.enum';
import { AssetTypeVO } from '../value-objects/asset-type.vo';
import { MoneyVO } from '../value-objects/money.vo';

/**
 * Base Asset Event
 * All asset events inherit from this to ensure standardized metadata
 */
export abstract class AssetEvent<T = any> extends DomainEvent<T> {
  constructor(
    aggregateId: string,
    eventType: string,
    version: number,
    payload: T,
    occurredAt?: Date,
  ) {
    super(aggregateId, eventType, version, payload, occurredAt);
  }
}

// =============================================================================
// 1. LIFECYCLE EVENTS
// =============================================================================

export class AssetCreatedEvent extends AssetEvent<{
  assetId: string;
  estateId: string;
  name: string;
  type: string; // "LAND", "VEHICLE", etc.
  initialValue: number;
  currency: string;
  description?: string;
  createdBy: string;
}> {
  constructor(
    assetId: string,
    estateId: string,
    name: string,
    type: AssetTypeVO,
    value: MoneyVO,
    description: string | undefined,
    createdBy: string,
    version: number,
  ) {
    super(assetId, 'AssetCreatedEvent', version, {
      assetId,
      estateId,
      name,
      type: type.toString(),
      initialValue: value.amount,
      currency: value.currency,
      description,
      createdBy,
    });
  }
}

export class AssetDeletedEvent extends AssetEvent<{
  assetId: string;
  deletedBy: string;
  reason?: string;
}> {
  constructor(assetId: string, deletedBy: string, reason: string | undefined, version: number) {
    super(assetId, 'AssetDeletedEvent', version, {
      assetId,
      deletedBy,
      reason,
    });
  }
}

// =============================================================================
// 2. STATE & VALUE EVENTS
// =============================================================================

export class AssetValueUpdatedEvent extends AssetEvent<{
  assetId: string;
  newValue: number;
  currency: string;
  source: string;
  updatedBy: string;
}> {
  constructor(
    assetId: string,
    newValue: number,
    source: string,
    updatedBy: string,
    version: number,
  ) {
    super(assetId, 'AssetValueUpdatedEvent', version, {
      assetId,
      newValue: newValue,
      currency: 'KES', // Assumed KES for simplicity, or pass from VO
      source,
      updatedBy,
    });
  }
}

export class AssetStatusChangedEvent extends AssetEvent<{
  assetId: string;
  oldStatus: AssetStatus;
  newStatus: AssetStatus;
  reason?: string;
  changedBy: string;
}> {
  constructor(
    assetId: string,
    oldStatus: AssetStatus,
    newStatus: AssetStatus,
    reason: string | undefined,
    changedBy: string,
    version: number,
  ) {
    super(assetId, 'AssetStatusChangedEvent', version, {
      assetId,
      oldStatus,
      newStatus,
      reason,
      changedBy,
    });
  }
}

export class AssetEncumberedEvent extends AssetEvent<{
  assetId: string;
  details: string;
  encumberedBy: string;
}> {
  constructor(assetId: string, details: string, encumberedBy: string, version: number) {
    super(assetId, 'AssetEncumberedEvent', version, {
      assetId,
      details,
      encumberedBy,
    });
  }
}

// =============================================================================
// 3. LIQUIDATION EVENTS (The Conversion Process)
// =============================================================================

/**
 * Liquidation Initiated: "We have listed the house for sale"
 */
export class AssetLiquidationInitiatedEvent extends AssetEvent<{
  assetId: string;
  targetAmount: number;
  initiatedBy: string;
}> {
  constructor(assetId: string, targetAmount: number, initiatedBy: string, version: number) {
    super(assetId, 'AssetLiquidationInitiatedEvent', version, {
      assetId,
      targetAmount,
      initiatedBy,
    });
  }
}

/**
 * Liquidation Completed: "We have received the cash"
 * This triggers the Estate Aggregate to update CashOnHand.
 */
export class AssetLiquidationCompletedEvent extends AssetEvent<{
  assetId: string;
  actualAmount: number;
  completedBy: string;
}> {
  constructor(assetId: string, actualAmount: number, completedBy: string, version: number) {
    super(assetId, 'AssetLiquidationCompletedEvent', version, {
      assetId,
      actualAmount,
      completedBy,
    });
  }
}

export class AssetLiquidationCancelledEvent extends AssetEvent<{
  assetId: string;
  reason: string;
  cancelledBy: string;
}> {
  constructor(assetId: string, reason: string, cancelledBy: string, version: number) {
    super(assetId, 'AssetLiquidationCancelledEvent', version, {
      assetId,
      reason,
      cancelledBy,
    });
  }
}

// =============================================================================
// 4. CO-OWNERSHIP EVENTS (The "Slice" Logic)
// =============================================================================

export class AssetCoOwnerAddedEvent extends AssetEvent<{
  assetId: string;
  coOwnerId: string;
  sharePercentage: number;
  addedBy: string;
}> {
  constructor(
    assetId: string,
    coOwnerId: string,
    sharePercentage: number,
    addedBy: string,
    version: number,
  ) {
    super(assetId, 'AssetCoOwnerAddedEvent', version, {
      assetId,
      coOwnerId,
      sharePercentage,
      addedBy,
    });
  }
}

export class AssetCoOwnerRemovedEvent extends AssetEvent<{
  assetId: string;
  coOwnerId: string;
  sharePercentage: number; // Log what share was removed
  removedBy: string;
  reason?: string;
}> {
  constructor(
    assetId: string,
    coOwnerId: string,
    sharePercentage: number,
    removedBy: string,
    reason: string | undefined,
    version: number,
  ) {
    super(assetId, 'AssetCoOwnerRemovedEvent', version, {
      assetId,
      coOwnerId,
      sharePercentage,
      removedBy,
      reason,
    });
  }
}

export class AssetCoOwnerShareUpdatedEvent extends AssetEvent<{
  assetId: string;
  coOwnerId: string;
  oldSharePercentage: number;
  newSharePercentage: number;
  updatedBy: string;
}> {
  constructor(
    assetId: string,
    coOwnerId: string,
    oldSharePercentage: number,
    newSharePercentage: number,
    updatedBy: string,
    version: number,
  ) {
    super(assetId, 'AssetCoOwnerShareUpdatedEvent', version, {
      assetId,
      coOwnerId,
      oldSharePercentage,
      newSharePercentage,
      updatedBy,
    });
  }
}

export class AssetOwnershipTypeChangedEvent extends AssetEvent<{
  assetId: string;
  oldOwnershipType: CoOwnershipType;
  newOwnershipType: CoOwnershipType;
  changedBy: string;
  legalImplications: string[];
}> {
  constructor(
    assetId: string,
    oldOwnershipType: CoOwnershipType,
    newOwnershipType: CoOwnershipType,
    changedBy: string,
    legalImplications: string[],
    version: number,
  ) {
    super(assetId, 'AssetOwnershipTypeChangedEvent', version, {
      assetId,
      oldOwnershipType,
      newOwnershipType,
      changedBy,
      legalImplications,
    });
  }
}
