// domain/exceptions/will-not-found.exception.ts
export class WillNotFoundException extends Error {
  constructor(willId: string) {
    super(`Will with ID ${willId} not found`);
    this.name = 'WillNotFoundException';
  }
}
