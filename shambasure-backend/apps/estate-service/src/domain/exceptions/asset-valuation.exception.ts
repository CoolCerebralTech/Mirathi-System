// src/estate-service/src/domain/entities/exceptions/asset-valuation.exception.ts

/**
 * Base Asset Valuation Exception
 */
export abstract class AssetValuationException extends Error {
  constructor(
    message: string,
    public readonly assetId?: string,
    public readonly valuationId?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AssetValuationException.prototype);
  }
}

/**
 * Valuation Already Exists Exception
 */
export class ValuationAlreadyExistsException extends AssetValuationException {
  constructor(assetId: string, valuationDate: Date) {
    super(
      `Valuation for asset ${assetId} on ${valuationDate.toISOString()} already exists`,
      assetId,
    );
  }
}

/**
 * Invalid Valuation Date Exception
 */
export class InvalidValuationDateException extends AssetValuationException {
  constructor(assetId: string, valuationDate: Date, issue: string) {
    super(
      `Invalid valuation date ${valuationDate.toISOString()} for asset ${assetId}: ${issue}`,
      assetId,
    );
  }
}

/**
 * Valuation Source Invalid Exception
 */
export class ValuationSourceInvalidException extends AssetValuationException {
  constructor(assetId: string, source: string) {
    super(`Invalid valuation source for asset ${assetId}: ${source}`, assetId);
  }
}

/**
 * Valuation Amount Invalid Exception
 */
export class ValuationAmountInvalidException extends AssetValuationException {
  constructor(assetId: string, amount: number) {
    super(
      `Invalid valuation amount ${amount} for asset ${assetId}. Must be positive number.`,
      assetId,
    );
  }
}

/**
 * Valuation Not Found Exception
 */
export class ValuationNotFoundException extends AssetValuationException {
  constructor(valuationId: string, assetId: string) {
    super(`Valuation ${valuationId} not found for asset ${assetId}`, assetId, valuationId);
  }
}

/**
 * Valuation Cannot Be Modified Exception
 */
export class ValuationCannotBeModifiedException extends AssetValuationException {
  constructor(valuationId: string, reason: string) {
    super(`Valuation ${valuationId} cannot be modified: ${reason}`, undefined, valuationId);
  }
}
