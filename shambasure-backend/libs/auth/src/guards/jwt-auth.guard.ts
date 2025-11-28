import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Entry point for the guard.
   * Checks if the route is marked as @Public() before enforcing authentication.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Debugging logs for development/staging environments
    if (process.env.NODE_ENV !== 'production') {
      const request = context.switchToHttp().getRequest<{ method: string; url: string }>();
      this.logger.debug(`--- JWT GUARD CHECKING ---`);
      this.logger.debug(`Request: ${request.method} ${request.url}`);
      this.logger.debug(`Is Route Public: ${isPublic ?? false}`);
      this.logger.debug(`--------------------------`);
    }

    // Allow access immediately if route is public
    if (isPublic) {
      return true;
    }

    // Proceed with standard JWT authentication flow
    return super.canActivate(context);
  }

  /**
   * Called by Passport strategy after token validation.
   * Customizes error handling for authentication failures.
   */
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
  ): TUser {
    if (err || !user) {
      const errorMessage = info?.message ?? 'Invalid or missing token';
      this.logger.warn(`Authentication failed: ${errorMessage}`);
      throw err ?? new UnauthorizedException(`Authentication failed: ${errorMessage}`);
    }

    return user;
  }
}
