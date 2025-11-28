import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtPayload } from '@shamba/auth';
import {
  REQUIRE_LEGAL_CAPACITY_KEY,
  LegalCapacityOptions,
} from '../decorators/legal-capacity.decorator';

// Extended request type with user and profile data
interface LegalCapacityRequest extends Request {
  user: JwtPayload & {
    dateOfBirth?: string;
    profile?: {
      hasMentalCapacity?: boolean;
      isMarried?: boolean;
      legalCapacityNotes?: string;
    };
  };
  body: Record<string, unknown>;
}

/**
 * A guard that checks if the authenticated user has the legal capacity to perform actions
 * as defined by the Kenyan Law of Succession Act (Section 7).
 *
 * Features:
 * - Age validation (minimum 18 years or married minor exception)
 * - Mental capacity validation
 * - Kenyan legal exceptions handling
 * - Customizable configuration
 */
@Injectable()
export class LegalCapacityGuard implements CanActivate {
  private readonly logger = new Logger(LegalCapacityGuard.name);

  // Kenyan legal requirements
  private readonly DEFAULT_MIN_AGE = 18;
  private readonly MARRIED_MINOR_MIN_AGE = 16; // Kenyan law exception for married minors

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<LegalCapacityOptions>(
      REQUIRE_LEGAL_CAPACITY_KEY,
      context.getHandler(),
    );

    // If the decorator is not applied, the guard does nothing.
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<LegalCapacityRequest>();
    const user = request.user;

    if (!user) {
      this.logger.warn('LegalCapacityGuard triggered without an authenticated user');
      throw new ForbiddenException('Authentication is required to validate legal capacity');
    }

    // Validate legal capacity based on Kenyan law
    const validationResult = this.validateLegalCapacity(user, options);

    if (!validationResult.isValid) {
      this.logger.warn(
        `Legal capacity validation failed for user ${user.sub}: ${validationResult.reason}`,
      );
      throw new ForbiddenException(
        validationResult.reason,
        `Legal requirement: ${validationResult.lawSection}`,
      );
    }

    this.logger.debug(`Legal capacity validated for user ${user.sub}`);
    return true;
  }

  /**
   * Validate user's legal capacity based on Kenyan law requirements
   */
  private validateLegalCapacity(
    user: LegalCapacityRequest['user'],
    options: LegalCapacityOptions,
  ): { isValid: boolean; reason: string; lawSection: string } {
    const minAge = options.minAge ?? this.DEFAULT_MIN_AGE;
    const requireSoundMind = options.requireSoundMind ?? true;

    // Extract user data
    const userAge = this.calculateAge(user.dateOfBirth);
    const isMarried = user.profile?.isMarried === true;
    const hasMentalCapacity = user.profile?.hasMentalCapacity !== false;

    // Kenyan Law of Succession Act Section 7 validation
    if (userAge < minAge) {
      // Check for married minor exception (Kenyan law)
      if (userAge >= this.MARRIED_MINOR_MIN_AGE && isMarried) {
        this.logger.debug(`Married minor exception applied for user ${user.sub}`);
      } else {
        return {
          isValid: false,
          reason: `User does not meet the minimum age requirement of ${minAge} years`,
          lawSection: 'Law of Succession Act, Section 7',
        };
      }
    }

    // Mental capacity validation
    if (requireSoundMind && !hasMentalCapacity) {
      return {
        isValid: false,
        reason: 'User does not meet the mental capacity requirements',
        lawSection: 'Law of Succession Act, Section 7',
      };
    }

    // Additional Kenyan legal requirements
    const additionalChecks = this.performAdditionalKenyanChecks(user);
    if (!additionalChecks.isValid) {
      return additionalChecks;
    }

    return {
      isValid: true,
      reason: 'Legal capacity validated successfully',
      lawSection: 'Law of Succession Act, Section 7',
    };
  }

  /**
   * Perform additional Kenyan legal capacity checks
   */
  private performAdditionalKenyanChecks(user: LegalCapacityRequest['user']): {
    isValid: boolean;
    reason: string;
    lawSection: string;
  } {
    // Check if user is legally disqualified (e.g., convicted felons in some cases)
    // This would typically come from user profile or external service
    const isLegallyDisqualified = user.profile?.legalCapacityNotes?.includes('DISQUALIFIED');

    if (isLegallyDisqualified) {
      return {
        isValid: false,
        reason: 'User is legally disqualified from performing this action',
        lawSection: 'Law of Succession Act, Section 7',
      };
    }

    return {
      isValid: true,
      reason: 'Additional checks passed',
      lawSection: 'Law of Succession Act, Section 7',
    };
  }

  /**
   * Calculate age from date of birth with proper error handling
   */
  private calculateAge(dateOfBirth: string | undefined | null): number {
    if (!dateOfBirth) {
      this.logger.warn('User date of birth not available for legal capacity check');
      return 0; // Default to 0 to fail age check
    }

    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);

      // Validate date
      if (isNaN(birthDate.getTime())) {
        this.logger.error(`Invalid date of birth format: ${dateOfBirth}`);
        return 0;
      }

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      // Adjust age if birthday hasn't occurred this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Validate reasonable age range
      if (age < 0 || age > 120) {
        this.logger.warn(`Unreasonable age calculated: ${age}`);
        return 0;
      }

      return age;
    } catch (error) {
      this.logger.error(`Error calculating age from date of birth: ${error}`);
      return 0;
    }
  }
}
