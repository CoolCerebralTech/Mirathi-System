export class RelationshipException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RelationshipException';
  }
}

export class InvalidRelationshipException extends RelationshipException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRelationshipException';
  }
}

export class InvalidCohabitationException extends RelationshipException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCohabitationException';
  }
}

export class InvalidAdoptionException extends RelationshipException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAdoptionException';
  }
}
