import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsStrongPassword,
} from 'class-validator';
import { createHash } from 'crypto';
import axios from 'axios';

// ============================================================================
// CONSTRAINT 1: Check against Have I Been Pwned (HIBP) database
// ============================================================================

@ValidatorConstraint({ name: 'isNotCommonPassword', async: true })
export class IsNotCommonPasswordConstraint implements ValidatorConstraintInterface {
  async validate(password: string): Promise<boolean> {
    if (!password || typeof password !== 'string') {
      return true; // Let other validators like @IsString handle this
    }

    try {
      // 1. Hash the password with SHA-1 (HIBP API requirement)
      const sha1Hash = createHash('sha1').update(password).digest('hex').toUpperCase();
      const hashPrefix = sha1Hash.substring(0, 5);
      const hashSuffix = sha1Hash.substring(5);

      // 2. Query the HIBP k-Anonymity API
      const response = await axios.get<string>(
        `https://api.pwnedpasswords.com/range/${hashPrefix}`,
        {
          responseType: 'text',
          timeout: 3000,
          headers: {
            'Add-Padding': 'true', // recommended for privacy
            'User-Agent': 'ShambaApp/1.0',
          },
        },
      );

      // 3. Check if the password's hash suffix appears in the response list
      const found = response.data.split('\n').some((line: string) => {
        const [suffix] = line.split(':');
        return suffix === hashSuffix;
      });

      return !found;
    } catch (err) {
      // Fail open: don’t block user if API is unavailable
      console.warn('Pwned Passwords API check failed:', (err as Error).message);
      return true;
    }
  }

  defaultMessage(): string {
    return 'This password has been exposed in a data breach and is not safe to use. Please choose a different password.';
  }
}

// ============================================================================
// DECORATOR: The final composite decorator to be used in DTOs
// ============================================================================

/**
 * A composite decorator that validates a password for both strength and for being
 * exposed in a public data breach.
 */
export function IsSecurePassword(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string): void {
    // Rule 1: Apply the strong password requirements
    IsStrongPassword(
      {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      },
      {
        message:
          'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        ...validationOptions,
      },
    )(object, propertyName);

    // Rule 2: Apply the "pwned password" check
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotCommonPasswordConstraint,
    });
  };
}
