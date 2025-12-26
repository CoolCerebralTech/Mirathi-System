// src/estate-service/src/domain/exceptions/asset-liquidation.exception.ts

export class AssetLiquidationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetLiquidationException';
    Object.setPrototypeOf(this, AssetLiquidationException.prototype);
  }
}

export class AssetLiquidationValidationException extends Error {
  constructor(field: string, reason: string) {
    super(`Validation failed for ${field}: ${reason}`);
    this.name = 'AssetLiquidationValidationException';
    Object.setPrototypeOf(this, AssetLiquidationValidationException.prototype);
  }
}

export class AssetLiquidationStatusException extends Error {
  constructor(currentStatus: string, attemptedAction: string) {
    super(`Cannot ${attemptedAction} while liquidation is in status: ${currentStatus}`);
    this.name = 'AssetLiquidationStatusException';
    Object.setPrototypeOf(this, AssetLiquidationStatusException.prototype);
  }
}

export class AssetLiquidationCourtApprovalException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetLiquidationCourtApprovalException';
    Object.setPrototypeOf(this, AssetLiquidationCourtApprovalException.prototype);
  }
}
