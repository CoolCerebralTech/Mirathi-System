import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@shamba/common';
import { JwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the roles required by the @Roles() decorator for this route.
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Extract the user payload, which should have been attached by a preceding JwtAuthGuard.
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload | undefined = request.user;

    // --- Defensive Check ---
    // A user might not be present if the JwtAuthGuard is missing, or the token is invalid.
    // The `role` property might also be missing if the token is malformed.
    if (!user || !user.role) {
      throw new ForbiddenException('Cannot determine user role for authorization.');
    }

    // Check if the user's role is included in the list of required roles.
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);
    if (hasRequiredRole) {
      return true;
    }

    // If the check fails, throw a clear error.
    throw new ForbiddenException(
      `Access denied. Required role(s): ${requiredRoles.join(', ')}.`,
    );
  }
}