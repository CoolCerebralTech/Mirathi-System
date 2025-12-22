export class EstateDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EstateDomainException';
  }
}

export class InvalidAssetConfigurationException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAssetConfigurationException';
  }
}

export class AssetLegalViolationException extends EstateDomainException {
  constructor(message: string) {
    super(`[Kenyan Legal Violation] ${message}`);
    this.name = 'AssetLegalViolationException';
  }
}

export class AssetVerificationException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'AssetVerificationException';
  }
}

export class AssetEncumbranceException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'AssetEncumbranceException';
  }
}

export class LifeInterestException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'LifeInterestException';
  }
}
