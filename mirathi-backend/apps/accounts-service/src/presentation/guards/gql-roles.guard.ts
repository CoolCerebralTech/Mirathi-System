// src/presentation/guards/gql-roles.guard.ts
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * GraphQL Roles Guard
 *
 * Checks if the authenticated user has the required role(s).
 * Works with @Roles() decorator.
 */
@Injectable()
export class GqlRolesGuard implements CanActivate {
  private readonly logger = new Logger(GqlRolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Extract user from GraphQL context
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.user;

    // If no user, deny access
    if (!user) {
      this.logger.warn('No user found in request context');
      return false;
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `User ${user.id} with role ${user.role} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`,
      );
    }

    return hasRole;
  }
}
