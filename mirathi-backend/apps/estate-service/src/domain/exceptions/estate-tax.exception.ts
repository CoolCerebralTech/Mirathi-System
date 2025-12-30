// src/estate-service/src/domain/exceptions/estate-tax.exception.ts

export class TaxComplianceException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaxComplianceException';
    Object.setPrototypeOf(this, TaxComplianceException.prototype);
  }
}

export class TaxAssessmentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaxAssessmentException';
    Object.setPrototypeOf(this, TaxAssessmentException.prototype);
  }
}

export class TaxClearanceException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaxClearanceException';
    Object.setPrototypeOf(this, TaxClearanceException.prototype);
  }
}

export class TaxExemptionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaxExemptionException';
    Object.setPrototypeOf(this, TaxExemptionException.prototype);
  }
}

export class TaxPaymentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaxPaymentException';
    Object.setPrototypeOf(this, TaxPaymentException.prototype);
  }
}
