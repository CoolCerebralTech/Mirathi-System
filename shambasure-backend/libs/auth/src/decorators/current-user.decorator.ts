import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtPayload } from '../interfaces/auth.interface';

// Utility type to get the value types of an object.
type ValueOf<T> = T[keyof T];

/**
 * A parameter decorator to extract the authenticated user's JWT payload
 * from the request object.
 *
 * This decorator is strict: it will throw an InternalServerErrorException
 * if the `user` object is not found on the request. It should only be used on
 * routes that are protected by a JWT authentication guard.
 *
 * @example
 * // 1. Get the entire user payload:
 * me(@CurrentUser() user: JwtPayload) { ... }
 *
 * // 2. Get a specific property from the payload (e.g., the user ID):
 * myWills(@CurrentUser('sub') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  // ⭐ --- THE FIX IS HERE --- ⭐
  // We explicitly tell TypeScript the function's return type.
  // This removes ambiguity and satisfies the strict ESLint rule.
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | ValueOf<JwtPayload> => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new InternalServerErrorException(
        'User not found in request context. Make sure the JwtAuthGuard is applied to this route.',
      );
    }

    // The logic remains the same, but now the linter understands its return type.
    return data ? user[data] : user;
  },
);
