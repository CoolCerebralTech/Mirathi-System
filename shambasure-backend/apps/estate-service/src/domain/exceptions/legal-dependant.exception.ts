// src/estate-service/src/domain/exceptions/legal-dependant.exception.ts

export class DependantException extends Error {
  constructor(
    message: string,
    public readonly dependantId?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DependantException.prototype);
  }
}

export class DependantLogicException extends DependantException {
  constructor(message: string, dependantId?: string) {
    super(message, dependantId);
  }
}

/**
 * Thrown when trying to verify a claim without supporting docs.
 */
export class MissingEvidenceException extends DependantException {
  constructor(dependantId: string, details: string) {
    super(`Evidence missing for Dependant ${dependantId}: ${details}`, dependantId);
  }
}

/**
 * Thrown if attempting to verify a rejected claim without re-opening it.
 */
export class InvalidDependantStatusException extends DependantException {
  constructor(dependantId: string, status: string) {
    super(`Operation not allowed in current status: ${status}`, dependantId);
  }
}
