import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, User } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * A generic Role-Based Access Control (RBAC) guard.
 *
 * It is activated by the `@Roles()` decorator, which specifies which roles are
 * required to access a specific route. The guard compares the user's roles
 * against the required roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the roles required for this route from the @Roles() decorator metadata.
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the @Roles() decorator is not used, the guard does nothing.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user || !user.role) {
      // This should be caught by an AuthGuard first, but it's a safe fallback.
      this.logger.warn(
        'RolesGuard was triggered, but no authenticated user or user role was found.',
      );
      throw new ForbiddenException(
        'You do not have the necessary permissions to access this resource.',
      );
    }

    // Check if the user's role is included in the list of roles required by the endpoint.
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. This resource requires one of the following roles: ${requiredRoles.join(', ')}.`,
      );
    }

    return true;
  }
}
