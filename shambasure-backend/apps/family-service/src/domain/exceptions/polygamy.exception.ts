export class PolygamyException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PolygamyException';
  }
}

export class InvalidPolygamousHouseException extends PolygamyException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPolygamousHouseException';
  }
}

export class S40ComplianceException extends PolygamyException {
  constructor(message: string) {
    super(message);
    this.name = 'S40ComplianceException';
  }
}
