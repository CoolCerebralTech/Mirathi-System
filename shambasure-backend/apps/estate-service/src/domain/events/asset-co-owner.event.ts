// src/estate-service/src/domain/entities/events/asset-co-owner.event.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Base Asset Co-Owner Event
 */
export abstract class AssetCoOwnerEvent<T = any> extends DomainEvent<T> {
  constructor(aggregateId: string, version: number, payload: T, occurredAt?: Date) {
    super(aggregateId, 'AssetCoOwner', version, payload, occurredAt);
  }
}

/**
 * Co-Owner Added Event
 * Triggered when a new co-owner is added to an asset
 */
export class CoOwnerAddedEvent extends AssetCoOwnerEvent<{
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
 * Co-Owner Share Updated Event
 * Triggered when a co-owner's share percentage changes
 */
export class CoOwnerShareUpdatedEvent extends AssetCoOwnerEvent<{
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
 * Co-Owner Removed Event
 * Triggered when a co-owner is removed from an asset
 */
export class CoOwnerRemovedEvent extends AssetCoOwnerEvent<{
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
 * Co-Ownership Type Changed Event
 * Triggered when co-ownership type changes (e.g., Joint Tenancy to Tenancy in Common)
 */
export class CoOwnershipTypeChangedEvent extends AssetCoOwnerEvent<{
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
