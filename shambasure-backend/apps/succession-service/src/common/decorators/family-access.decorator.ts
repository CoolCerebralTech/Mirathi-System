import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { FamilyMemberAccessGuard } from '../guards/family-member-access.guard';

/**
 * The metadata key used to store the required family access level.
 */
export const FAMILY_ACCESS_KEY = 'familyAccess';

/**
 * Defines the different levels of access a user can have within a family.
 */
export type FamilyAccessLevel = 'MEMBER' | 'CREATOR'; // We can add more roles like 'ADMIN' later

/**
 * A method decorator that protects a route by ensuring the authenticated user has
 * a specific level of access to the family specified in the request parameters.
 * It applies the FamilyMemberAccessGuard to perform the check.
 *
 * @param requiredAccess The level of access required to proceed.
 *
 * @example
 * // To ensure a user is at least a member of the family:
 * @Get(':familyId/members')
 * @UseGuards(JwtAuthGuard)
 * @FamilyAccess('MEMBER')
 * getFamilyMembers(@Param('familyId') familyId: string) { ... }
 *
 * // To ensure a user is the original creator of the family:
 * @Delete(':familyId')
 * @UseGuards(JwtAuthGuard)
 * @FamilyAccess('CREATOR')
 * deleteFamily(@Param('familyId') familyId: string) { ... }
 */
export const FamilyAccess = (requiredAccess: FamilyAccessLevel) =>
  applyDecorators(
    SetMetadata(FAMILY_ACCESS_KEY, requiredAccess),
    UseGuards(FamilyMemberAccessGuard),
  );
