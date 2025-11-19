import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { FamilyMemberAccessGuard } from '../guards/family-member-access.guard';

/**
 * The metadata key used to store the required family access level.
 */
export const FAMILY_ACCESS_KEY = 'familyAccess';

/**
 * Defines the different levels of access a user can have within a family.
 */
export type FamilyAccessLevel = 'MEMBER' | 'CREATOR' | 'ADMIN'; // Added ADMIN for future use

export interface FamilyAccessOptions {
  level: FamilyAccessLevel;
  param?: string; // Custom parameter name (defaults to 'familyId')
  allowRoles?: string[]; // Global roles that bypass family access checks
}

/**
 * A method decorator that protects a route by ensuring the authenticated user has
 * a specific level of access to the family specified in the request parameters.
 * It applies the FamilyMemberAccessGuard to perform the check.
 *
 * @param options The access level required and optional configuration
 *
 * @example
 * // To ensure a user is at least a member of the family:
 * @Get(':familyId/members')
 * @FamilyAccess({ level: 'MEMBER' })
 * getFamilyMembers(@Param('familyId') familyId: string) { ... }
 *
 * // To ensure a user is the original creator of the family:
 * @Delete(':familyId')
 * @FamilyAccess({ level: 'CREATOR' })
 * deleteFamily(@Param('familyId') familyId: string) { ... }
 *
 * // With custom parameter and role bypass:
 * @Get('custom/:id/members')
 * @FamilyAccess({ level: 'MEMBER', param: 'id', allowRoles: ['ADMIN'] })
 * getCustomFamilyMembers(@Param('id') familyId: string) { ... }
 */
export const FamilyAccess = (options: FamilyAccessLevel | FamilyAccessOptions) => {
  const normalizedOptions = typeof options === 'string' ? { level: options } : options;

  return applyDecorators(
    SetMetadata(FAMILY_ACCESS_KEY, normalizedOptions),
    UseGuards(FamilyMemberAccessGuard),
  );
};

// ============================================================================
// DOMAIN-SPECIFIC SHORTCUTS
// ============================================================================

/**
 * Shortcut for family member access (user must be a member of the family)
 */
export const FamilyMember = (param: string = 'familyId') =>
  FamilyAccess({ level: 'MEMBER', param });

/**
 * Shortcut for family creator access (user must have created the family)
 */
export const FamilyCreator = (param: string = 'familyId') =>
  FamilyAccess({ level: 'CREATOR', param });

/**
 * Shortcut for administrative family access (admin roles can bypass)
 */
export const FamilyAdminAccess = (param: string = 'familyId') =>
  FamilyAccess({
    level: 'MEMBER',
    param,
    allowRoles: ['ADMIN', 'VERIFIER'],
  });
