import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

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
  ];

  private readonly publicPathPrefixes = ['/auth/', '/health', '/docs', '/api-json'];

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<{ method: string; url: string }>();
    const cleanPath = request.url.split('?')[0];

    const isExactMatch = this.globalPublicPaths.some((path) => cleanPath === path);
    if (isExactMatch) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`🔓 Public Path (Exact): ${cleanPath}`);
      }
      return true;
    }

    const isPrefixMatch = this.publicPathPrefixes.some((prefix) => cleanPath.startsWith(prefix));
    if (isPrefixMatch) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`🔓 Public Path (Prefix): ${cleanPath}`);
      }
      return true;
    }

    const isDecoratorPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isDecoratorPublic) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`🔓 Public Route (Decorator): ${cleanPath}`);
      }
      return true;
    }

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`🔒 Checking Token: ${request.method} ${cleanPath}`);
    }

    return super.canActivate(context);
  }

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
