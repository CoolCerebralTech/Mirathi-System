// src/estate-service/src/domain/entities/events/asset.event.ts
import { DomainEvent } from '../base/domain-event';
import { AssetStatus } from '../enums/asset-status.enum';
import { AssetTypeVO } from '../value-objects/asset-type.vo';
import { MoneyVO } from '../value-objects/money.vo';

/**
 * Base Asset Event
 */
export abstract class AssetEvent<T = any> extends DomainEvent<T> {
  constructor(aggregateId: string, version: number, payload: T, occurredAt?: Date) {
    super(aggregateId, 'Asset', version, payload, occurredAt);
  }
}

/**
 * Asset Created Event
 * Triggered when a new asset is added to the estate
 */
export class AssetCreatedEvent extends AssetEvent<{
  assetId: string;
  estateId: string;
  ownerId: string;
  name: string;
  type: string;
  value: { amount: number; currency: string };
  description?: string;
  createdBy: string;
}> {
  constructor(
    assetId: string,
    estateId: string,
    ownerId: string,
    name: string,
    type: AssetTypeVO,
    value: MoneyVO,
    description: string | undefined,
    createdBy: string,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      estateId,
      ownerId,
      name,
      type: type.toString(),
      value: { amount: value.amount, currency: value.currency },
      description,
      createdBy,
    });
  }
}

/**
 * Asset Value Updated Event
 * Triggered when asset value changes
 */
export class AssetValueUpdatedEvent extends AssetEvent<{
  assetId: string;
  oldValue: { amount: number; currency: string };
  newValue: { amount: number; currency: string };
  valuationDate: Date;
  source: string;
  updatedBy: string;
}> {
  constructor(
    assetId: string,
    oldValue: MoneyVO,
    newValue: MoneyVO,
    valuationDate: Date,
    source: string,
    updatedBy: string,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      oldValue: { amount: oldValue.amount, currency: oldValue.currency },
      newValue: { amount: newValue.amount, currency: newValue.currency },
      valuationDate,
      source,
      updatedBy,
    });
  }
}

/**
 * Asset Status Changed Event
 * Triggered when asset status changes
 */
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
    super(assetId, version, {
      assetId,
      oldStatus,
      newStatus,
      reason,
      changedBy,
    });
  }
}

/**
 * Asset Liquidated Event
 * Triggered when asset is converted to cash
 */
export class AssetLiquidatedEvent extends AssetEvent<{
  assetId: string;
  estateId: string;
  liquidationType: string;
  targetAmount: number;
  actualAmount: number;
  currency: string;
  buyerName?: string;
  saleDate: Date;
  liquidatedBy: string;
}> {
  constructor(
    assetId: string,
    estateId: string,
    liquidationType: string,
    targetAmount: number,
    actualAmount: number,
    currency: string,
    buyerName: string | undefined,
    saleDate: Date,
    liquidatedBy: string,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      estateId,
      liquidationType,
      targetAmount,
      actualAmount,
      currency,
      buyerName,
      saleDate,
      liquidatedBy,
    });
  }
}

/**
 * Asset Co-Owner Added Event
 */
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
    super(assetId, version, {
      assetId,
      coOwnerId,
      sharePercentage,
      addedBy,
    });
  }
}

/**
 * Asset Co-Owner Removed Event
 */
export class AssetCoOwnerRemovedEvent extends AssetEvent<{
  assetId: string;
  coOwnerId: string;
  removedBy: string;
}> {
  constructor(assetId: string, coOwnerId: string, removedBy: string, version: number) {
    super(assetId, version, {
      assetId,
      coOwnerId,
      removedBy,
    });
  }
}

/**
 * Asset Encumbered Event
 * Triggered when asset gets encumbrance (mortgage, lien, etc.)
 */
export class AssetEncumberedEvent extends AssetEvent<{
  assetId: string;
  encumbranceType: string;
  encumbranceDetails: string;
  securedAmount: number;
  creditorName: string;
  encumberedBy: string;
}> {
  constructor(
    assetId: string,
    encumbranceType: string,
    encumbranceDetails: string,
    securedAmount: number,
    creditorName: string,
    encumberedBy: string,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      encumbranceType,
      encumbranceDetails,
      securedAmount,
      creditorName,
      encumberedBy,
    });
  }
}

/**
 * Asset Deleted Event (Soft Delete)
 */
export class AssetDeletedEvent extends AssetEvent<{
  assetId: string;
  deletedBy: string;
  reason?: string;
}> {
  constructor(assetId: string, deletedBy: string, reason: string | undefined, version: number) {
    super(assetId, version, {
      assetId,
      deletedBy,
      reason,
    });
  }
}
/**
 * Asset Co-Owner Added Event
 * Triggered when a co-owner is added to an asset
 */
export class AssetCoOwnerAddedEvent extends AssetEvent<{
  assetId: string;
  coOwnerId: string;
  userId?: string;
  externalName?: string;
  sharePercentage: number;
  ownershipType: string;
  addedBy: string;
}> {
  constructor(
    assetId: string,
    coOwnerId: string,
    userId: string | undefined,
    externalName: string | undefined,
    sharePercentage: number,
    ownershipType: string,
    addedBy: string,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      coOwnerId,
      userId,
      externalName,
      sharePercentage,
      ownershipType,
      addedBy,
    });
  }
}

/**
 * Asset Co-Owner Removed Event
 * Triggered when a co-owner is removed from an asset
 */
export class AssetCoOwnerRemovedEvent extends AssetEvent<{
  assetId: string;
  coOwnerId: string;
  removedSharePercentage: number;
  removedBy: string;
  reason?: string;
}> {
  constructor(
    assetId: string,
    coOwnerId: string,
    removedSharePercentage: number,
    removedBy: string,
    reason: string | undefined,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      coOwnerId,
      removedSharePercentage,
      removedBy,
      reason,
    });
  }
}

/**
 * Asset Co-Owner Share Updated Event
 * Triggered when a co-owner's share percentage changes
 */
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
    super(assetId, version, {
      assetId,
      coOwnerId,
      oldSharePercentage,
      newSharePercentage,
      updatedBy,
    });
  }
}

/**
 * Asset Ownership Type Changed Event
 * Triggered when asset ownership type changes
 */
export class AssetOwnershipTypeChangedEvent extends AssetEvent<{
  assetId: string;
  oldOwnershipType: string;
  newOwnershipType: string;
  changedBy: string;
  legalImplications: string[];
}> {
  constructor(
    assetId: string,
    oldOwnershipType: string,
    newOwnershipType: string,
    changedBy: string,
    legalImplications: string[],
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      oldOwnershipType,
      newOwnershipType,
      changedBy,
      legalImplications,
    });
  }
}