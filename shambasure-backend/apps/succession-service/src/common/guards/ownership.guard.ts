import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@shamba/database'; // Assuming this is how we access Prisma
import { CHECK_OWNERSHIP_KEY, OwnershipOptions } from '../decorators/ownership.decorator';
import { User } from '@prisma/client';

/**
 * A powerful, reusable guard that checks if the authenticated user is the owner
 * of a requested resource (e.g., a Will, an Asset, etc.).
 *
 * It is activated by the `@CheckOwnership()` decorator, which provides the
 * necessary context (what resource to check and where to find its ID).
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  private readonly logger = new Logger(OwnershipGuard.name);

  constructor(
    private readonly reflector: Reflector,
    // --- PERFECT INTEGRATION: Injects the PrismaService to talk to the database ---
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<OwnershipOptions>(CHECK_OWNERSHIP_KEY, context.getHandler());

    // If the decorator is not applied, the guard does nothing.
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      // This should be caught by a JwtAuthGuard first, but it's a safe fallback.
      this.logger.warn('OwnershipGuard was triggered without an authenticated user.');
      throw new ForbiddenException('Authentication is required to check resource ownership.');
    }

    // Extract the resource ID from the URL parameters (e.g., from '/wills/:willId')
    const resourceId = request.params[options.param];
    if (!resourceId) {
      this.logger.error(
        `OwnershipGuard failed: URL parameter '${options.param}' not found in request.`,
      );
      throw new NotFoundException(`Resource ID parameter '${options.param}' is missing.`);
    }

    // Determine the ownership field on the Prisma model to check against.
    // We can have smart defaults based on the resource type.
    const ownershipField = options.field || this.getDefaultOwnershipField(options.resource);

    // This is the core logic: query the database to check for ownership.
    const resource = await (this.prisma as any)[options.resource.toLowerCase()].findFirst({
      where: {
        id: resourceId,
        [ownershipField]: user.id,
      },
      select: {
        id: true, // We only need to select the ID to confirm existence.
      },
    });

    if (!resource) {
      // If the query returns null, it means one of two things:
      // 1. The resource doesn't exist at all.
      // 2. The resource exists, but the current user is NOT the owner.
      // For security, we do not differentiate. We simply deny access.
      throw new ForbiddenException('You do not have permission to access this resource.');
    }

    // If the resource was found, ownership is confirmed. Allow the request.
    return true;
  }

  /**
   * Provides smart defaults for the ownership field based on the resource type.
   * This makes our @CheckOwnership decorator cleaner to use.
   */
  private getDefaultOwnershipField(resource: OwnershipOptions['resource']): string {
    switch (resource) {
      case 'Will':
        return 'testatorId';
      case 'Asset':
        return 'ownerId';
      case 'Family':
        return 'creatorId';
      default:
        // This ensures that if we add a new resource, we are forced to define its ownership field.
        throw new Error(`No default ownership field defined for resource type: ${resource}`);
    }
  }
}
