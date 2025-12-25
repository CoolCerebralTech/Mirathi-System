export class InvalidCodicilOperationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCodicilOperationException';
  }
}

export class CodicilWitnessingException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodicilWitnessingException';
  }
}

export class CodicilContentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodicilContentException';
  }
}
