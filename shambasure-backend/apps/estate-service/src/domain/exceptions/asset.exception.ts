// src/estate-service/src/domain/entities/exceptions/asset.exception.ts

/**
 * Base Asset Exception
 */
export abstract class AssetException extends Error {
  constructor(
    message: string,
    public readonly assetId?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AssetException.prototype);
  }
}

/**
 * Asset Not Found Exception
 */
export class AssetNotFoundException extends AssetException {
  constructor(assetId: string) {
    super(`Asset with ID ${assetId} not found`, assetId);
  }
}

/**
 * Asset Already Exists Exception
 */
export class AssetAlreadyExistsException extends AssetException {
  constructor(assetId: string) {
    super(`Asset with ID ${assetId} already exists`, assetId);
  }
}

/**
 * Asset Cannot Be Modified Exception
 */
export class AssetCannotBeModifiedException extends AssetException {
  constructor(assetId: string, reason: string) {
    super(`Asset ${assetId} cannot be modified: ${reason}`, assetId);
  }
}

/**
 * Asset Value Invalid Exception
 */
export class AssetValueInvalidException extends AssetException {
  constructor(assetId: string, value: number) {
    super(`Asset ${assetId} has invalid value: ${value}. Must be positive number.`, assetId);
  }
}

/**
 * Asset Ownership Invalid Exception
 */
export class AssetOwnershipInvalidException extends AssetException {
  constructor(assetId: string, ownerId: string) {
    super(`Asset ${assetId} has invalid owner: ${ownerId}`, assetId);
  }
}

/**
 * Asset Liquidation Failed Exception
 */
export class AssetLiquidationFailedException extends AssetException {
  constructor(assetId: string, reason: string) {
    super(`Asset ${assetId} liquidation failed: ${reason}`, assetId);
  }
}

/**
 * Asset Encumbered Exception
 */
export class AssetEncumberedException extends AssetException {
  constructor(assetId: string, encumbranceType: string) {
    super(
      `Asset ${assetId} is encumbered with ${encumbranceType}. Cannot perform operation.`,
      assetId,
    );
  }
}

/**
 * Asset Co-Ownership Invalid Exception
 */
export class AssetCoOwnershipInvalidException extends AssetException {
  constructor(assetId: string, issue: string) {
    super(`Asset ${assetId} co-ownership invalid: ${issue}`, assetId);
  }
}

/**
 * Asset Type Mismatch Exception
 */
export class AssetTypeMismatchException extends AssetException {
  constructor(assetId: string, expected: string, actual: string) {
    super(`Asset ${assetId} type mismatch. Expected ${expected}, got ${actual}`, assetId);
  }
}

/**
 * Asset Deleted Exception
 */
export class AssetDeletedException extends AssetException {
  constructor(assetId: string) {
    super(`Asset ${assetId} has been deleted`, assetId);
  }
}
