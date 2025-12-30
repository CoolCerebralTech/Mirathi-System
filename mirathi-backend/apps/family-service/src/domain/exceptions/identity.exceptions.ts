// domain/exceptions/identity-exceptions.ts
export class InvalidNationalIdException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNationalIdException';
  }
}

export class InvalidKraPinException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidKraPinException';
  }
}

export class InvalidBirthCertificateException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBirthCertificateException';
  }
}

export class InvalidDeathCertificateException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDeathCertificateException';
  }
}

export class IdentityVerificationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityVerificationException';
  }
}

export class InvalidIdentityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidIdentityException';
  }
}
