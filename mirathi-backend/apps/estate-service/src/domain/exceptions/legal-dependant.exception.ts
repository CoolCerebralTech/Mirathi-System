// src/estate-service/src/domain/exceptions/legal-dependant.exception.ts

export class DependantLogicException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DependantLogicException';
    Object.setPrototypeOf(this, DependantLogicException.prototype);
  }
}

export class DependantValidationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DependantValidationException';
    Object.setPrototypeOf(this, DependantValidationException.prototype);
  }
}

export class MissingEvidenceException extends Error {
  constructor(dependantId: string, requirement: string) {
    super(`Dependant ${dependantId} requires evidence: ${requirement}`);
    this.name = 'MissingEvidenceException';
    Object.setPrototypeOf(this, MissingEvidenceException.prototype);
  }
}

export class DependantVerificationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DependantVerificationException';
    Object.setPrototypeOf(this, DependantVerificationException.prototype);
  }
}

export class DependantSettlementException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DependantSettlementException';
    Object.setPrototypeOf(this, DependantSettlementException.prototype);
  }
}
