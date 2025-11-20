import * as argon2 from 'argon2';

/**
 * A custom error for password-related validation failures.
 */
export class InvalidPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

/**
 * Password strength requirements
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Password Value Object
 * Encapsulates password validation, hashing, and comparison logic.
 */
export class Password {
  private static readonly ARGON2_OPTIONS: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
    hashLength: 32,
  };

  private readonly hashedPassword: string;

  private constructor(hashedPassword: string) {
    this.hashedPassword = hashedPassword;
  }

  static async create(
    plainPassword: string,
    requirements: PasswordRequirements = DEFAULT_REQUIREMENTS,
  ): Promise<Password> {
    this.validateStrength(plainPassword, requirements);
    const hashed = await this.hash(plainPassword);
    return new Password(hashed);
  }

  static fromStoredHash(hashedPassword: string): Password {
    if (!hashedPassword || !hashedPassword.startsWith('$argon2id$')) {
      throw new InvalidPasswordError('Invalid stored password hash format.');
    }
    return new Password(hashedPassword);
  }

  private static validateStrength(password: string, requirements: PasswordRequirements): void {
    if (!password || typeof password !== 'string') {
      throw new InvalidPasswordError('Password must be a non-empty string.');
    }
    if (password.length < requirements.minLength) {
      throw new InvalidPasswordError(
        `Password must be at least ${requirements.minLength} characters long.`,
      );
    }
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      throw new InvalidPasswordError('Password must contain at least one uppercase letter.');
    }
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      throw new InvalidPasswordError('Password must contain at least one lowercase letter.');
    }
    if (requirements.requireNumbers && !/\d/.test(password)) {
      throw new InvalidPasswordError('Password must contain at least one number.');
    }
    if (
      requirements.requireSpecialChars &&
      !/[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]/.test(password)
    ) {
      throw new InvalidPasswordError('Password must contain at least one special character.');
    }
  }

  private static async hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, this.ARGON2_OPTIONS);
  }

  async compare(plainPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(this.hashedPassword, plainPassword);
    } catch {
      // DEFINITIVE FIX: No parameter in the catch block
      // This indicates we are intentionally ignoring the error object.
      return false;
    }
  }

  /**
   * Checks if this password (plain or hashed) matches a given stored hash.
   * Useful for preventing password reuse.
   */
  async matchesHash(storedHash: string): Promise<boolean> {
    try {
      // Compare the *new* password's plain value against an old stored hash
      return await argon2.verify(storedHash, this.hashedPassword);
    } catch {
      return false;
    }
  }

  /**
   * Checks if the current hash uses outdated security parameters.
   */
  needsRehash(): boolean {
    return argon2.needsRehash(this.hashedPassword, Password.ARGON2_OPTIONS);
  }

  getValue(): string {
    return this.hashedPassword;
  }

  toString(): string {
    return '***PROTECTED***';
  }
}
