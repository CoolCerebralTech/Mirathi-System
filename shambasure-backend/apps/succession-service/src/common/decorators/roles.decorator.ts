import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../guards/roles.guard';

/**
 * The metadata key used to store the required roles for a route.
 */
export const ROLES_KEY = 'roles';

/**
 * A method decorator to specify which `UserRole` values are required to access a route.
 * It applies the `RolesGuard` which performs the authorization check.
 *
 * @param roles An array of `UserRole` enums.
 *
 * @example
 * // In a controller, to protect an admin-only endpoint:
 * @Get('admin/dashboard')
 * @UseGuards(JwtAuthGuard)
 * @Roles(UserRole.ADMIN)
 * getAdminDashboard() { ... }
 *
 * @example
 * // To protect a court-level endpoint:
 * @Post('probate/:caseId/issue-grant')
 * @UseGuards(JwtAuthGuard)
 * @Roles(UserRole.VERIFIER, UserRole.ADMIN)
 * issueGrant() { ... }
 */
export const Roles = (...roles: UserRole[]) =>
  applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(RolesGuard));
