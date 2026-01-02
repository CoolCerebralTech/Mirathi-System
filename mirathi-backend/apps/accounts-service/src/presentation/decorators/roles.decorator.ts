// src/presentation/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Metadata key for roles
 */
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 *
 * Specifies which roles are allowed to access a resolver.
 * Must be used with @UseGuards(GqlAuthGuard, GqlRolesGuard).
 *
 * @example
 * ```typescript
 * @Mutation(() => UserOutput)
 * @UseGuards(GqlAuthGuard, GqlRolesGuard)
 * @Roles(UserRole.ADMIN)
 * async suspendUser(@Args('userId') userId: string) {
 *   // Only ADMIN can execute
 * }
 * ```
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
