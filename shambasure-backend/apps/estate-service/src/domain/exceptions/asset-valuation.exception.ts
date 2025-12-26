// src/estate-service/src/domain/exceptions/asset-valuation.exception.ts

export class AssetValuationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetValuationException';
    Object.setPrototypeOf(this, AssetValuationException.prototype);
  }
}

export class AssetValuationValidationException extends Error {
  constructor(field: string, reason: string) {
    super(`Validation failed for ${field}: ${reason}`);
    this.name = 'AssetValuationValidationException';
    Object.setPrototypeOf(this, AssetValuationValidationException.prototype);
  }
}

export class AssetValuationCredibilityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetValuationCredibilityException';
    Object.setPrototypeOf(this, AssetValuationCredibilityException.prototype);
  }
}
