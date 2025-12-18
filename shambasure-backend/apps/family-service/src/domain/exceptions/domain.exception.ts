export class DomainException extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string = 'DOMAIN_ERROR', details?: unknown) {
    super(message);
    this.name = 'DomainException';
    this.code = code;
    this.details = details;

    // Maintain prototype chain for instanceof checks
    Object.setPrototypeOf(this, DomainException.prototype);
  }
}
