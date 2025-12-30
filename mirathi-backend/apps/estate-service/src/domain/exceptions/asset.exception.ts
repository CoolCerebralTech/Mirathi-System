// src/estate-service/src/domain/exceptions/asset.exception.ts

export class AssetLogicException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetLogicException';
    Object.setPrototypeOf(this, AssetLogicException.prototype);
  }
}

export class AssetCannotBeModifiedException extends Error {
  constructor(assetId: string, reason: string) {
    super(`Asset ${assetId} cannot be modified: ${reason}`);
    this.name = 'AssetCannotBeModifiedException';
    Object.setPrototypeOf(this, AssetCannotBeModifiedException.prototype);
  }
}

export class AssetValuationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetValuationException';
    Object.setPrototypeOf(this, AssetValuationException.prototype);
  }
}

export class AssetLiquidationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetLiquidationException';
    Object.setPrototypeOf(this, AssetLiquidationException.prototype);
  }
}

export class AssetEncumbranceException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetEncumbranceException';
    Object.setPrototypeOf(this, AssetEncumbranceException.prototype);
  }
}
