import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

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
    '/auth/refresh', // Refresh token endpoint handles its own validation
    '/health', // Health checks
    '/docs', // Swagger
  ];

  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Entry point for the guard.
   * Checks if the route is marked as @Public() or matches a public path.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<{ method: string; url: string }>();

    // 1. Check Global Public Paths (URL Check)
    // We use .includes() to handle prefixes like /api/v1/auth/login automatically
    const isPathPublic = this.globalPublicPaths.some((path) => request.url.includes(path));

    if (isPathPublic) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`🔓 Allowing Public Path: ${request.url}`);
      }
      return true;
    }

    // 2. Check @Public() Decorator (Reflection Check)
    // This is still useful if the Guard is used locally within a Microservice
    const isDecoratorPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isDecoratorPublic) {
      return true;
    }

    // Debugging logs for development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`🔒 Checking Token for: ${request.method} ${request.url}`);
    }

    // 3. Proceed with standard JWT authentication flow
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
      // Only log as warning to reduce noise, unless it's a critical env
      // this.logger.warn(`Authentication failed: ${errorMessage}`);
      throw err ?? new UnauthorizedException(`Authentication failed: ${errorMessage}`);
    }

    return user;
  }
}
