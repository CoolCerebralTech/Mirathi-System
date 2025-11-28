/**
 * A custom error to be thrown when email validation fails.
 */
export class InvalidEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailError';
  }
}

/**
 * Email Value Object
 *
 * Encapsulates email validation and normalization logic.
 * Guarantees that an Email object can never exist in an invalid state.
 */
export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  /**
   * Creates a new Email value object. This is the ONLY way to create an Email.
   * @throws InvalidEmailError if email is invalid.
   */
  static create(email: string): Email {
    const normalized = this.normalize(email);

    if (!this.isValid(normalized)) {
      // REFINEMENT: Throw the specific custom error
      throw new InvalidEmailError('Invalid email address format.');
    }

    return new Email(normalized);
  }

  /**
   * Normalizes an email address (lowercase and trim).
   */
  private static normalize(email: string): string {
    if (!email || typeof email !== 'string') {
      // REFINEMENT: Throw the specific custom error
      throw new InvalidEmailError('Email must be a non-empty string.');
    }
    return email.toLowerCase().trim();
  }

  /**
   * Validates email format.
   */
  private static isValid(email: string): boolean {
    if (typeof email !== 'string') return false;

    // REFINEMENT: Use a more robust, commonly accepted regex (OWASP standard)
    const emailRegex =
      /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional length checks remain valuable
    const [localPart, domain] = email.split('@');
    if (localPart.length > 64 || domain.length > 255) {
      return false;
    }

    return true;
  }

  /**
   * FIX: The `fromString` method has been removed.
   * It was an unsafe factory that bypassed validation.
   * Always use `Email.create()` for instantiation.
   */

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  isDomain(domain: string): boolean {
    return this.getDomain() === domain.toLowerCase();
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
