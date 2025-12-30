// src/estate-service/src/domain/exceptions/debt.exception.ts

export class DebtLogicException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DebtLogicException';
    Object.setPrototypeOf(this, DebtLogicException.prototype);
  }
}

export class InvalidDebtAmountException extends Error {
  constructor(estateId: string, amount: number) {
    super(`Invalid debt amount ${amount} for estate ${estateId}. Amount must be positive.`);
    this.name = 'InvalidDebtAmountException';
    Object.setPrototypeOf(this, InvalidDebtAmountException.prototype);
  }
}

export class StatuteBarredDebtException extends Error {
  constructor(debtId: string, limitationYears: number) {
    super(`Debt ${debtId} is statute barred after ${limitationYears} years and cannot be paid.`);
    this.name = 'StatuteBarredDebtException';
    Object.setPrototypeOf(this, StatuteBarredDebtException.prototype);
  }
}

export class DebtPaymentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DebtPaymentException';
    Object.setPrototypeOf(this, DebtPaymentException.prototype);
  }
}

export class DebtVerificationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DebtVerificationException';
    Object.setPrototypeOf(this, DebtVerificationException.prototype);
  }
}
