import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Password strength requirements for Shamba Sure
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * Default password requirements
 */
const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

@ValidatorConstraint({ name: 'IsStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // FIX #1: Assert the type of the constraint
    const requirements = (args.constraints[0] as PasswordRequirements) || DEFAULT_REQUIREMENTS;

    // Check minimum length
    if (password.length < requirements.minLength) {
      return false;
    }

    // Check for uppercase letters
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      return false;
    }

    // Check for lowercase letters
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      return false;
    }

    // Check for numbers
    if (requirements.requireNumbers && !/\d/.test(password)) {
      return false;
    }

    // Check for special characters
    if (
      requirements.requireSpecialChars &&
      !/[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]/.test(password)
    ) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    // FIX #1: Assert the type of the constraint here as well
    const requirements = (args.constraints[0] as PasswordRequirements) || DEFAULT_REQUIREMENTS;
    const messages: string[] = [];

    messages.push(`at least ${requirements.minLength} characters`);

    if (requirements.requireUppercase) {
      messages.push('one uppercase letter');
    }

    if (requirements.requireLowercase) {
      messages.push('one lowercase letter');
    }

    if (requirements.requireNumbers) {
      messages.push('one number');
    }

    if (requirements.requireSpecialChars) {
      messages.push('one special character');
    }

    return `Password must contain ${messages.join(', ')}.`;
  }
}

/**
 * Validates that a password meets the configured strength requirements.
 */
export function IsStrongPassword(
  requirements?: Partial<PasswordRequirements>,
  validationOptions?: ValidationOptions,
) {
  // FIX #2: Change 'any' to 'object' for better type safety
  return (object: object, propertyName: string) => {
    const finalRequirements: PasswordRequirements = {
      ...DEFAULT_REQUIREMENTS,
      ...requirements,
    };

    registerDecorator({
      // Now, TypeScript knows object.constructor is a Function, so this is safe
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [finalRequirements],
      validator: IsStrongPasswordConstraint,
    });
  };
}
