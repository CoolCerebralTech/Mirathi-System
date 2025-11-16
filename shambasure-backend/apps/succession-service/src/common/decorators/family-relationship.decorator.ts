import { SetMetadata } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';

/**
 * The key used to store relationship metadata on a route handler.
 */
export const ALLOWED_RELATIONSHIPS_KEY = 'allowedRelationships';

/**
 * A method decorator to specify which `RelationshipType` values are permitted
 * for a particular route. This metadata is consumed by the FamilyRelationshipGuard.
 *
 * @param allowedRelationships An array of `RelationshipType` enums.
 *
 * @example
 * // In a controller:
 * @Post(':familyId/members')
 * @UseGuards(JwtAuthGuard, FamilyRelationshipGuard)
 * @AllowedRelationships(RelationshipType.SPOUSE, RelationshipType.CHILD)
 * createFamilyMember(@Body() dto: CreateMemberDto) { ... }
 */
export const AllowedRelationships = (...allowedRelationships: RelationshipType[]) =>
  SetMetadata(ALLOWED_RELATIONSHIPS_KEY, allowedRelationships);

/**
 * A composite decorator for convenience that restricts access to immediate family members.
 * This is a pre-configured version of @AllowedRelationships.
 * The list of what constitutes "immediate family" is determined inside the guard
 * by consuming our centralized constants, ensuring a single source of truth.
 */
export const ImmediateFamilyOnly = () => SetMetadata(ALLOWED_RELATIONSHIPS_KEY, 'IMMEDIATE_FAMILY');
