import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { LegalCapacityGuard } from '../guards/legal-capaacity.guard';

/**
 * The metadata key used to activate the LegalCapacityGuard.
 */
export const REQUIRE_LEGAL_CAPACITY_KEY = 'requireLegalCapacity';

/**
 * A method decorator for routes that require the authenticated user to have
 * legal capacity to create a will (i.e., be of sound mind and of legal age).
 *
 * This decorator applies the `LegalCapacityGuard`, which performs the actual validation.
 *
 * @example
 * // In a controller, to protect the will creation endpoint:
 * @Post()
 * @UseGuards(JwtAuthGuard)
 * @RequiresLegalCapacity()
 * createWill(@GetUser() user: User, @Body() dto: CreateWillDto) { ... }
 */
export const RequiresLegalCapacity = () =>
  applyDecorators(SetMetadata(REQUIRE_LEGAL_CAPACITY_KEY, true), UseGuards(LegalCapacityGuard));
