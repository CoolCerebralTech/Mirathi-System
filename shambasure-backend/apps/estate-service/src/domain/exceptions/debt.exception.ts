// src/estate-service/src/domain/entities/exceptions/debt.exception.ts

/**
 * Base Debt Exception
 */
export abstract class DebtException extends Error {
  constructor(
    message: string,
    public readonly debtId?: string,
    public readonly estateId?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DebtException.prototype);
  }
}

/**
 * Debt Already Exists Exception
 */
export class DebtAlreadyExistsException extends DebtException {
  constructor(debtId: string, estateId: string) {
    super(`Debt ${debtId} already exists in estate ${estateId}`, debtId, estateId);
  }
}

/**
 * Debt Not Found Exception
 */
export class DebtNotFoundException extends DebtException {
  constructor(debtId: string, estateId: string) {
    super(`Debt ${debtId} not found in estate ${estateId}`, debtId, estateId);
  }
}

/**
 * Invalid Debt Amount Exception
 */
export class InvalidDebtAmountException extends DebtException {
  constructor(debtId: string, amount: number) {
    super(`Invalid debt amount ${amount} for debt ${debtId}. Must be positive number.`, debtId);
  }
}

/**
 * Debt Cannot Be Modified Exception
 */
export class DebtCannotBeModifiedException extends DebtException {
  constructor(debtId: string, reason: string) {
    super(`Debt ${debtId} cannot be modified: ${reason}`, debtId);
  }
}

/**
 * Debt Payment Exceeds Balance Exception
 */
export class DebtPaymentExceedsBalanceException extends DebtException {
  constructor(debtId: string, paymentAmount: number, outstandingBalance: number) {
    super(
      `Payment of ${paymentAmount} exceeds outstanding balance ${outstandingBalance} for debt ${debtId}`,
      debtId,
    );
  }
}

/**
 * Secured Debt Asset Mismatch Exception
 */
export class SecuredDebtAssetMismatchException extends DebtException {
  constructor(debtId: string, assetId: string) {
    super(
      `Debt ${debtId} is secured by asset ${assetId} but asset does not exist or is not encumbered`,
      debtId,
    );
  }
}

/**
 * Statute Barred Debt Exception
 */
export class StatuteBarredDebtException extends DebtException {
  constructor(debtId: string, limitationPeriod: number) {
    super(
      `Debt ${debtId} is statute barred under Limitation Act (${limitationPeriod} years)`,
      debtId,
    );
  }
}

/**
 * Debt Priority Invalid Exception
 */
export class DebtPriorityInvalidException extends DebtException {
  constructor(debtId: string, issue: string) {
    super(`Invalid debt priority for debt ${debtId}: ${issue}`, debtId);
  }
}

/**
 * Debt Tier Invalid Exception
 */
export class DebtTierInvalidException extends DebtException {
  constructor(debtId: string, tier: string) {
    super(`Invalid debt tier ${tier} for debt ${debtId}`, debtId);
  }
}

/**
 * Debt Settlement Failed Exception
 */
export class DebtSettlementFailedException extends DebtException {
  constructor(debtId: string, reason: string) {
    super(`Debt ${debtId} settlement failed: ${reason}`, debtId);
  }
}
