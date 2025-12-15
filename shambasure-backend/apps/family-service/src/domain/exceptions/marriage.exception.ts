export class MarriageException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarriageException';
  }
}

export class InvalidMarriageException extends MarriageException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMarriageException';
  }
}

export class PolygamyException extends MarriageException {
  constructor(message: string) {
    super(message);
    this.name = 'PolygamyException';
  }
}

export class MarriageDissolutionException extends MarriageException {
  constructor(message: string) {
    super(message);
    this.name = 'MarriageDissolutionException';
  }
}
