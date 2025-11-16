import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ConfigType } from '@nestjs/config';
import { REQUIRE_LEGAL_CAPACITY_KEY } from '../decorators/legal-capacity.decorator';
import { legalRulesConfig } from '../config/legal-rules.config';
import { User } from '@prisma/client'; // Assuming the user object is attached to the request

/**
 * A guard that checks if the authenticated user has the legal capacity to create a will,
 * as defined by the Kenyan Law of Succession Act (Section 7).
 *
 * It is activated by the `@RequiresLegalCapacity()` decorator.
 */
@Injectable()
export class LegalCapacityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    // --- PERFECT INTEGRATION: Injects our centralized legal rules ---
    @Inject(legalRulesConfig.KEY)
    private readonly rules: ConfigType<typeof legalRulesConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isRequired = this.reflector.get<boolean>(
      REQUIRE_LEGAL_CAPACITY_KEY,
      context.getHandler(),
    );

    // If the decorator is not applied, the guard does nothing.
    if (!isRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User; // Assumes a user object is attached by a previous auth guard

    if (!user) {
      // This should technically be caught by an AuthGuard first, but it's a safe fallback.
      throw new ForbiddenException('A user must be authenticated to perform this action.');
    }

    const { minAge, requiresSoundMind } = this.rules.testatorCapacity;

    // We can't definitively check for "sound mind" in an automated way,
    // but we can check for flags on the user profile if they exist.
    // The primary check is for age.

    // A real implementation would calculate age from date of birth.
    // For this example, we'll assume an `age` property exists on the user object.
    const userAge = this.calculateAge(user.dateOfBirth); // Assuming user model has dateOfBirth

    if (userAge < minAge) {
      throw new ForbiddenException(
        `User does not meet the minimum age requirement of ${minAge} to create a will (Law of Succession Act, Section 7).`,
      );
    }

    // Placeholder for a check on the user's profile for any flags
    // if (requiresSoundMind && user.profile?.hasIncapacityFlags) {
    //   throw new ForbiddenException('User does not have the required mental capacity.');
    // }

    return true;
  }

  private calculateAge(dateOfBirth: Date | null): number {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
