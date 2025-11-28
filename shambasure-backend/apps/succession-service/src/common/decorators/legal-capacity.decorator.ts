import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';

import { LegalCapacityGuard } from '../guards/legal-capacity.guard';

/**
 * The metadata key used to activate the LegalCapacityGuard.
 */
export const REQUIRE_LEGAL_CAPACITY_KEY = 'requireLegalCapacity';

export interface LegalCapacityOptions {
  minAge?: number; // Override default minimum age (default: 18)
  requireSoundMind?: boolean; // Whether to require sound mind check (default: true)
  contextField?: string; // Custom field for contextual data
}

/**
 * A method decorator for routes that require the authenticated user to have
 * legal capacity to create a will (i.e., be of sound mind and of legal age).
 *
 * This decorator applies the `LegalCapacityGuard`, which performs the actual validation.
 *
 * @param options Configuration options for legal capacity validation
 *
 * @example
 * // In a controller, to protect the will creation endpoint:
 * @Post()
 * @RequiresLegalCapacity()
 * createWill(@Body() dto: CreateWillDto) { ... }
 *
 * // With custom configuration:
 * @Post()
 * @RequiresLegalCapacity({ minAge: 21, requireSoundMind: false })
 * createWill(@Body() dto: CreateWillDto) { ... }
 */
export const RequiresLegalCapacity = (options: LegalCapacityOptions = {}) =>
  applyDecorators(SetMetadata(REQUIRE_LEGAL_CAPACITY_KEY, options), UseGuards(LegalCapacityGuard));

// ============================================================================
// DOMAIN-SPECIFIC SHORTCUTS
// ============================================================================

/**
 * Standard legal capacity check for will creation (18+, sound mind)
 */
export const RequiresWillCreationCapacity = () =>
  RequiresLegalCapacity({ minAge: 18, requireSoundMind: true });

/**
 * Legal capacity for minors who are married (Kenyan law exception)
 */
export const RequiresMarriedMinorCapacity = () =>
  RequiresLegalCapacity({ minAge: 16, requireSoundMind: true });

/**
 * Legal capacity for testamentary guardianship appointments
 */
export const RequiresGuardianAppointmentCapacity = () =>
  RequiresLegalCapacity({ minAge: 18, requireSoundMind: true });

/**
 * Legal capacity for executor nomination
 */
export const RequiresExecutorNominationCapacity = () =>
  RequiresLegalCapacity({ minAge: 18, requireSoundMind: true });
