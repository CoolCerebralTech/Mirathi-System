// src/estate-service/src/domain/events/asset-liquidation.event.ts
import { DomainEvent } from '../base/domain-event';
import { LiquidationStatus } from '../enums/liquidation-status.enum';
import { LiquidationType } from '../enums/liquidation-type.enum';

export class AssetLiquidationInitiatedEvent extends DomainEvent<{
  assetId: string;
  liquidationType: LiquidationType;
  targetAmount: number;
  initiatedBy: string;
}> {
  constructor(
    liquidationId: string,
    assetId: string,
    liquidationType: LiquidationType,
    targetAmount: number,
    initiatedBy: string,
    version: number,
  ) {
    super(liquidationId, 'AssetLiquidation', version, {
      assetId,
      liquidationType,
      targetAmount,
      initiatedBy,
    });
  }
}

export class AssetLiquidationCourtApprovedEvent extends DomainEvent<{
  assetId: string;
  courtOrderRef: string;
  approvedBy: string;
}> {
  constructor(
    liquidationId: string,
    assetId: string,
    courtOrderRef: string,
    approvedBy: string,
    version: number,
  ) {
    super(liquidationId, 'AssetLiquidation', version, {
      assetId,
      courtOrderRef,
      approvedBy,
    });
  }
}

export class AssetLiquidationCompletedEvent extends DomainEvent<{
  assetId: string;
  actualAmount: number;
  targetAmount: number;
  completedBy: string;
}> {
  constructor(
    liquidationId: string,
    assetId: string,
    actualAmount: number,
    targetAmount: number,
    completedBy: string,
    version: number,
  ) {
    super(liquidationId, 'AssetLiquidation', version, {
      assetId,
      actualAmount,
      targetAmount,
      completedBy,
    });
  }
}

export class AssetLiquidationStatusChangedEvent extends DomainEvent<{
  assetId: string;
  oldStatus: LiquidationStatus;
  newStatus: LiquidationStatus;
  reason: string;
  updatedBy: string;
}> {
  constructor(
    liquidationId: string,
    assetId: string,
    oldStatus: LiquidationStatus,
    newStatus: LiquidationStatus,
    reason: string,
    updatedBy: string,
    version: number,
  ) {
    super(liquidationId, 'AssetLiquidation', version, {
      assetId,
      oldStatus,
      newStatus,
      reason,
      updatedBy,
    });
  }
}

export class AssetLiquidationProceedsDistributedEvent extends DomainEvent<{
  assetId: string;
  netProceeds: number;
  distributedToEstateId: string;
  distributedBy: string;
}> {
  constructor(
    liquidationId: string,
    assetId: string,
    netProceeds: number,
    distributedToEstateId: string,
    distributedBy: string,
    version: number,
  ) {
    super(liquidationId, 'AssetLiquidation', version, {
      assetId,
      netProceeds,
      distributedToEstateId,
      distributedBy,
    });
  }
}
