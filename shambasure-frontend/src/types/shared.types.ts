import { z } from 'zod';

// ============================================================================
// SHARED ENUMS & SCHEMAS
// ============================================================================

/**
 * User roles in the system - MUST MATCH backend UserRole enum
 */
export const UserRoleSchema = z.enum(['USER', 'ADMIN', 'VERIFIER', 'AUDITOR']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Relationship types for next of kin - MUST MATCH backend RelationshipType enum
 */
export const RelationshipTypeSchema = z.enum([
  'SPOUSE',
  'EX_SPOUSE',
  'CHILD',
  'ADOPTED_CHILD',
  'STEPCHILD',
  'PARENT',
  'SIBLING',
  'HALF_SIBLING',
  'GRANDCHILD',
  'GRANDPARENT',
  'NIECE_NEPHEW',
  'AUNT_UNCLE',
  'COUSIN',
  'GUARDIAN',
  'OTHER',
]);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

/**
 * Address structure - MUST MATCH backend AddressDto
 */
export const AddressSchema = z.object({
  street: z.string().max(255, 'Street address cannot exceed 255 characters').optional(),
  city: z.string().max(100, 'City cannot exceed 100 characters').optional(),
  county: z.string().max(100, 'County cannot exceed 100 characters').optional(),
  postalCode: z.string().max(20, 'Postal code cannot exceed 20 characters').optional(),
  country: z // Country is required if the address object exists.
    .string()
    .min(1, 'Country is required')
    .max(100, 'Country cannot exceed 100 characters'),
});
export type Address = z.infer<typeof AddressSchema>;

// ============================================================================
// SHARED UTILITIES & CONSTANTS
// ============================================================================

/**
 * Human-readable labels for user roles
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: 'User',
  ADMIN: 'Administrator',
  VERIFIER: 'Verifier',
  AUDITOR: 'Auditor',
} as const;

/**
 * Human-readable labels for relationship types
 */
export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  SPOUSE: 'Spouse',
  EX_SPOUSE: 'Ex-Spouse',
  CHILD: 'Child',
  ADOPTED_CHILD: 'Adopted Child',
  STEPCHILD: 'Stepchild',
  PARENT: 'Parent',
  SIBLING: 'Sibling',
  HALF_SIBLING: 'Half-Sibling',
  GRANDCHILD: 'Grandchild',
  GRANDPARENT: 'Grandparent',
  NIECE_NEPHEW: 'Niece/Nephew',
  AUNT_UNCLE: 'Aunt/Uncle',
  COUSIN: 'Cousin',
  GUARDIAN: 'Legal Guardian',
  OTHER: 'Other',
} as const;

/**
 * Validates if a string is a valid user role
 */
export const isValidUserRole = (role: string): role is UserRole => {
  return UserRoleSchema.safeParse(role).success;
};

/**
 * Validates if a string is a valid relationship type
 */
export const isValidRelationshipType = (relationship: string): relationship is RelationshipType => {
  return RelationshipTypeSchema.safeParse(relationship).success;
};