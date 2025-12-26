// src/estate-service/src/domain/exceptions/estate-tax.exception.ts

/**
 * Base Tax Compliance Exception
 */
export class TaxComplianceException extends Error {
  constructor(
    message: string,
    public readonly estateId?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, TaxComplianceException.prototype);
  }
}

/**
 * Thrown when trying to distribute assets but Tax is not cleared.
 * (The "Bouncer" blocking the door)
 */
export class TaxDistributionBlockException extends TaxComplianceException {
  constructor(estateId: string, currentStatus: string) {
    super(
      `Estate Distribution BLOCKED. Tax Compliance is pending. Current Status: ${currentStatus}`,
      estateId,
    );
  }
}

/**
 * Thrown when attempting to mark cleared without a valid certificate number.
 */
export class MissingTaxCertificateException extends TaxComplianceException {
  constructor(estateId: string) {
    super(`Cannot clear tax compliance without a valid KRA Certificate Number`, estateId);
  }
}

/**
 * Thrown when payment amount is invalid (negative or zero).
 */
export class InvalidTaxPaymentException extends TaxComplianceException {
  constructor(estateId: string, amount: number) {
    super(`Invalid tax payment amount: ${amount}. Must be positive.`, estateId);
  }
}

/**
 * Thrown when attempting to modify a record that is already finalized/cleared.
 */
export class TaxRecordFinalizedException extends TaxComplianceException {
  constructor(estateId: string) {
    super(`Cannot modify Tax Compliance record. It is already CLEARED or EXEMPT.`, estateId);
  }
}

/**
 * Thrown when KRA PIN is missing or invalid format.
 */
export class InvalidKraPinException extends TaxComplianceException {
  constructor(pin: string) {
    super(`Invalid KRA PIN format: ${pin}`);
  }
}
