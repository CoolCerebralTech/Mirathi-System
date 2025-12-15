export class FamilyDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FamilyDomainException';
  }
}

export class InvalidFamilyMemberException extends FamilyDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFamilyMemberException';
  }
}

export class PolygamyComplianceException extends FamilyDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'PolygamyComplianceException';
  }
}
