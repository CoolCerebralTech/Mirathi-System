// src/estate-service/src/domain/events/asset.event.ts
import { DomainEvent } from '../base/domain-event';
import { AssetStatus } from '../enums/asset-status.enum';
import { CoOwnershipType } from '../enums/co-ownership-type.enum';
import { LiquidationType } from '../enums/liquidation-type.enum';
import { ValuationSource } from '../enums/valuation-source.enum';

export class AssetCreatedEvent extends DomainEvent<{
  estateId: string;
  assetType: string;
  initialValue: number;
}> {
  constructor(
    assetId: string,
    estateId: string,
    assetType: string,
    initialValue: number,
    version: number,
  ) {
    super(assetId, 'Asset', version, {
      estateId,
      assetType,
      initialValue,
    });
  }
}

export class AssetValueUpdatedEvent extends DomainEvent<{
  oldValue: number;
  newValue: number;
  source: ValuationSource;
  reason: string;
  updatedBy: string;
}> {
  constructor(
    assetId: string,
    oldValue: number,
    newValue: number,
    source: ValuationSource,
    reason: string,
    updatedBy: string,
    version: number,
  ) {
    super(assetId, 'Asset', version, {
      oldValue,
      newValue,
      source,
      reason,
      updatedBy,
    });
  }
}

export class AssetCoOwnerAddedEvent extends DomainEvent<{
  coOwnerId: string;
  sharePercentage: number;
  ownershipType: CoOwnershipType;
  addedBy: string;
}> {
  constructor(
    assetId: string,
    coOwnerId: string,
    sharePercentage: number,
    ownershipType: CoOwnershipType,
    addedBy: string,
    version: number,
  ) {
    super(assetId, 'Asset', version, {
      coOwnerId,
      sharePercentage,
      ownershipType,
      addedBy,
    });
  }
}

export class AssetEncumberedEvent extends DomainEvent<{
  encumbranceType: string;
  details: string;
  amount?: number;
  markedBy: string;
}> {
  constructor(
    assetId: string,
    encumbranceType: string,
    details: string,
    amount: number | undefined,
    markedBy: string,
    version: number,
  ) {
    super(assetId, 'Asset', version, {
      encumbranceType,
      details,
      amount,
      markedBy,
    });
  }
}

export class AssetLiquidationInitiatedEvent extends DomainEvent<{
  targetAmount: number;
  liquidationType: LiquidationType;
  initiatedBy: string;
}> {
  constructor(
    assetId: string,
    targetAmount: number,
    liquidationType: LiquidationType,
    initiatedBy: string,
    version: number,
  ) {
    super(assetId, 'Asset', version, {
      targetAmount,
      liquidationType,
      initiatedBy,
    });
  }
}

export class AssetLiquidationCompletedEvent extends DomainEvent<{
  actualAmount: number;
  originalValue: number;
  completedBy: string;
}> {
  constructor(
    assetId: string,
    actualAmount: number,
    originalValue: number,
    completedBy: string,
    version: number,
  ) {
    super(assetId, 'Asset', version, {
      actualAmount,
      originalValue,
      completedBy,
    });
  }
}

export class AssetStatusChangedEvent extends DomainEvent<{
  oldStatus: AssetStatus;
  newStatus: AssetStatus;
  reason: string;
  updatedBy: string;
}> {
  constructor(
    assetId: string,
    oldStatus: AssetStatus,
    newStatus: AssetStatus,
    reason: string,
    updatedBy: string,
    version: number,
  ) {
    super(assetId, 'Asset', version, {
      oldStatus,
      newStatus,
      reason,
      updatedBy,
    });
  }
}
