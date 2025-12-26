// src/estate-service/src/domain/entities/exceptions/asset-co-owner.exception.ts

/**
 * Base Asset Co-Owner Exception
 */
export abstract class AssetCoOwnerException extends Error {
  constructor(
    message: string,
    public readonly assetId?: string,
    public readonly coOwnerId?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AssetCoOwnerException.prototype);
  }
}

/**
 * Invalid Share Percentage Exception
 */
export class InvalidSharePercentageException extends AssetCoOwnerException {
  constructor(assetId: string, coOwnerId: string, sharePercentage: number) {
    super(
      `Invalid share percentage ${sharePercentage}% for co-owner ${coOwnerId} of asset ${assetId}. Must be between 0 and 100.`,
      assetId,
      coOwnerId,
    );
  }
}

/**
 * Duplicate Co-Owner Exception
 */
export class DuplicateCoOwnerException extends AssetCoOwnerException {
  constructor(assetId: string, coOwnerId: string) {
    super(`Co-owner ${coOwnerId} already exists for asset ${assetId}`, assetId, coOwnerId);
  }
}

/**
 * Co-Owner Not Found Exception
 */
export class CoOwnerNotFoundException extends AssetCoOwnerException {
  constructor(assetId: string, coOwnerId: string) {
    super(`Co-owner ${coOwnerId} not found for asset ${assetId}`, assetId, coOwnerId);
  }
}

/**
 * Total Share Percentage Exceeded Exception
 */
export class TotalSharePercentageExceededException extends AssetCoOwnerException {
  constructor(assetId: string, currentTotal: number, newShare: number) {
    super(
      `Adding share ${newShare}% would exceed 100% total for asset ${assetId}. Current total: ${currentTotal}%`,
      assetId,
    );
  }
}

/**
 * Invalid Co-Owner Type Exception
 */
export class InvalidCoOwnerTypeException extends AssetCoOwnerException {
  constructor(assetId: string, issue: string) {
    super(`Invalid co-owner configuration for asset ${assetId}: ${issue}`, assetId);
  }
}

/**
 * Co-Ownership Cannot Be Modified Exception
 */
export class CoOwnershipCannotBeModifiedException extends AssetCoOwnerException {
  constructor(assetId: string, reason: string) {
    super(`Co-ownership for asset ${assetId} cannot be modified: ${reason}`, assetId);
  }
}
