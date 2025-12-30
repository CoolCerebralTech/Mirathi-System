// src/estate-service/src/domain/events/asset-co-owner.event.ts
import { DomainEvent } from '../base/domain-event';
import { CoOwnershipType } from '../enums/co-ownership-type.enum';

export class AssetCoOwnerAddedEvent extends DomainEvent<{
  assetId: string;
  familyMemberId: string;
  sharePercentage: number;
  ownershipType: CoOwnershipType;
  addedBy: string;
}> {
  constructor(
    coOwnerId: string,
    assetId: string,
    familyMemberId: string,
    sharePercentage: number,
    ownershipType: CoOwnershipType,
    addedBy: string,
    version: number,
  ) {
    super(coOwnerId, 'AssetCoOwner', version, {
      assetId,
      familyMemberId,
      sharePercentage,
      ownershipType,
      addedBy,
    });
  }
}

export class AssetCoOwnerShareUpdatedEvent extends DomainEvent<{
  assetId: string;
  familyMemberId: string;
  oldSharePercentage: number;
  newSharePercentage: number;
  reason: string;
  updatedBy: string;
}> {
  constructor(
    coOwnerId: string,
    assetId: string,
    familyMemberId: string,
    oldSharePercentage: number,
    newSharePercentage: number,
    reason: string,
    updatedBy: string,
    version: number,
  ) {
    super(coOwnerId, 'AssetCoOwner', version, {
      assetId,
      familyMemberId,
      oldSharePercentage,
      newSharePercentage,
      reason,
      updatedBy,
    });
  }
}

export class AssetCoOwnerRemovedEvent extends DomainEvent<{
  assetId: string;
  familyMemberId: string;
  sharePercentage: number;
  reason: string;
  removedBy: string;
}> {
  constructor(
    coOwnerId: string,
    assetId: string,
    familyMemberId: string,
    sharePercentage: number,
    reason: string,
    removedBy: string,
    version: number,
  ) {
    super(coOwnerId, 'AssetCoOwner', version, {
      assetId,
      familyMemberId,
      sharePercentage,
      reason,
      removedBy,
    });
  }
}

export class AssetCoOwnerVerifiedEvent extends DomainEvent<{
  assetId: string;
  familyMemberId: string;
  verifiedBy: string;
  verificationNotes?: string;
}> {
  constructor(
    coOwnerId: string,
    assetId: string,
    familyMemberId: string,
    verifiedBy: string,
    verificationNotes: string | undefined,
    version: number,
  ) {
    super(coOwnerId, 'AssetCoOwner', version, {
      assetId,
      familyMemberId,
      verifiedBy,
      verificationNotes,
    });
  }
}
