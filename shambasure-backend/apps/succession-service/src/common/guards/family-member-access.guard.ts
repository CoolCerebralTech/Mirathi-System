import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@shamba/database';
import { User } from '@prisma/client';
import { FAMILY_ACCESS_KEY, FamilyAccessLevel } from '../decorators/family-access.decorator';

/**
 * A guard that protects family-related endpoints by checking the user's
 * relationship and role within a specific family.
 *
 * It is activated by the `@FamilyAccess()` decorator, which specifies the required
 * access level ('MEMBER', 'CREATOR', etc.). The guard then queries the database
 * to verify the user's permissions.
 */
@Injectable()
export class FamilyMemberAccessGuard implements CanActivate {
  private readonly logger = new Logger(FamilyMemberAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAccess = this.reflector.get<FamilyAccessLevel>(
      FAMILY_ACCESS_KEY,
      context.getHandler(),
    );

    // If the decorator is not applied, the guard does nothing.
    if (!requiredAccess) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      this.logger.warn('FamilyMemberAccessGuard triggered without an authenticated user.');
      throw new ForbiddenException('Authentication is required to access family resources.');
    }

    const familyId = request.params.familyId || request.body.familyId;
    if (!familyId) {
      this.logger.warn(
        'FamilyMemberAccessGuard triggered, but no familyId was found in the request.',
      );
      // Let validation pipes handle missing IDs, but deny access here for safety.
      throw new ForbiddenException('A valid family ID must be provided.');
    }

    // --- The Core Logic: Check the database based on the required access level ---
    let hasAccess = false;
    switch (requiredAccess) {
      case 'CREATOR':
        // For 'CREATOR', we check the `creatorId` field on the `Family` model.
        const family = await this.prisma.family.findFirst({
          where: {
            id: familyId,
            creatorId: user.id,
          },
          select: { id: true },
        });
        hasAccess = !!family;
        break;

      case 'MEMBER':
        // For 'MEMBER', we check for an entry in the `FamilyMember` join table.
        const membership = await this.prisma.familyMember.findFirst({
          where: {
            familyId: familyId,
            userId: user.id,
          },
          select: { id: true },
        });
        hasAccess = !!membership;
        break;
    }

    if (!hasAccess) {
      throw new ForbiddenException(
        `Access denied. You do not have '${requiredAccess}' permissions for this family.`,
      );
    }

    return true;
  }
}
