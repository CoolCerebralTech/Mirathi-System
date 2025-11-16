import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { OwnershipGuard } from '../guards/ownership.guard';

// ============================================================================
// PARAMETER DECORATOR
// ============================================================================

/**
 * A parameter decorator to extract the authenticated user object from the request.
 * This assumes a previous guard (e.g., JwtAuthGuard) has attached the user to the request.
 *
 * @example
 * // In a controller:
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

// ============================================================================
// METADATA DECORATOR (The "Intent")
// ============================================================================

/**
 * The metadata key used to store ownership check options.
 */
export const CHECK_OWNERSHIP_KEY = 'checkOwnership';

export interface OwnershipOptions {
  resource: 'Will' | 'Asset' | 'Family'; // The Prisma model to check
  param: string; // The URL parameter containing the resource ID (e.g., 'willId')
  field?: string; // The ownership field on the model (defaults to 'testatorId' or 'ownerId')
}

/**
 * A master decorator that applies an ownership check to a route.
 * It sets metadata describing the resource to check and applies the OwnershipGuard,
 * which reads the metadata and performs the database query.
 *
 * @param options Defines the resource and parameter to check.
 */
export const CheckOwnership = (options: OwnershipOptions) =>
  applyDecorators(SetMetadata(CHECK_OWNERSHIP_KEY, options), UseGuards(OwnershipGuard));
