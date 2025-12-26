// src/estate-service/src/domain/entities/events/asset-valuation.event.ts
import { DomainEvent } from '../base/domain-event';
import { MoneyVO } from '../value-objects/money.vo';

/**
 * Base Asset Valuation Event
 */
export abstract class AssetValuationEvent<T = any> extends DomainEvent<T> {
  constructor(aggregateId: string, version: number, payload: T, occurredAt?: Date) {
    super(aggregateId, 'AssetValuation', version, payload, occurredAt);
  }
}

/**
 * Valuation Recorded Event
 * Triggered when a new valuation is recorded for an asset
 */
export class ValuationRecordedEvent extends AssetValuationEvent<{
  assetId: string;
  valuationId: string;
  value: { amount: number; currency: string };
  valuationDate: Date;
  source: string;
  sourceDetails?: string;
  performedBy: string;
  notes?: string;
}> {
  constructor(
    assetId: string,
    valuationId: string,
    value: MoneyVO,
    valuationDate: Date,
    source: string,
    sourceDetails: string | undefined,
    performedBy: string,
    notes: string | undefined,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      valuationId,
      value: { amount: value.amount, currency: value.currency },
      valuationDate,
      source,
      sourceDetails,
      performedBy,
      notes,
    });
  }
}

/**
 * Valuation Updated Event
 * Triggered when an existing valuation is updated (rare, but possible for corrections)
 */
export class ValuationUpdatedEvent extends AssetValuationEvent<{
  assetId: string;
  valuationId: string;
  oldValue: { amount: number; currency: string };
  newValue: { amount: number; currency: string };
  updatedBy: string;
  reason: string;
}> {
  constructor(
    assetId: string,
    valuationId: string,
    oldValue: MoneyVO,
    newValue: MoneyVO,
    updatedBy: string,
    reason: string,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      valuationId,
      oldValue: { amount: oldValue.amount, currency: oldValue.currency },
      newValue: { amount: newValue.amount, currency: newValue.currency },
      updatedBy,
      reason,
    });
  }
}

/**
 * Valuation Deleted Event
 * Triggered when a valuation is deleted (e.g., due to error)
 */
export class ValuationDeletedEvent extends AssetValuationEvent<{
  assetId: string;
  valuationId: string;
  deletedValue: { amount: number; currency: string };
  deletedBy: string;
  reason: string;
}> {
  constructor(
    assetId: string,
    valuationId: string,
    deletedValue: MoneyVO,
    deletedBy: string,
    reason: string,
    version: number,
  ) {
    super(assetId, version, {
      assetId,
      valuationId,
      deletedValue: { amount: deletedValue.amount, currency: deletedValue.currency },
      deletedBy,
      reason,
    });
  }
}
