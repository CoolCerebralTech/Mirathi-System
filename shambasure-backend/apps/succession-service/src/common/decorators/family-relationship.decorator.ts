import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';
import { FamilyRelationshipGuard } from '../guards/family-relationship.guard';

/**
 * The key used to store relationship metadata on a route handler.
 */
export const ALLOWED_RELATIONSHIPS_KEY = 'allowedRelationships';

export type AllowedRelationshipsConfig =
  | RelationshipType[]
  | 'IMMEDIATE_FAMILY'
  | 'EXTENDED_FAMILY';

export interface RelationshipOptions {
  allowed: AllowedRelationshipsConfig;
  bodyField?: string; // Custom field name for relationship (defaults to 'relationship')
}

/**
 * A method decorator to specify which `RelationshipType` values are permitted
 * for a particular route. This metadata is consumed by the FamilyRelationshipGuard.
 *
 * @param options The allowed relationships configuration
 *
 * @example
 * // In a controller:
 * @Post(':familyId/members')
 * @AllowedRelationships({ allowed: [RelationshipType.SPOUSE, RelationshipType.CHILD] })
 * createFamilyMember(@Body() dto: CreateMemberDto) { ... }
 *
 * @Post(':familyId/members')
 * @AllowedRelationships({ allowed: 'IMMEDIATE_FAMILY' })
 * createImmediateFamilyMember(@Body() dto: CreateMemberDto) { ... }
 */
export const AllowedRelationships = (options: RelationshipOptions | RelationshipType[]) => {
  const normalizedOptions = Array.isArray(options) ? { allowed: options } : options;

  return applyDecorators(
    SetMetadata(ALLOWED_RELATIONSHIPS_KEY, normalizedOptions),
    UseGuards(FamilyRelationshipGuard),
  );
};

// ============================================================================
// DOMAIN-SPECIFIC SHORTCUTS
// ============================================================================

/**
 * A composite decorator for convenience that restricts access to immediate family members.
 */
export const ImmediateFamilyOnly = (bodyField?: string) =>
  AllowedRelationships({
    allowed: 'IMMEDIATE_FAMILY',
    bodyField,
  });

/**
 * A composite decorator for extended family relationships.
 */
export const ExtendedFamilyOnly = (bodyField?: string) =>
  AllowedRelationships({
    allowed: 'EXTENDED_FAMILY',
    bodyField,
  });

/**
 * Shortcut for spouse relationships only.
 */
export const SpouseOnly = (bodyField?: string) =>
  AllowedRelationships({
    allowed: [RelationshipType.SPOUSE],
    bodyField,
  });

/**
 * Shortcut for parent-child relationships.
 */
export const ParentChildOnly = (bodyField?: string) =>
  AllowedRelationships({
    allowed: [
      RelationshipType.PARENT,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
    ],
    bodyField,
  });

/**
 * Shortcut for sibling relationships.
 */
export const SiblingsOnly = (bodyField?: string) =>
  AllowedRelationships({
    allowed: [RelationshipType.SIBLING, RelationshipType.HALF_SIBLING],
    bodyField,
  });
