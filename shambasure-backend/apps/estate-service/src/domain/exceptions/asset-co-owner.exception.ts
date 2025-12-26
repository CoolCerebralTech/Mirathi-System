// src/estate-service/src/domain/exceptions/asset-co-owner.exception.ts

export class AssetCoOwnerException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetCoOwnerException';
    Object.setPrototypeOf(this, AssetCoOwnerException.prototype);
  }
}

export class AssetCoOwnerValidationException extends Error {
  constructor(field: string, reason: string) {
    super(`Validation failed for ${field}: ${reason}`);
    this.name = 'AssetCoOwnerValidationException';
    Object.setPrototypeOf(this, AssetCoOwnerValidationException.prototype);
  }
}

export class AssetCoOwnerVerificationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetCoOwnerVerificationException';
    Object.setPrototypeOf(this, AssetCoOwnerVerificationException.prototype);
  }
}
