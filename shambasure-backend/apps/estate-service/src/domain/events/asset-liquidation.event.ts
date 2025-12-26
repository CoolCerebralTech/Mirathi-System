// src/estate-service/src/domain/entities/events/asset-liquidation.event.ts
import { DomainEvent } from '../../../base/domain-event';

/**
 * Base Asset Liquidation Event
 */
export abstract class AssetLiquidationEvent<T = any> extends DomainEvent<T> {
  constructor(aggregateId: string, version: number, payload: T, occurredAt?: Date) {
    super(aggregateId, 'AssetLiquidation', version, payload, occurredAt);
  }
}

/**
 * Liquidation Initiated Event
 * Triggered when asset liquidation process starts
 */
export class LiquidationInitiatedEvent extends AssetLiquidationEvent<{
  assetId: string;
  liquidationId: string;
  liquidationType: string;
  targetAmount: number;
  currency: string;
  reason: string;
  initiatedBy: string;
  requiresCourtApproval: boolean;
  courtOrderRef?: string;
}> {
  constructor(
    assetId: string,
    liquidationId: string,
    liquidationType: string,
    targetAmount: number,
    currency: string,
    reason: string,
    initiatedBy: string,
    requiresCourtApproval: boolean,
    courtOrderRef: string | undefined,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      liquidationId,
      liquidationType,
      targetAmount,
      currency,
      reason,
      initiatedBy,
      requiresCourtApproval,
      courtOrderRef,
    });
  }
}

/**
 * Liquidation Approved Event
 * Triggered when liquidation receives required approvals
 */
export class LiquidationApprovedEvent extends AssetLiquidationEvent<{
  assetId: string;
  liquidationId: string;
  approvedBy: string;
  approvalType: string; // COURT, EXECUTOR, FAMILY_CONSENT
  approvalDate: Date;
  approvalDocumentRef?: string;
}> {
  constructor(
    assetId: string,
    liquidationId: string,
    approvedBy: string,
    approvalType: string,
    approvalDate: Date,
    approvalDocumentRef: string | undefined,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      liquidationId,
      approvedBy,
      approvalType,
      approvalDate,
      approvalDocumentRef,
    });
  }
}

/**
 * Liquidation Sale Completed Event
 * Triggered when asset is successfully sold
 */
export class LiquidationSaleCompletedEvent extends AssetLiquidationEvent<{
  assetId: string;
  liquidationId: string;
  saleAmount: number;
  currency: string;
  buyerName?: string;
  buyerIdNumber?: string;
  saleDate: Date;
  commissionAmount?: number;
  netProceeds: number;
  completedBy: string;
}> {
  constructor(
    assetId: string,
    liquidationId: string,
    saleAmount: number,
    currency: string,
    buyerName: string | undefined,
    buyerIdNumber: string | undefined,
    saleDate: Date,
    commissionAmount: number | undefined,
    netProceeds: number,
    completedBy: string,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      liquidationId,
      saleAmount,
      currency,
      buyerName,
      buyerIdNumber,
      saleDate,
      commissionAmount,
      netProceeds,
      completedBy,
    });
  }
}

/**
 * Liquidation Cancelled Event
 * Triggered when liquidation process is cancelled
 */
export class LiquidationCancelledEvent extends AssetLiquidationEvent<{
  assetId: string;
  liquidationId: string;
  cancelledBy: string;
  reason: string;
  cancellationDate: Date;
}> {
  constructor(
    assetId: string,
    liquidationId: string,
    cancelledBy: string,
    reason: string,
    cancellationDate: Date,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      liquidationId,
      cancelledBy,
      reason,
      cancellationDate,
    });
  }
}

/**
 * Liquidation Proceeds Distributed Event
 * Triggered when sale proceeds are added to estate cash
 */
export class LiquidationProceedsDistributedEvent extends AssetLiquidationEvent<{
  assetId: string;
  liquidationId: string;
  estateId: string;
  amount: number;
  currency: string;
  distributionDate: Date;
  distributedBy: string;
  notes?: string;
}> {
  constructor(
    assetId: string,
    liquidationId: string,
    estateId: string,
    amount: number,
    currency: string,
    distributionDate: Date,
    distributedBy: string,
    notes: string | undefined,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      liquidationId,
      estateId,
      amount,
      currency,
      distributionDate,
      distributedBy,
      notes,
    });
  }
}

/**
 * Liquidation Bid Received Event
 * Triggered when a bid is received during auction
 */
export class LiquidationBidReceivedEvent extends AssetLiquidationEvent<{
  assetId: string;
  liquidationId: string;
  bidAmount: number;
  bidderName: string;
  bidDate: Date;
  isHighestBid: boolean;
}> {
  constructor(
    assetId: string,
    liquidationId: string,
    bidAmount: number,
    bidderName: string,
    bidDate: Date,
    isHighestBid: boolean,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      liquidationId,
      bidAmount,
      bidderName,
      bidDate,
      isHighestBid,
    });
  }
}

/**
 * Liquidation Reserve Price Updated Event
 */
export class LiquidationReservePriceUpdatedEvent extends AssetLiquidationEvent<{
  assetId: string;
  liquidationId: string;
  oldReservePrice: number;
  newReservePrice: number;
  updatedBy: string;
  reason: string;
}> {
  constructor(
    assetId: string,
    liquidationId: string,
    oldReservePrice: number,
    newReservePrice: number,
    updatedBy: string,
    reason: string,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      liquidationId,
      oldReservePrice,
      newReservePrice,
      updatedBy,
      reason,
    });
  }
}
