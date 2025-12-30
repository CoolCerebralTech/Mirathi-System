// src/estate-service/src/domain/exceptions/estate.exception.ts

export class EstateException extends Error {
  constructor(
    message: string,
    public readonly estateId?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, EstateException.prototype);
  }
}

export class EstateLogicException extends EstateException {
  constructor(message: string, estateId?: string) {
    super(message, estateId);
  }
}

/**
 * Thrown when trying to pay a low-priority debt before high-priority ones.
 * (S.45 Violation)
 */
export class Section45ViolationException extends EstateException {
  constructor(estateId: string, details: string) {
    super(`Law of Succession S.45 Violation: ${details}`, estateId);
  }
}

export class EstateInsolventException extends EstateException {
  constructor(estateId: string, currentNetValue: number) {
    super(`Estate is Insolvent (Net Value: ${currentNetValue}). Cannot distribute.`, estateId);
  }
}

export class TaxComplianceBlockException extends EstateException {
  constructor(estateId: string, taxStatus: string) {
    super(`Distribution Blocked by KRA Tax Compliance. Status: ${taxStatus}`, estateId);
  }
}

export class EstateFrozenException extends EstateException {
  constructor(estateId: string, reason: string) {
    super(`Estate is Frozen: ${reason}. Operation denied.`, estateId);
  }
}
