export class ExecutorDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutorDomainException';
  }
}

export class ExecutorValidationException extends ExecutorDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutorValidationException';
  }
}

export class ExecutorStateException extends ExecutorDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutorStateException';
  }
}

export class ExecutorCapacityException extends ExecutorDomainException {
  constructor(message: string) {
    super(`Section 7 LSA Violation: ${message}`);
    this.name = 'ExecutorCapacityException';
  }
}
