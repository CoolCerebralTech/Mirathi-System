// src/presentation/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public routes
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 *
 * Marks a resolver as public (no authentication required).
 * Useful for login, register, OAuth callbacks, etc.
 *
 * @example
 * ```typescript
 * @Mutation(() => AuthResponseOutput)
 * @Public()
 * async handleOAuthCallback(@Args('input') input: OAuthCallbackInput) {
 *   // No authentication required
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
