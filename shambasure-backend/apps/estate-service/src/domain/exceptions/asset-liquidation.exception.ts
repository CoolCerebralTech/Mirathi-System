// src/estate-service/src/domain/entities/exceptions/asset-liquidation.exception.ts

/**
 * Base Asset Liquidation Exception
 */
export abstract class AssetLiquidationException extends Error {
  constructor(
    message: string,
    public readonly assetId?: string,
    public readonly liquidationId?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AssetLiquidationException.prototype);
  }
}

/**
 * Asset Cannot Be Liquidated Exception
 */
export class AssetCannotBeLiquidatedException extends AssetLiquidationException {
  constructor(assetId: string, reason: string) {
    super(`Asset ${assetId} cannot be liquidated: ${reason}`, assetId);
  }
}

/**
 * Liquidation Already Exists Exception
 */
export class LiquidationAlreadyExistsException extends AssetLiquidationException {
  constructor(assetId: string) {
    super(`Asset ${assetId} already has an active liquidation`, assetId);
  }
}

/**
 * Invalid Liquidation Amount Exception
 */
export class InvalidLiquidationAmountException extends AssetLiquidationException {
  constructor(assetId: string, targetAmount: number, currentValue: number) {
    super(
      `Invalid liquidation amount ${targetAmount} for asset ${assetId}. Current value: ${currentValue}`,
      assetId,
    );
  }
}

/**
 * Liquidation Not Found Exception
 */
export class LiquidationNotFoundException extends AssetLiquidationException {
  constructor(liquidationId: string, assetId: string) {
    super(`Liquidation ${liquidationId} not found for asset ${assetId}`, assetId, liquidationId);
  }
}

/**
 * Liquidation Cannot Be Modified Exception
 */
export class LiquidationCannotBeModifiedException extends AssetLiquidationException {
  constructor(liquidationId: string, reason: string) {
    super(`Liquidation ${liquidationId} cannot be modified: ${reason}`, undefined, liquidationId);
  }
}

/**
 * Liquidation Approval Required Exception
 */
export class LiquidationApprovalRequiredException extends AssetLiquidationException {
  constructor(liquidationId: string, requiredBy: string) {
    super(
      `Liquidation ${liquidationId} requires approval from ${requiredBy}`,
      undefined,
      liquidationId,
    );
  }
}

/**
 * Liquidation Completion Failed Exception
 */
export class LiquidationCompletionFailedException extends AssetLiquidationException {
  constructor(liquidationId: string, reason: string) {
    super(`Liquidation ${liquidationId} completion failed: ${reason}`, undefined, liquidationId);
  }
}

/**
 * Liquidation Below Reserve Price Exception
 */
export class LiquidationBelowReservePriceException extends AssetLiquidationException {
  constructor(assetId: string, bidAmount: number, reservePrice: number) {
    super(
      `Liquidation bid ${bidAmount} for asset ${assetId} is below reserve price ${reservePrice}`,
      assetId,
    );
  }
}
