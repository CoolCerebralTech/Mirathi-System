/**
 * Base error for all value object validation failures.
 * This allows the application layer to specifically catch domain validation errors.
 */
export class ValueObjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValueObjectError';
  }
}
