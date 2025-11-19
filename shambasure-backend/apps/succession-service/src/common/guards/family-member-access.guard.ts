import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '@shamba/database';
import { JwtPayload } from '@shamba/auth';
import {
  FAMILY_ACCESS_KEY,
  FamilyAccessOptions,
} from '../decorators/family-member-access.decorator';

// Extended request type with typed params and body
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  params: Record<string, string>;
  body: Record<string, unknown>;
}

/**
 * A guard that protects family-related endpoints by checking the user's
 * relationship and role within a specific family.
 *
 * Features:
 * - Membership validation (user is a family member)
 * - Creator validation (user created the family)
 * - Role-based bypass for administrative functions
 * - Flexible parameter naming
 */
@Injectable()
export class FamilyMemberAccessGuard implements CanActivate {
  private readonly logger = new Logger(FamilyMemberAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<FamilyAccessOptions>(
      FAMILY_ACCESS_KEY,
      context.getHandler(),
    );

    // If the decorator is not applied, the guard does nothing.
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      this.logger.warn('FamilyMemberAccessGuard triggered without an authenticated user.');
      throw new ForbiddenException('Authentication is required to access family resources.');
    }

    // Check if user has global role bypass
    if (options.allowRoles && this.hasGlobalRoleBypass(user, options.allowRoles)) {
      this.logger.debug(
        `Family access bypass granted for user ${user.sub} with role: ${user.role}`,
      );
      return true;
    }

    // Extract family ID from request parameters with proper typing
    const paramName = options.param || 'familyId';
    const familyId = this.extractFamilyId(request, paramName);

    if (!familyId) {
      this.logger.error(`Family ID parameter '${paramName}' not found in request`);
      throw new NotFoundException(`Family ID parameter '${paramName}' is required`);
    }

    // Verify the family exists
    const familyExists = await this.prisma.family.findFirst({
      where: {
        id: familyId,
        deletedAt: null, // Only consider non-deleted families
      },
      select: { id: true },
    });

    if (!familyExists) {
      this.logger.warn(`User ${user.sub} attempted to access non-existent family: ${familyId}`);
      throw new NotFoundException('Family not found');
    }

    // Check family access based on required level
    const hasAccess = await this.checkFamilyAccess(familyId, user.sub, options.level);

    if (!hasAccess) {
      this.logger.warn(`User ${user.sub} lacks '${options.level}' access for family ${familyId}`);
      throw new ForbiddenException(
        `Access denied. You do not have '${options.level}' permissions for this family.`,
      );
    }

    this.logger.debug(`Family access granted for user ${user.sub} at level '${options.level}'`);
    return true;
  }

  /**
   * Extract family ID from request with proper typing
   */
  private extractFamilyId(request: AuthenticatedRequest, paramName: string): string | null {
    // Check params first (type-safe)
    const paramValue = request.params[paramName];
    if (paramValue && typeof paramValue === 'string') {
      return paramValue;
    }

    // Check body as fallback (type-safe)
    const bodyValue = request.body[paramName];
    if (bodyValue && typeof bodyValue === 'string') {
      return bodyValue;
    }

    return null;
  }

  /**
   * Check if user has global role that bypasses family access requirements
   */
  private hasGlobalRoleBypass(user: JwtPayload, allowedRoles: string[]): boolean {
    return allowedRoles.includes(user.role);
  }

  /**
   * Check family access based on the required level
   */
  private async checkFamilyAccess(
    familyId: string,
    userId: string,
    accessLevel: FamilyAccessOptions['level'],
  ): Promise<boolean> {
    // Use type assertion to fix the "never" type issue
    const level = accessLevel as string;

    switch (accessLevel) {
      case 'CREATOR':
        return await this.checkFamilyCreator(familyId, userId);

      case 'MEMBER':
        return await this.checkFamilyMembership(familyId, userId);

      case 'ADMIN':
        // For now, ADMIN is equivalent to CREATOR
        return await this.checkFamilyCreator(familyId, userId);

      default:
        this.logger.error(`Unsupported family access level: ${level}`);
        return false;
    }
  }

  /**
   * Check if user is the creator of the family
   */
  private async checkFamilyCreator(familyId: string, userId: string): Promise<boolean> {
    try {
      const family = await this.prisma.family.findFirst({
        where: {
          id: familyId,
          creatorId: userId,
          deletedAt: null,
        },
        select: { id: true },
      });

      return !!family;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error checking family creator: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Check if user is a member of the family
   * Note: Family creator is automatically considered a member
   */
  private async checkFamilyMembership(familyId: string, userId: string): Promise<boolean> {
    try {
      // First check if user is the creator
      const isCreator = await this.checkFamilyCreator(familyId, userId);
      if (isCreator) {
        return true;
      }

      // Then check family membership
      const membership = await this.prisma.familyMember.findFirst({
        where: {
          familyId: familyId,
          userId: userId,
          deletedAt: null,
        },
        select: { id: true },
      });

      return !!membership;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error checking family membership: ${errorMessage}`);
      return false;
    }
  }
}
