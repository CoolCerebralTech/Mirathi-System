// src/presentation/decorators/current-user.decorator.ts
import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Current User Decorator for GraphQL
 *
 * Extracts the authenticated user from the GraphQL context.
 * Must be used with @UseGuards(GqlAuthGuard).
 *
 * @example
 * ```typescript
 * @Query(() => UserOutput)
 * @UseGuards(GqlAuthGuard)
 * async me(@CurrentUser() user: JwtPayload) {
 *   return this.userService.getUserById(user.sub);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user;

    // If a specific property is requested, return that
    if (data && user) {
      return user[data];
    }

    // Otherwise return the entire user object
    return user;
  },
);

/**
 * JWT Payload interface (from @shamba/auth)
 *
 * This is what CurrentUser returns after authentication.
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  role: string; // User role (USER, VERIFIER, ADMIN)
  iat?: number; // Issued at
  exp?: number; // Expires at
}
