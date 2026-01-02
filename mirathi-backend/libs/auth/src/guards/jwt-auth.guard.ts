// libs/auth/src/guards/jwt-auth.guard.ts
import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT Authentication Guard
 *
 * Protects routes by requiring a valid JWT token.
 * Can be bypassed with @Public() decorator.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  // List of paths that are ALWAYS public.
  // This allows the Gateway to let these requests pass through to the microservices
  // without needing a token, since the Gateway cannot see the @Public() decorator
  // on the remote microservice controllers.
  private readonly globalPublicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/resend-verification',
    '/auth/forgot-password',
    '/auth/validate-reset-token',
    '/auth/reset-password',
    '/auth/refresh',
    '/health',
    '/docs',
    '/api-json',
    '/graphql', // GraphQL endpoint (handles auth via resolvers)
  ];

  // Patterns for matching public path prefixes
  private readonly publicPathPrefixes = ['/auth/', '/health', '/docs', '/api-json'];

  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Entry point for the guard.
   * Checks if the route is marked as @Public() or matches a public path.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<{ method: string; url: string }>();

    // Get the clean path without query parameters
    const cleanPath = request.url.split('?')[0];

    // 1. Check Global Public Paths (Exact Match)
    const isExactMatch = this.globalPublicPaths.some((path) => cleanPath === path);

    if (isExactMatch) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`🔓 Allowing Public Path (Exact): ${cleanPath}`);
      }
      return true;
    }

    // 2. Check Public Path Prefixes (Prefix Match)
    const isPrefixMatch = this.publicPathPrefixes.some((prefix) => cleanPath.startsWith(prefix));

    if (isPrefixMatch) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`🔓 Allowing Public Path (Prefix): ${cleanPath}`);
      }
      return true;
    }

    // 3. Check @Public() Decorator (Reflection Check)
    // This is still useful if the Guard is used locally within a Microservice
    const isDecoratorPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isDecoratorPublic) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`🔓 Allowing Public Route (Decorator): ${cleanPath}`);
      }
      return true;
    }

    // Debugging logs for development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`🔒 Checking Token for: ${request.method} ${cleanPath}`);
    }

    // 4. Proceed with standard JWT authentication flow
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
      throw err ?? new UnauthorizedException(`Authentication failed: ${errorMessage}`);
    }

    return user;
  }
}
