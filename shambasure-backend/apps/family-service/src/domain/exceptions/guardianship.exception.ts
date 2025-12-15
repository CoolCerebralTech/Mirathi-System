export class GuardianDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuardianDomainException';
  }
}

export class GuardianshipException extends GuardianDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'GuardianshipException';
  }
}

export class InvalidGuardianshipException extends GuardianDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGuardianshipException';
  }
}

export class GuardianBondException extends GuardianDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'GuardianBondException';
  }
}
