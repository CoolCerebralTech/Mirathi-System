import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '@shamba/auth';
import { ROLES_KEY, RolesOptions } from '../decorators/roles.decorator';

// Extended request type with user
interface RolesRequest extends Request {
  user: JwtPayload;
}

/**
 * A generic Role-Based Access Control (RBAC) guard.
 *
 * Features:
 * - Role-based access control with flexible configuration
 * - Support for "any role" or "all roles" requirements
 * - Service account bypass capability
 * - Comprehensive logging and error handling
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the role configuration from the @Roles() decorator metadata
    const options = this.reflector.getAllAndOverride<RolesOptions>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the @Roles() decorator is not used, the guard does nothing
    if (!options || !options.roles || options.roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RolesRequest>();
    const user = request.user;

    if (!user || !user.role) {
      this.logger.warn('RolesGuard triggered without authenticated user or user role');
      throw new ForbiddenException('Authentication is required to access this resource');
    }

    // Check service account bypass
    if (options.allowServiceAccounts && this.isServiceAccount(user)) {
      this.logger.debug(`Service account bypass granted for ${user.sub}`);
      return true;
    }

    // Perform role validation
    const hasRequiredRole = this.validateUserRoles(user.role, options);

    if (!hasRequiredRole) {
      this.logger.warn(
        `User ${user.sub} with role ${user.role} attempted to access resource requiring roles: ${options.roles.join(', ')}`,
      );

      const requirementType = options.requireAll ? 'all of' : 'one of';
      throw new ForbiddenException(
        `Access denied. This resource requires ${requirementType} the following roles: ${options.roles.join(', ')}.`,
        `Your role: ${user.role}`,
      );
    }

    this.logger.debug(`Role access granted for user ${user.sub} with role ${user.role}`);
    return true;
  }

  /**
   * Validate user roles against required roles
   */
  private validateUserRoles(userRole: UserRole, options: RolesOptions): boolean {
    const { roles, requireAll = false } = options;

    if (requireAll) {
      // User must have ALL specified roles (not typical for single-role systems)
      // In most systems, users have one role, so this would rarely be true
      return roles.includes(userRole) && roles.length === 1;
    } else {
      // User must have ANY of the specified roles (typical use case)
      return roles.includes(userRole);
    }
  }

  /**
   * Check if user is a service account (for bypass scenarios)
   */
  private isServiceAccount(user: JwtPayload): boolean {
    // Service accounts might have specific email patterns or metadata
    // This is a placeholder for actual service account detection logic
    return user.email?.endsWith('@service.shamba-sure.com') === true;
  }
}
