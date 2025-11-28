import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../guards/roles.guard';

/**
 * The metadata key used to store the required roles for a route.
 */
export const ROLES_KEY = 'roles';

export interface RolesOptions {
  roles: UserRole[];
  requireAll?: boolean; // Whether all roles are required (default: false - any role)
  allowServiceAccounts?: boolean; // Allow service accounts to bypass (default: false)
}

/**
 * A method decorator to specify which `UserRole` values are required to access a route.
 * It applies the `RolesGuard` which performs the authorization check.
 *
 * @param options The role configuration or array of roles
 *
 * @example
 * // Simple usage with array of roles
 * @Get('admin/dashboard')
 * @Roles([UserRole.ADMIN])
 * getAdminDashboard() { ... }
 *
 * @example
 * // Advanced usage with options
 * @Post('probate/:caseId/issue-grant')
 * @Roles({
 *   roles: [UserRole.VERIFIER, UserRole.ADMIN],
 *   requireAll: false
 * })
 * issueGrant() { ... }
 */
export const Roles = (options: UserRole[] | RolesOptions) => {
  const normalizedOptions = Array.isArray(options) ? { roles: options } : options;

  return applyDecorators(SetMetadata(ROLES_KEY, normalizedOptions), UseGuards(RolesGuard));
};

// ============================================================================
// DOMAIN-SPECIFIC ROLE SHORTCUTS
// ============================================================================

/**
 * Administrative access - highest level system access
 */
export const AdminOnly = () => Roles([UserRole.ADMIN]);

/**
 * Verification team access - for document and identity verification
 */
export const VerifierAccess = () => Roles([UserRole.VERIFIER, UserRole.ADMIN]);

/**
 * Audit and compliance team access
 */
export const AuditorAccess = () => Roles([UserRole.AUDITOR, UserRole.ADMIN]);

/**
 * Court and legal officer access
 */
export const LegalOfficerAccess = () =>
  Roles([UserRole.VERIFIER, UserRole.ADMIN, UserRole.AUDITOR]);

/**
 * User-level access (basic authenticated users)
 */
export const UserAccess = () =>
  Roles([UserRole.USER, UserRole.VERIFIER, UserRole.ADMIN, UserRole.AUDITOR]);

/**
 * Strict verification only (no admin bypass)
 */
export const StrictVerifierOnly = () =>
  Roles({
    roles: [UserRole.VERIFIER],
    requireAll: false,
  });

/**
 * Multi-role requirement (must have all specified roles)
 */
export const MultiRoleRequired = (...roles: UserRole[]) =>
  Roles({
    roles,
    requireAll: true,
  });
