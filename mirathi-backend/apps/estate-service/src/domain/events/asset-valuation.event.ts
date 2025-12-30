// src/estate-service/src/domain/events/asset-valuation.event.ts
import { DomainEvent } from '../base/domain-event';
import { ValuationSource } from '../enums/valuation-source.enum';

export class AssetValuationCreatedEvent extends DomainEvent<{
  assetId: string;
  value: number;
  source: ValuationSource;
  conductedBy: string;
}> {
  constructor(
    valuationId: string,
    assetId: string,
    value: number,
    source: ValuationSource,
    conductedBy: string,
    version: number,
  ) {
    super(valuationId, 'AssetValuation', version, {
      assetId,
      value,
      source,
      conductedBy,
    });
  }
}

export class AssetValuationUpdatedEvent extends DomainEvent<{
  assetId: string;
  oldValue: number;
  newValue: number;
  updatedBy: string;
}> {
  constructor(
    valuationId: string,
    assetId: string,
    oldValue: number,
    newValue: number,
    updatedBy: string,
    version: number,
  ) {
    super(valuationId, 'AssetValuation', version, {
      assetId,
      oldValue,
      newValue,
      updatedBy,
    });
  }
}

export class AssetValuationVerifiedEvent extends DomainEvent<{
  assetId: string;
  verifiedBy: string;
  verificationNotes?: string;
}> {
  constructor(
    valuationId: string,
    assetId: string,
    verifiedBy: string,
    verificationNotes: string | undefined,
    version: number,
  ) {
    super(valuationId, 'AssetValuation', version, {
      assetId,
      verifiedBy,
      verificationNotes,
    });
  }
}
