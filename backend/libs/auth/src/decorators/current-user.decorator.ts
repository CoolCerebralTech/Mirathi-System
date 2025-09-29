import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/auth.interface';

/**
 * A parameter decorator to extract the authenticated user's JWT payload
 * from the request object. Assumes that an authentication guard (e.g., JwtAuthGuard)
 * has already run and attached the user object to the request.
 *
 * @example
 * // 1. Get the entire user payload:
 * me(@CurrentUser() user: JwtPayload) { ... }
 *
 * // 2. Get a specific property from the payload (e.g., the user ID):
 * myWills(@CurrentUser('sub') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // The user object is attached to the request by Passport's JWT strategy.
    const user: JwtPayload | undefined = request.user;

    // If a specific key is requested (e.g., 'sub'), return that property.
    // Otherwise, return the entire user payload object.
    return data ? user?.[data] : user;
  },
);