import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class GatewayAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      // Log the authentication failure
      const request = context.switchToHttp().getRequest();
      console.warn(`Authentication failed for ${request.method} ${request.url}`, {
        error: err?.message,
        info: info?.message,
        ip: request.ip,
        userAgent: request.get('user-agent'),
      });

      throw new UnauthorizedException('Authentication required');
    }

    // Add user to request object for use in proxy service
    const request = context.switchToHttp().getRequest();
    request.user = user;

    return user;
  }
}