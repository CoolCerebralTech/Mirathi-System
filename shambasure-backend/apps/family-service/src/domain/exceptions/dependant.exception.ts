export class DependencyDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DependencyDomainException';
  }
}

export class DependantException extends DependencyDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'DependantException';
  }
}

export class InvalidDependantException extends DependencyDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDependantException';
  }
}

export class DuplicateDependantException extends DependencyDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateDependantException';
  }
}
