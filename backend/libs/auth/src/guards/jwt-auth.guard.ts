import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * This method is the entry point for the guard.
   * It first checks if the route is marked as @Public().
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the route is public, allow access immediately.
    if (isPublic) {
      return true;
    }

    // Otherwise, proceed with the standard JWT authentication flow.
    return super.canActivate(context);
  }

  /**
   * This method is called by the underlying Passport strategy after it has
   * validated (or failed to validate) the token.
   */
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    // This allows us to customize the error thrown.
    if (err || !user) {
      // 'info' can contain details like 'TokenExpiredError' or 'JsonWebTokenError'
      const errorMessage = info instanceof Error ? info.message : 'Invalid or missing token.';
      throw err || new UnauthorizedException(`Authentication failed: ${errorMessage}`);
    }
    return user;
  }
}